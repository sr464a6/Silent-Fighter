/* =========================================================
   SILENT FIGHTER - APP.JS
   Game (requestAnimationFrame) + Supabase leaderboard
   ========================================================= */

/* ---------- SUPABASE ---------- */
/* Pakai Project URL + PUBLISHABLE key. JANGAN taruh sb_secret_... di frontend. */
const SUPABASE_URL = "https://fvbknjeakxyypqdzhiif.supabase.co";
const SUPABASE_ANON_KEY = "MASUKKAN_PUBLISHABLE_KEY_DISINI";

let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.warn("Supabase tidak tersedia:", e);
}

/* ---------- SPRITES (SVG, mengikuti gambar Pygame) ---------- */
const SKIN = "#b4825f";

const SPRITES = {
    /* Silent Fighter: kemeja putih, celana hitam, rambut abu-abu */
    player: `
<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="31" y="130" width="15" height="62" fill="#141414"/>
  <rect x="54" y="130" width="15" height="62" fill="#141414"/>
  <rect x="26" y="187" width="24" height="9" fill="#19192a"/>
  <rect x="53" y="187" width="25" height="9" fill="#19192a"/>
  <g class="arm-rest" stroke="${SKIN}" stroke-width="11" stroke-linecap="round">
    <line x1="28" y1="82" x2="15" y2="132"/><line x1="72" y1="82" x2="85" y2="132"/>
  </g>
  <rect x="23" y="65" width="54" height="70" fill="#f5f5f5" stroke="#cfcfcf" stroke-width="1"/>
  <g fill="#5a5a5a"><circle cx="50" cy="77" r="2"/><circle cx="50" cy="94" r="2"/><circle cx="50" cy="111" r="2"/></g>
  <g class="arm-punch">
    <line x1="68" y1="80" x2="97" y2="80" stroke="${SKIN}" stroke-width="13" stroke-linecap="round"/>
    <circle cx="98" cy="80" r="9" fill="${SKIN}"/>
  </g>
  <rect x="41" y="50" width="18" height="20" fill="${SKIN}"/>
  <ellipse cx="50" cy="37" rx="22" ry="22.5" fill="${SKIN}"/>
  <path d="M28 36 A22 22 0 0 1 72 36" fill="none" stroke="#5a5a5a" stroke-width="7"/>
  <circle cx="58" cy="38" r="2.6" fill="#141414"/>
</svg>`,

    /* The Corruptor: jas hitam, kemeja putih, dasi merah, kacamata gelap */
    corruptor: `
<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="31" y="130" width="15" height="62" fill="#141414" stroke="#3a3a3a"/>
  <rect x="54" y="130" width="15" height="62" fill="#141414" stroke="#3a3a3a"/>
  <rect x="25" y="187" width="25" height="9" fill="#19192a" stroke="#3a3a3a"/>
  <rect x="53" y="187" width="26" height="9" fill="#19192a" stroke="#3a3a3a"/>
  <g class="arm-rest" stroke="#141414" stroke-width="12" stroke-linecap="round">
    <line x1="27" y1="80" x2="15" y2="130"/><line x1="73" y1="80" x2="85" y2="130"/>
  </g>
  <rect x="22" y="65" width="56" height="70" fill="#141414" stroke="#444" stroke-width="1.5"/>
  <polygon points="40,65 60,65 54,120 46,120" fill="#f5f5f5"/>
  <polygon points="46,70 54,70 55,110 50,119 45,110" fill="#be2828"/>
  <g class="arm-punch">
    <line x1="68" y1="80" x2="92" y2="80" stroke="#141414" stroke-width="14" stroke-linecap="round"/>
    <circle cx="98" cy="80" r="9" fill="${SKIN}"/>
  </g>
  <rect x="41" y="50" width="18" height="20" fill="${SKIN}"/>
  <ellipse cx="50" cy="37" rx="22" ry="22.5" fill="${SKIN}"/>
  <path d="M28 36 A22 22 0 0 1 72 36" fill="none" stroke="#141414" stroke-width="8"/>
  <rect x="31" y="30" width="16" height="8" fill="#0a0a0a" stroke="#555" stroke-width=".6"/>
  <rect x="53" y="30" width="16" height="8" fill="#0a0a0a" stroke="#555" stroke-width=".6"/>
  <line x1="47" y1="34" x2="53" y2="34" stroke="#0a0a0a" stroke-width="3"/>
</svg>`
};

