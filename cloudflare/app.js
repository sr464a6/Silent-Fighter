/* =========================================================
   SILENT FIGHTER
   APP.JS
   GAME + SUPABASE
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

/*
    GANTI dengan Project URL dan PUBLISHABLE KEY kamu.

    JANGAN gunakan:

    sb_secret_...

    Secret key tidak boleh masuk frontend.
*/

const SUPABASE_URL =
    "https://fvbknjeakxyypqdzhiif.supabase.co";

const SUPABASE_ANON_KEY =
    "MASUKKAN_PUBLISHABLE_KEY_DISINI";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =========================================================
   GAME STATE
   ========================================================= */

const game = {

    running: false,

    ended: false,

    playerHp: 100,

    enemyHp: 100,

    score: 0,

    combo: 0,

    maxCombo: 0,

    damage: 0,

    playerX: 18,

    enemyX: 18,

    playerDirection: 1,

    enemyDirection: -1,

    lastAttack: 0,

    enemyLastAttack: 0,

    enemyTimer: null,

    comboTimer: null

};


/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_HP = 100;

const PLAYER_DAMAGE = 10;

const POWER_DAMAGE = 20;

const ENEMY_DAMAGE = 8;

const ATTACK_COOLDOWN = 350;

const POWER_COOLDOWN = 800;


/* =========================================================
   DOM
   ========================================================= */

const $ = function (id) {

    return document.getElementById(id);

};


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupKeyboard();

        loadLeaderboard();

    }
);


/* =========================================================
   SCREEN
   ========================================================= */

function showScreen(
    screenId
) {

    document
        .querySelectorAll(".screen")
        .forEach(
            function (screen) {

                screen.classList.remove(
                    "active"
                );

            }
        );


    const target =
        $(screenId);


    if (target) {

        target.classList.add(
            "active"
        );

    }


    if (
        screenId ===
        "leaderboardScreen"
    ) {

        loadLeaderboard();

    }

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    stopEnemyAI();


    game.running = true;

    game.ended = false;

    game.playerHp = MAX_HP;

    game.enemyHp = MAX_HP;

    game.score = 0;

    game.combo = 0;

    game.maxCombo = 0;

    game.damage = 0;

    game.playerX = 18;

    game.enemyX = 18;

    game.playerDirection = 1;

    game.enemyDirection = -1;

    game.lastAttack = 0;

    game.enemyLastAttack = 0;


    showScreen(
        "gameScreen"
    );


    updateUI();

    positionCharacters();

    clearGameMessage();

    startEnemyAI();

}


/* =========================================================
   RESTART
   ========================================================= */

function restartGame() {

    startGame();

}


/* =========================================================
   EXIT
   ========================================================= */

function exitGame() {

    stopEnemyAI();

    game.running = false;

    showScreen(
        "menuScreen"
    );

}


/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        function (event) {

            const key =
                event.key.toLowerCase();


            if (
                key === "escape"
            ) {

                if (
                    game.running
                ) {

                    exitGame();

                }

                return;

            }


            if (
                key === "r"
            ) {

                if (
                    game.running
                ) {

                    restartGame();

                }

                return;

            }


            if (
                !game.running ||
                game.ended
            ) {

                return;

            }


            switch (key) {

                case "a":

                    movePlayer(-1);

                    break;


                case "d":

                    movePlayer(1);

                    break;


                case "w":

                    jumpPlayer();

                    break;


                case "j":

                    playerAttack(
                        false
                    );

                    break;


                case "k":

                    playerAttack(
                        true
                    );

                    break;

            }

        }
    );

}


/* =========================================================
   MOVE PLAYER
   ========================================================= */

function movePlayer(
    direction
) {

    if (
        !game.running ||
        game.ended
    ) {

        return;

    }


    game.playerDirection =
        direction;


    game.playerX +=
        direction * 3;


    game.playerX =
        Math.max(
            5,
            Math.min(
                75,
                game.playerX
            )
        );


    positionCharacters();

}