function renderSprites() {
    document.querySelectorAll("[data-sprite]").forEach(function (el) {
        el.innerHTML = SPRITES[el.dataset.sprite] || "";
    });
}

/* ---------- KONSTANTA ---------- */
const MAX_HP = 100;
const PLAYER_DAMAGE = 10;
const POWER_DAMAGE = 20;
const ENEMY_DAMAGE = 8;

const ATTACK_COOLDOWN = 350;
const POWER_COOLDOWN = 800;
const JUMP_TIME = 550;

/* Semua jarak/kecepatan dalam "u" = lebar 1 karakter, jadi pas di layar HP maupun desktop */
const REACH = 1.7;
const POWER_REACH = 2.0;
const MIN_GAP = 0.75;
const PLAYER_SPEED = 4.6;      // u per detik
const ENEMY_SPEED = 2.6;
const ENEMY_ENGAGE = 1.55;
const ENEMY_WINDUP = 330;      // ms (telegraph sebelum memukul)

/* ---------- STATE ---------- */
const game = {
    running: false, ended: false,
    playerHp: MAX_HP, enemyHp: MAX_HP,
    score: 0, combo: 0, maxCombo: 0, damage: 0,
    px: 0.2, ex: 0.8,                // posisi tengah karakter (0..1 lebar arena)
    pDir: 1, eDir: -1,
    lastAttack: 0, jumpUntil: 0, freezeUntil: 0,
    enemyState: "idle", enemyUntil: 0, enemyReady: 0, enemyPower: false,
    comboTimer: null
};

const input = { left: false, right: false };
const $ = function (id) { return document.getElementById(id); };

let rafId = 0;
let lastTime = 0;
let metrics = { w: 800, u: 100 };

function measure() {
    const arena = $("arena");
    const player = $("player");
    if (!arena || !player) { return; }
    const w = arena.clientWidth;
    const u = player.offsetWidth;
    if (w > 0 && u > 0) { metrics = { w: w, u: u }; }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", function () {
    renderSprites();
    setupKeyboard();
    setupTouch();
    loadLeaderboard();
    window.addEventListener("resize", function () { measure(); positionCharacters(); });
    window.addEventListener("orientationchange", function () { setTimeout(function () { measure(); positionCharacters(); }, 250); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) { releaseInput(); } });
    document.addEventListener("contextmenu", function (e) { if (e.target.closest(".arena, .touch-controls")) { e.preventDefault(); } });
});

/* ---------- SCREEN ---------- */
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
    const target = $(screenId);
    if (target) { target.classList.add("active"); }
    document.body.classList.toggle("playing", screenId === "gameScreen");
    if (screenId !== "gameScreen") { window.scrollTo(0, 0); }
    if (screenId === "leaderboardScreen") { loadLeaderboard(); }
}

/* ---------- START / RESTART / EXIT ---------- */
function startGame() {
    cancelAnimationFrame(rafId);
    releaseInput();
    clearTimeout(game.comboTimer);

    Object.assign(game, {
        running: true, ended: false,
        playerHp: MAX_HP, enemyHp: MAX_HP,
        score: 0, combo: 0, maxCombo: 0, damage: 0,
        px: 0.2, ex: 0.8, pDir: 1, eDir: -1,
        lastAttack: 0, jumpUntil: 0,
        enemyState: "idle", enemyUntil: 0, enemyReady: performance.now() + 1600,
        freezeUntil: performance.now() + 900
    });

    ["player", "enemy"].forEach(function (id) {
        const fx = $(id).querySelector(".fx");
        fx.className = "fx";
    });

    showScreen("gameScreen");
    measure();
    updateUI();
    positionCharacters();
    showGameMessage("FIGHT!", 800);

    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
}

function restartGame() { startGame(); }

function exitGame() {
    game.running = false;
    cancelAnimationFrame(rafId);
    releaseInput();
    showScreen("menuScreen");
}