/* =========================================================
   POSITION
   ========================================================= */

function positionCharacters() {

    const player =
        $("player");

    const enemy =
        $("enemy");


    if (!player || !enemy) {

        return;

    }


    player.style.left =
        game.playerX + "%";


    enemy.style.right =
        game.enemyX + "%";


    if (
        game.playerDirection <
        0
    ) {

        player.style.transform =
            "scaleX(-1)";

    }

    else {

        player.style.transform =
            "scaleX(1)";

    }


    if (
        game.enemyDirection >
        0
    ) {

        enemy.style.transform =
            "scaleX(-1)";

    }

    else {

        enemy.style.transform =
            "scaleX(1)";

    }

}


/* =========================================================
   JUMP
   ========================================================= */

function jumpPlayer() {

    const player =
        $("player");


    if (!player) {
        return;
    }


    if (
        player.classList.contains(
            "jumping"
        )
    ) {

        return;

    }


    player.classList.add(
        "jumping"
    );


    setTimeout(
        function () {

            player.classList.remove(
                "jumping"
            );

        },
        450
    );

}


/* =========================================================
   PLAYER ATTACK
   ========================================================= */

function playerAttack(
    power
) {

    if (
        !game.running ||
        game.ended
    ) {

        return;

    }


    const now =
        Date.now();


    const cooldown =
        power
            ?
            POWER_COOLDOWN
            :
            ATTACK_COOLDOWN;


    if (
        now -
        game.lastAttack <
        cooldown
    ) {

        return;

    }


    game.lastAttack =
        now;


    const player =
        $("player");


    const effect =
        $("playerAttack");


    if (player) {

        player.classList.remove(
            "attacking"
        );

        void player.offsetWidth;

        player.classList.add(
            "attacking"
        );

    }


    if (effect) {

        effect.classList.remove(
            "show"
        );

        void effect.offsetWidth;

        effect.classList.add(
            "show"
        );

    }


    const hit =
        calculateHit();


    if (!hit) {

        resetCombo();

        return;

    }


    const damage =
        power
            ?
            POWER_DAMAGE
            :
            PLAYER_DAMAGE;


    dealDamageToEnemy(
        damage
    );

}


/* =========================================================
   CALCULATE HIT
   ========================================================= */

function calculateHit() {

    const distance =
        Math.abs(
            game.playerX -
            (
                100 -
                game.enemyX
            )
        );


    return distance <
        20;

}


/* =========================================================
   DEAL ENEMY DAMAGE
   ========================================================= */

function dealDamageToEnemy(
    damage
) {

    if (
        game.ended
    ) {

        return;

    }


    game.enemyHp =
        Math.max(
            0,
            game.enemyHp -
            damage
        );


    game.damage +=
        damage;


    game.combo +=
        1;


    game.maxCombo =
        Math.max(
            game.maxCombo,
            game.combo
        );


    game.score +=
        damage *
        10;


    if (
        game.comboTimer
    ) {

        clearTimeout(
            game.comboTimer
        );

    }


    game.comboTimer =
        setTimeout(
            resetCombo,
            1200
        );


    showCombo();


    enemyHitAnimation();

    updateUI();


    if (
        game.enemyHp <=
        0
    ) {

        winGame();

    }

}


/* =========================================================
   ENEMY HIT
   ========================================================= */

function enemyHitAnimation() {

    const enemy =
        $("enemy");


    if (!enemy) {
        return;
    }


    enemy.classList.remove(
        "hit"
    );


    void enemy.offsetWidth;


    enemy.classList.add(
        "hit"
    );

}


/* =========================================================
   COMBO
   ========================================================= */

function showCombo() {

    const popup =
        $("comboPopup");


    if (!popup) {
        return;
    }


    if (
        game.combo <=
        1
    ) {

        return;

    }


    popup.textContent =
        game.combo +
        " HIT COMBO!";


    popup.classList.remove(
        "show"
    );


    void popup.offsetWidth;


    popup.classList.add(
        "show"
    );

}


/* =========================================================
   RESET COMBO
   ========================================================= */

function resetCombo() {

    game.combo =
        0;


    updateUI();

}


/* =========================================================
   ENEMY AI
   ========================================================= */

function startEnemyAI() {

    stopEnemyAI();


    game.enemyTimer =
        setInterval(
            function () {

                if (
                    !game.running ||
                    game.ended
                ) {

                    return;

                }


                enemyThink();

            },
            850
        );

}


/* =========================================================
   STOP AI
   ========================================================= */

function stopEnemyAI() {

    if (
        game.enemyTimer
    ) {

        clearInterval(
            game.enemyTimer
        );

        game.enemyTimer =
            null;

    }

}


/* =========================================================
   ENEMY THINK
   ========================================================= */

function enemyThink() {

    const playerPosition =
        game.playerX;


    const enemyPosition =
        100 -
        game.enemyX;


    const distance =
        playerPosition -
        enemyPosition;


    if (
        Math.abs(distance) >
        18
    ) {

        if (
            distance > 0
        ) {

            game.enemyX -= 2;

            game.enemyDirection =
                1;

        }

        else {

            game.enemyX += 2;

            game.enemyDirection =
                -1;

        }


        game.enemyX =
            Math.max(
                5,
                Math.min(
                    75,
                    game.enemyX
                )
            );


        positionCharacters();

        return;

    }


    enemyAttack();

}


/* =========================================================
   ENEMY ATTACK
   ========================================================= */

function enemyAttack() {

    const now =
        Date.now();


    if (
        now -
        game.enemyLastAttack <
        1000
    ) {

        return;

    }


    game.enemyLastAttack =
        now;


    const enemy =
        $("enemy");


    const effect =
        $("enemyAttack");


    if (enemy) {

        enemy.classList.remove(
            "attacking"
        );

        void enemy.offsetWidth;

        enemy.classList.add(
            "attacking"
        );

    }


    if (effect) {

        effect.classList.remove(
            "show"
        );

        void effect.offsetWidth;

        effect.classList.add(
            "show"
        );

    }


    const hit =
        calculateHit();


    if (!hit) {
        return;
    }


    /*
       Player has a chance to dodge
       while jumping.
    */

    const player =
        $("player");


    if (
        player &&
        player.classList.contains(
            "jumping"
        )
    ) {

        showToast(
            "DODGE!"
        );

        return;

    }


    game.playerHp =
        Math.max(
            0,
            game.playerHp -
            ENEMY_DAMAGE
        );


    game.score =
        Math.max(
            0,
            game.score -
            20
        );


    updateUI();


    if (
        game.playerHp <=
        0
    ) {

        loseGame();

    }

}


/* =========================================================
   WIN
   ========================================================= */

function winGame() {

    if (
        game.ended
    ) {

        return;

    }


    game.ended =
        true;

    game.running =
        false;


    stopEnemyAI();


    game.score +=
        1000;


    showResult(
        true
    );

}


/* =========================================================
   LOSE
   ========================================================= */

function loseGame() {

    if (
        game.ended
    ) {

        return;

    }


    game.ended =
        true;

    game.running =
        false;


    stopEnemyAI();


    showResult(
        false
    );

}


/* =========================================================
   RESULT
   ========================================================= */

function showResult(
    victory
) {

    const title =
        $("resultTitle");

    const subtitle =
        $("resultSubtitle");

    const icon =
        $("resultIcon");


    if (victory) {

        icon.textContent =
            "🏆";

        title.textContent =
            "VICTORY";

        subtitle.textContent =
            "The silence has been broken.";

    }

    else {

        icon.textContent =
            "💀";

        title.textContent =
            "GAME OVER";

        subtitle.textContent =
            "The Corruptor has won.";

    }


    $("finalScore").textContent =
        game.score;


    $("finalCombo").textContent =
        game.maxCombo;


    $("finalDamage").textContent =
        game.damage;


    $("playerName").value =
        "";


    showScreen(
        "resultScreen"
    );

}