/* ---------- LOOP ---------- */
function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!game.running || game.ended) { return; }
    if (metrics.u < 20) { measure(); }
    if (now < game.freezeUntil) { return; }

    const k = metrics.u / metrics.w;          // 1u dalam satuan lebar arena
    const margin = 0.6 * k;

    /* --- gerak player --- */
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
        game.pDir = dir;
        game.px += dir * PLAYER_SPEED * k * dt;
    }
    game.px = clamp(game.px, margin, 1 - margin);

    /* --- enemy AI --- */
    enemyUpdate(now, dt, k);

    /* jaga jarak minimal supaya tidak menumpuk */
    const gap = MIN_GAP * k;
    if (game.px < game.ex) { game.px = Math.min(game.px, game.ex - gap); }
    else { game.px = Math.max(game.px, game.ex + gap); }
    game.px = clamp(game.px, margin, 1 - margin);

    /* musuh selalu menghadap player; player menghadap musuh saat diam */
    game.eDir = game.px < game.ex ? -1 : 1;
    if (dir === 0) { game.pDir = game.ex > game.px ? 1 : -1; }

    positionCharacters();
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function distU() {
    return Math.abs(game.px - game.ex) * metrics.w / metrics.u;
}

/* ---------- ENEMY ---------- */
function enemyUpdate(now, dt, k) {
    const margin = 0.6 * k;
    const dist = distU();
    const dir = game.px < game.ex ? -1 : 1;

    if (game.enemyState === "idle") {
        if (dist > ENEMY_ENGAGE) {
            game.ex += dir * ENEMY_SPEED * k * dt;
            game.ex = clamp(game.ex, margin, 1 - margin);
        } else if (now >= game.enemyReady) {
            game.enemyPower = Math.random() < 0.25;
            game.enemyState = "windup";
            game.enemyUntil = now + (game.enemyPower ? ENEMY_WINDUP + 220 : ENEMY_WINDUP);
            restartAnim($("enemy").querySelector(".fx"), "windup");
        }
    } else if (game.enemyState === "windup") {
        if (now >= game.enemyUntil) { enemyStrike(now); }
    } else if (game.enemyState === "recover") {
        if (now >= game.enemyReady) { game.enemyState = "idle"; }
    }
}

function enemyStrike(now) {
    const enemyFx = $("enemy").querySelector(".fx");
    enemyFx.classList.remove("windup");
    restartAnim(enemyFx, "attacking");
    restartAnim($("enemy").querySelector(".slash"), "show");

    game.enemyState = "recover";
    game.enemyReady = now + 750 + Math.random() * 600;

    const reach = game.enemyPower ? POWER_REACH : REACH;
    if (distU() > reach + 0.15) { return; }

    if (now < game.jumpUntil) {
        floatText("player", "DODGE!", "#57e389");
        return;
    }

    const dmg = game.enemyPower ? ENEMY_DAMAGE + 4 : ENEMY_DAMAGE;
    game.playerHp = Math.max(0, game.playerHp - dmg);
    game.score = Math.max(0, game.score - 20);

    restartAnim($("player").querySelector(".fx"), "hit");
    floatText("player", "-" + dmg, "#f04444");
    shake();
    updateUI();
    if (navigator.vibrate) { navigator.vibrate(40); }

    if (game.playerHp <= 0) { loseGame(); }
}

/* ---------- PLAYER ACTIONS ---------- */
function jumpPlayer() {
    const now = performance.now();
    if (!game.running || game.ended || now < game.freezeUntil || now < game.jumpUntil) { return; }
    game.jumpUntil = now + JUMP_TIME;
    const fx = $("player").querySelector(".fx");
    restartAnim(fx, "jumping");
}

function playerAttack(power) {
    const now = performance.now();
    if (!game.running || game.ended || now < game.freezeUntil) { return; }

    const cooldown = power ? POWER_COOLDOWN : ATTACK_COOLDOWN;
    if (now - game.lastAttack < cooldown) { return; }
    game.lastAttack = now;

    /* otomatis menghadap musuh saat menyerang */
    game.pDir = game.ex > game.px ? 1 : -1;
    positionCharacters();

    restartAnim($("player").querySelector(".fx"), "attacking");
    restartAnim($("player").querySelector(".slash"), "show");

    const reach = power ? POWER_REACH : REACH;
    if (distU() > reach) {
        resetCombo();
        return;
    }
    dealDamageToEnemy(power ? POWER_DAMAGE : PLAYER_DAMAGE, power);
}

function dealDamageToEnemy(damage, power) {
    if (game.ended) { return; }

    game.enemyHp = Math.max(0, game.enemyHp - damage);
    game.damage += damage;
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    game.score += damage * 10;

    clearTimeout(game.comboTimer);
    game.comboTimer = setTimeout(resetCombo, 1200);

    /* serangan mengganggu rencana musuh */
    if (game.enemyState === "windup" && power) {
        game.enemyState = "recover";
        game.enemyReady = performance.now() + 600;
        $("enemy").querySelector(".fx").classList.remove("windup");
    }

    showCombo();
    restartAnim($("enemy").querySelector(".fx"), "hit");
    floatText("enemy", "-" + damage, "#ffd166");
    if (power) { shake(); }
    updateUI();

    if (game.enemyHp <= 0) { winGame(); }
}