/* =========================================================
   UPDATE UI
   ========================================================= */

function updateUI() {

    $("playerHpText").textContent =
        game.playerHp;


    $("enemyHpText").textContent =
        game.enemyHp;


    $("score").textContent =
        game.score;


    $("combo").textContent =
        game.combo;


    $("playerHealth").style.width =
        game.playerHp +
        "%";


    $("enemyHealth").style.width =
        game.enemyHp +
        "%";

}


/* =========================================================
   GAME MESSAGE
   ========================================================= */

function clearGameMessage() {

    const message =
        $("gameMessage");


    if (!message) {
        return;
    }


    message.classList.add(
        "hidden"
    );


    message.textContent =
        "";

}


/* =========================================================
   SAVE SCORE
   ========================================================= */

async function saveScore() {

    const input =
        $("playerName");


    let name =
        input.value.trim();


    if (!name) {

        name =
            "Anonymous";

    }


    if (
        name.length >
        20
    ) {

        name =
            name.substring(
                0,
                20
            );

    }


    try {

        const result =
            await supabaseClient
                .from(
                    "leaderboard"
                )
                .insert([
                    {

                        player_name:
                            name,

                        score:
                            game.score,

                        max_combo:
                            game.maxCombo,

                        damage:
                            game.damage

                    }
                ]);


        if (
            result.error
        ) {

            throw result.error;

        }


        showToast(
            "Score berhasil disimpan!"
        );


        showScreen(
            "leaderboardScreen"
        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(
            "Gagal menyimpan score: " +
            error.message,
            true
        );

    }

}


/* =========================================================
   LOAD LEADERBOARD
   ========================================================= */

async function loadLeaderboard() {

    const list =
        $("leaderboardList");


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="loading">
            Loading leaderboard...
        </div>
    `;


    try {

        const result =
            await supabaseClient
                .from(
                    "leaderboard"
                )
                .select(
                    "*"
                )
                .order(
                    "score",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    50
                );


        if (
            result.error
        ) {

            throw result.error;

        }


        const data =
            result.data ||
            [];


        if (
            data.length ===
            0
        ) {

            list.innerHTML = `
                <div class="loading">
                    Belum ada score.
                    Jadilah fighter pertama!
                </div>
            `;

            return;

        }


        list.innerHTML =
            data
                .map(
                    function (
                        player,
                        index
                    ) {

                        return `
                            <div
                                class="leaderboard-row"
                            >

                                <span class="rank">
                                    ${index + 1}
                                </span>

                                <span
                                    class="player-rank"
                                >

                                    <span
                                        class="rank-avatar"
                                    >
                                        ${
                                            index === 0
                                                ? "👑"
                                                : "🥷"
                                        }
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            player.player_name
                                        )}
                                    </strong>

                                </span>

                                <span
                                    class="leader-score"
                                >
                                    ${Number(
                                        player.score
                                    ).toLocaleString(
                                        "id-ID"
                                    )}
                                </span>

                                <span
                                    class="leader-combo"
                                >
                                    ${
                                        player.max_combo
                                    }
                                </span>

                                <span
                                    class="leader-date"
                                >
                                    ${formatDate(
                                        player.created_at
                                    )}
                                </span>

                            </div>
                        `;

                    }
                )
                .join("");

    }

    catch (error) {

        console.error(
            error
        );


        list.innerHTML = `
            <div class="loading">
                Gagal mengambil leaderboard.
                <br><br>
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;

    }

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    );

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimeout =
    null;


function showToast(
    message,
    error = false
) {

    const toast =
        $("toast");


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.className =
        "toast show";


    if (error) {

        toast.classList.add(
            "error"
        );

    }


    if (
        toastTimeout
    ) {

        clearTimeout(
            toastTimeout
        );

    }


    toastTimeout =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.startGame =
    startGame;

window.restartGame =
    restartGame;

window.exitGame =
    exitGame;

window.showScreen =
    showScreen;

window.saveScore =
    saveScore;

window.loadLeaderboard =
    loadLeaderboard;