function resetCombo() {
    game.combo = 0;
    updateUI();
}

/* ---------- INPUT: KEYBOARD ---------- */
function releaseInput() {
    input.left = false;
    input.right = false;
    document.querySelectorAll(".tbtn.on").forEach(function (b) { b.classList.remove("on"); });
}

function setupKeyboard() {
    document.addEventListener("keydown", function (event) {
        if (event.target && /input|textarea/i.test(event.target.tagName)) { return; }
        const key = event.key.toLowerCase();

        if (key === "escape") { if (game.running) { exitGame(); } return; }
        if (key === "r") { if (game.running) { restartGame(); } return; }
        if (!game.running || game.ended) { return; }

        if (["arrowleft", "arrowright", "arrowup", " "].includes(key)) { event.preventDefault(); }
        if (event.repeat) { return; }

        switch (key) {
            case "a": case "arrowleft":  input.left = true; break;
            case "d": case "arrowright": input.right = true; break;
            case "w": case "arrowup": case " ": jumpPlayer(); break;
            case "j": playerAttack(false); break;
            case "k": playerAttack(true); break;
        }
    });

    document.addEventListener("keyup", function (event) {
        const key = event.key.toLowerCase();
        if (key === "a" || key === "arrowleft")  { input.left = false; }
        if (key === "d" || key === "arrowright") { input.right = false; }
    });

    window.addEventListener("blur", releaseInput);
}

/* ---------- INPUT: SENTUH ---------- */
function setupTouch() {
    document.querySelectorAll(".tbtn").forEach(function (btn) {
        const act = btn.dataset.act;

        function press(e) {
            e.preventDefault();
            try { btn.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
            btn.classList.add("on");
            if (act === "left")   { input.left = true; }
            if (act === "right")  { input.right = true; }
            if (act === "jump")   { jumpPlayer(); }
            if (act === "attack") { playerAttack(false); }
            if (act === "power")  { playerAttack(true); }
        }

        function release(e) {
            e.preventDefault();
            btn.classList.remove("on");
            if (act === "left")  { input.left = false; }
            if (act === "right") { input.right = false; }
        }

        btn.addEventListener("pointerdown", press);
        btn.addEventListener("pointerup", release);
        btn.addEventListener("pointercancel", release);
        btn.addEventListener("lostpointercapture", release);
    });
}

/* ---------- TAMPILAN ---------- */
function positionCharacters() {
    const player = $("player");
    const enemy = $("enemy");
    if (!player || !enemy) { return; }

    player.style.left = (game.px * 100) + "%";
    enemy.style.left = (game.ex * 100) + "%";
    player.style.setProperty("--dir", game.pDir);
    enemy.style.setProperty("--dir", game.eDir);
}

function restartAnim(el, cls) {
    if (!el) { return; }
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    if (cls === "attacking" || cls === "hit") {
        setTimeout(function () { el.classList.remove(cls); }, 260);
    } else if (cls === "jumping") {
        setTimeout(function () { el.classList.remove(cls); }, JUMP_TIME + 30);
    }
}

function floatText(who, text, color) {
    const arena = $("arena");
    const el = $(who);
    if (!arena || !el) { return; }

    const t = document.createElement("div");
    t.className = "float-text";
    t.textContent = text;
    t.style.color = color;
    t.style.left = el.style.left;
    t.style.top = (el.offsetTop - 6) + "px";
    arena.appendChild(t);
    setTimeout(function () { t.remove(); }, 750);
}

function shake() {
    const arena = $("arena");
    arena.classList.remove("shake");
    void arena.offsetWidth;
    arena.classList.add("shake");
}

function showCombo() {
    const popup = $("comboPopup");
    if (!popup || game.combo <= 1) { return; }
    popup.textContent = game.combo + " HIT COMBO!";
    restartAnim(popup, "show");
}

function showGameMessage(text, ms) {
    const m = $("gameMessage");
    if (!m) { return; }
    m.textContent = text;
    m.classList.remove("hidden");
    setTimeout(function () { m.classList.add("hidden"); }, ms);
}

function updateUI() {
    $("playerHpText").textContent = game.playerHp;
    $("enemyHpText").textContent = game.enemyHp;
    $("score").textContent = game.score;
    $("combo").textContent = game.combo;

    const ph = $("playerHealth");
    const eh = $("enemyHealth");
    ph.style.width = game.playerHp + "%";
    eh.style.width = game.enemyHp + "%";
    ph.classList.toggle("low", game.playerHp <= 25);
    eh.classList.toggle("low", game.enemyHp <= 25);
}

/* ---------- WIN / LOSE ---------- */
function winGame() {
    if (game.ended) { return; }
    game.ended = true;
    game.running = false;
    releaseInput();
    game.score += 1000;
    updateUI();
    showGameMessage("K.O.!", 900);
    setTimeout(function () { showResult(true); }, 1000);
}

function loseGame() {
    if (game.ended) { return; }
    game.ended = true;
    game.running = false;
    releaseInput();
    showGameMessage("K.O.!", 900);
    setTimeout(function () { showResult(false); }, 1000);
}

function showResult(victory) {
    $("resultIcon").textContent = victory ? "🏆" : "💀";
    $("resultTitle").textContent = victory ? "VICTORY" : "GAME OVER";
    $("resultSubtitle").textContent = victory ? "The silence has been broken." : "The Corruptor has won.";
    $("finalScore").textContent = game.score;
    $("finalCombo").textContent = game.maxCombo;
    $("finalDamage").textContent = game.damage;
    $("playerName").value = "";
    showScreen("resultScreen");
}

/* ---------- LEADERBOARD ---------- */
async function saveScore() {
    let name = $("playerName").value.trim() || "Anonymous";
    name = name.substring(0, 20);

    try {
        if (!supabaseClient) { throw new Error("Supabase belum terhubung"); }

        const result = await supabaseClient.from("leaderboard").insert([{
            player_name: name,
            score: game.score,
            max_combo: game.maxCombo,
            damage: game.damage
        }]);
        if (result.error) { throw result.error; }

        showToast("Score berhasil disimpan!");
        showScreen("leaderboardScreen");
    } catch (error) {
        console.error(error);
        showToast("Gagal menyimpan score: " + error.message, true);
    }
}

async function loadLeaderboard() {
    const list = $("leaderboardList");
    if (!list) { return; }
    list.innerHTML = '<div class="loading">Loading leaderboard...</div>';

    try {
        if (!supabaseClient) { throw new Error("Supabase belum terhubung"); }

        const result = await supabaseClient.from("leaderboard").select("*")
            .order("score", { ascending: false }).limit(50);
        if (result.error) { throw result.error; }

        const data = result.data || [];
        if (data.length === 0) {
            list.innerHTML = '<div class="loading">Belum ada score. Jadilah fighter pertama!</div>';
            return;
        }

        list.innerHTML = data.map(function (p, i) {
            return '<div class="leaderboard-row">' +
                '<span class="rank">' + (i + 1) + '</span>' +
                '<span class="player-rank"><span class="rank-avatar">' + (i === 0 ? "👑" : "🥷") + '</span>' +
                '<strong>' + escapeHtml(p.player_name) + '</strong></span>' +
                '<span class="leader-score">' + Number(p.score).toLocaleString("id-ID") + '</span>' +
                '<span class="leader-combo">' + escapeHtml(p.max_combo) + '</span>' +
                '<span class="leader-date">' + formatDate(p.created_at) + '</span>' +
                '</div>';
        }).join("");
    } catch (error) {
        console.error(error);
        list.innerHTML = '<div class="loading">Gagal mengambil leaderboard.<br><br>' + escapeHtml(error.message) + '</div>';
    }
}

function formatDate(value) {
    if (!value) { return "-"; }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) { return "-"; }
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ---------- TOAST & UTIL ---------- */
let toastTimeout = null;

function showToast(message, error) {
    const toast = $("toast");
    if (!toast) { return; }
    toast.textContent = message;
    toast.className = "toast show" + (error ? " error" : "");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () { toast.classList.remove("show"); }, 3000);
}

function escapeHtml(value) {
    if (value === null || value === undefined) { return ""; }
    return String(value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* ---------- GLOBAL (dipakai onclick di HTML) ---------- */
window.startGame = startGame;
window.restartGame = restartGame;
window.exitGame = exitGame;
window.showScreen = showScreen;
window.saveScore = saveScore;
window.loadLeaderboard = loadLeaderboard;
