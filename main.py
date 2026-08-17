import pygame
import random
import math
import sys

pygame.init()

# =========================================================
# SETTINGS
# =========================================================
WIDTH = 1100
HEIGHT = 650
FPS = 60

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("SILENT FIGHTER")
clock = pygame.time.Clock()

# Fonts
FONT_BIG = pygame.font.SysFont("arial", 48, bold=True)
FONT_MED = pygame.font.SysFont("arial", 28, bold=True)
FONT_SMALL = pygame.font.SysFont("arial", 20)

# =========================================================
# COLORS
# =========================================================
WHITE = (245, 245, 245)
BLACK = (20, 20, 20)
GRAY = (90, 90, 90)
DARK = (25, 25, 35)
RED = (190, 40, 40)
GREEN = (50, 190, 80)
YELLOW = (240, 190, 40)
BLUE = (60, 130, 220)
SKIN = (180, 130, 95)
SHADOW = (10, 10, 15)

# =========================================================
# WORLD
# =========================================================
GROUND_Y = 545

# =========================================================
# PARTICLES
# =========================================================
particles = []


class Particle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.vx = random.uniform(-4, 4)
        self.vy = random.uniform(-5, -1)
        self.life = random.randint(15, 30)
        self.color = color
        self.size = random.randint(3, 7)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.25
        self.life -= 1

    def draw(self):
        if self.life > 0:
            pygame.draw.circle(
                screen,
                self.color,
                (int(self.x), int(self.y)),
                self.size
            )


def hit_particles(x, y):
    for _ in range(15):
        particles.append(Particle(x, y, YELLOW))


# =========================================================
# PLAYER
# =========================================================
class Player:
    def __init__(self):
        self.x = 220
        self.y = GROUND_Y
        self.width = 55
        self.height = 150

        self.vx = 0
        self.vy = 0

        self.speed = 5
        self.jump_power = -13
        self.gravity = 0.65

        self.hp = 100
        self.max_hp = 100

        self.attack_timer = 0
        self.attack_cooldown = 0
        self.attack_type = None

        self.facing = 1

        self.score = 0
        self.combo = 0
        self.combo_timer = 0

        self.invincible = 0

    def body_rect(self):
        return pygame.Rect(
            self.x - 20,
            self.y - 150,
            40,
            150
        )

    def update(self, keys):

        # -----------------------------
        # MOVEMENT
        # -----------------------------
        self.vx = 0

        if keys[pygame.K_a]:
            self.vx = -self.speed
            self.facing = -1

        if keys[pygame.K_d]:
            self.vx = self.speed
            self.facing = 1

        self.x += self.vx

        # -----------------------------
        # JUMP
        # -----------------------------
        self.vy += self.gravity
        self.y += self.vy

        if self.y >= GROUND_Y:
            self.y = GROUND_Y
            self.vy = 0

        # -----------------------------
        # BOUNDARIES
        # -----------------------------
        self.x = max(50, min(WIDTH - 50, self.x))

        # -----------------------------
        # ATTACK TIMER
        # -----------------------------
        if self.attack_timer > 0:
            self.attack_timer -= 1

        if self.attack_cooldown > 0:
            self.attack_cooldown -= 1

        if self.invincible > 0:
            self.invincible -= 1

        if self.combo_timer > 0:
            self.combo_timer -= 1

        else:
            self.combo = 0

    def jump(self):
        if self.y >= GROUND_Y:
            self.vy = self.jump_power

    def attack(self, attack_type):

        if self.attack_cooldown > 0:
            return

        self.attack_type = attack_type

        if attack_type == "normal":
            self.attack_timer = 14
            self.attack_cooldown = 18

        elif attack_type == "strong":
            self.attack_timer = 22
            self.attack_cooldown = 35

    def attack_rect(self):

        if self.attack_timer <= 0:
            return None

        if self.attack_type == "normal":
            reach = 65
            damage = 10

        else:
            reach = 95
            damage = 20

        if self.facing == 1:
            return (
                pygame.Rect(
                    self.x + 10,
                    self.y - 115,
                    reach,
                    45
                ),
                damage
            )

        else:
            return (
                pygame.Rect(
                    self.x - reach - 10,
                    self.y - 115,
                    reach,
                    45
                ),
                damage
            )

    def take_damage(self, damage):

        if self.invincible > 0:
            return

        self.hp -= damage
        self.invincible = 35

        hit_particles(self.x, self.y - 100)

        self.combo = 0

        if self.hp < 0:
            self.hp = 0

    def draw(self):

        # Shadow
        pygame.draw.ellipse(
            screen,
            SHADOW,
            (self.x - 35, self.y - 8, 70, 16)
        )

        # Animation bob
        bob = 0

        if self.attack_timer > 0:
            bob = random.choice([-2, 0, 2])

        # =================================================
        # LEGS
        # =================================================
        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x - 18,
                self.y - 65 + bob,
                15,
                65
            )
        )

        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x + 3,
                self.y - 65 + bob,
                15,
                65
            )
        )

        # Shoes
        pygame.draw.rect(
            screen,
            DARK,
            (
                self.x - 24,
                self.y - 8,
                24,
                10
            )
        )

        pygame.draw.rect(
            screen,
            DARK,
            (
                self.x + 5,
                self.y - 8,
                24,
                10
            )
        )

        # =================================================
        # BODY - WHITE SHIRT
        # =================================================
        pygame.draw.rect(
            screen,
            WHITE,
            (
                self.x - 27,
                self.y - 130 + bob,
                54,
                70
            )
        )

        # Shirt buttons
        for i in range(3):
            pygame.draw.circle(
                screen,
                GRAY,
                (
                    self.x,
                    self.y - 118 + i * 17
                ),
                2
            )

        # =================================================
        # ARMS
        # =================================================
        arm_y = self.y - 115

        if self.attack_timer > 0:

            # Punching arm
            punch_x = self.x + self.facing * 70

            pygame.draw.line(
                screen,
                SKIN,
                (self.x + self.facing * 20, arm_y),
                (punch_x, arm_y),
                13
            )

            pygame.draw.circle(
                screen,
                SKIN,
                (punch_x, arm_y),
                9
            )

        else:

            pygame.draw.line(
                screen,
                SKIN,
                (self.x - 22, arm_y),
                (self.x - 35, self.y - 65),
                11
            )

            pygame.draw.line(
                screen,
                SKIN,
                (self.x + 22, arm_y),
                (self.x + 35, self.y - 65),
                11
            )

        # =================================================
        # NECK
        # =================================================
        pygame.draw.rect(
            screen,
            SKIN,
            (
                self.x - 9,
                self.y - 145,
                18,
                20
            )
        )

        # =================================================
        # HEAD
        # =================================================
        pygame.draw.ellipse(
            screen,
            SKIN,
            (
                self.x - 22,
                self.y - 180,
                44,
                45
            )
        )

        # Hair
        pygame.draw.arc(
            screen,
            GRAY,
            (
                self.x - 22,
                self.y - 185,
                44,
                40
            ),
            math.pi,
            math.pi * 2,
            7
        )

        # Face
        pygame.draw.circle(
            screen,
            BLACK,
            (
                self.x + self.facing * 8,
                self.y - 158
            ),
            2
        )

        # =================================================
        # ATTACK EFFECT
        # =================================================
        if self.attack_timer > 0:

            if self.facing == 1:
                effect_x = self.x + 90
            else:
                effect_x = self.x - 90

            pygame.draw.circle(
                screen,
                YELLOW,
                (
                    effect_x,
                    self.y - 115
                ),
                random.randint(7, 13),
                3
            )


# =========================================================
# ENEMY
# =========================================================
class Corruptor:
    def __init__(self, x):
        self.x = x
        self.y = GROUND_Y

        self.width = 55
        self.height = 150

        self.hp = 100
        self.max_hp = 100

        self.speed = 2.1

        self.attack_timer = 0
        self.attack_cooldown = random.randint(30, 80)

        self.hit_cooldown = 0

        self.facing = -1

    def body_rect(self):
        return pygame.Rect(
            self.x - 25,
            self.y - 150,
            50,
            150
        )

    def update(self, player):

        # Face player
        if player.x > self.x:
            self.facing = 1
        else:
            self.facing = -1

        distance = abs(player.x - self.x)

        # Chase player
        if distance > 85:

            if player.x > self.x:
                self.x += self.speed
            else:
                self.x -= self.speed

        else:

            if self.attack_cooldown <= 0:

                self.attack_timer = 20
                self.attack_cooldown = random.randint(55, 90)

        if self.attack_cooldown > 0:
            self.attack_cooldown -= 1

        if self.attack_timer > 0:
            self.attack_timer -= 1

            # Hit at middle of animation
            if self.attack_timer == 10:

                if distance < 100:
                    player.take_damage(12)

        if self.hit_cooldown > 0:
            self.hit_cooldown -= 1

    def take_damage(self, damage):

        if self.hit_cooldown > 0:
            return

        self.hp -= damage
        self.hit_cooldown = 12

        hit_particles(self.x, self.y - 100)

        if self.hp < 0:
            self.hp = 0

    def draw(self):

        # Shadow
        pygame.draw.ellipse(
            screen,
            SHADOW,
            (self.x - 35, self.y - 8, 70, 16)
        )

        # Legs
        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x - 18,
                self.y - 65,
                15,
                65
            )
        )

        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x + 3,
                self.y - 65,
                15,
                65
            )
        )

        # Shoes
        pygame.draw.rect(
            screen,
            DARK,
            (
                self.x - 24,
                self.y - 8,
                25,
                10
            )
        )

        pygame.draw.rect(
            screen,
            DARK,
            (
                self.x + 5,
                self.y - 8,
                25,
                10
            )
        )

        # Body - black suit
        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x - 28,
                self.y - 130,
                56,
                70
            )
        )

        # White shirt
        pygame.draw.polygon(
            screen,
            WHITE,
            [
                (self.x - 10, self.y - 130),
                (self.x + 10, self.y - 130),
                (self.x + 4, self.y - 75),
                (self.x - 4, self.y - 75)
            ]
        )

        # Red tie
        pygame.draw.polygon(
            screen,
            RED,
            [
                (self.x - 4, self.y - 125),
                (self.x + 4, self.y - 125),
                (self.x + 5, self.y - 85),
                (self.x, self.y - 76),
                (self.x - 5, self.y - 85)
            ]
        )

        # Arms
        if self.attack_timer > 0:

            punch_x = self.x + self.facing * 70

            pygame.draw.line(
                screen,
                BLACK,
                (self.x + self.facing * 20, self.y - 115),
                (punch_x, self.y - 110),
                14
            )

            pygame.draw.circle(
                screen,
                SKIN,
                (punch_x, self.y - 110),
                9
            )

        else:

            pygame.draw.line(
                screen,
                BLACK,
                (self.x - 23, self.y - 115),
                (self.x - 35, self.y - 65),
                12
            )

            pygame.draw.line(
                screen,
                BLACK,
                (self.x + 23, self.y - 115),
                (self.x + 35, self.y - 65),
                12
            )

        # Neck
        pygame.draw.rect(
            screen,
            SKIN,
            (
                self.x - 9,
                self.y - 145,
                18,
                20
            )
        )

        # Head
        pygame.draw.ellipse(
            screen,
            SKIN,
            (
                self.x - 22,
                self.y - 180,
                44,
                45
            )
        )

        # Hair
        pygame.draw.arc(
            screen,
            BLACK,
            (
                self.x - 22,
                self.y - 185,
                44,
                40
            ),
            math.pi,
            math.pi * 2,
            8
        )

        # Black glasses
        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x - 19,
                self.y - 165,
                16,
                8
            )
        )

        pygame.draw.rect(
            screen,
            BLACK,
            (
                self.x + 3,
                self.y - 165,
                16,
                8
            )
        )

        pygame.draw.line(
            screen,
            BLACK,
            (
                self.x - 3,
                self.y - 161
            ),
            (
                self.x + 3,
                self.y - 161
            ),
            3
        )


# =========================================================
# BACKGROUND
# =========================================================
def draw_background():

    # Sky
    screen.fill((35, 40, 55))

    # Moon
    pygame.draw.circle(
        screen,
        (220, 220, 190),
        (900, 100),
        45
    )

    # Buildings
    for x in range(0, WIDTH, 110):

        height = random.Random(x).randint(100, 240)

        pygame.draw.rect(
            screen,
            (28, 31, 42),
            (
                x,
                GROUND_Y - height,
                90,
                height
            )
        )

        # Windows
        for wy in range(
            GROUND_Y - height + 25,
            GROUND_Y - 20,
            35
        ):

            for wx in range(x + 15, x + 80, 25):

                if random.Random(x + wy + wx).random() > 0.4:

                    pygame.draw.rect(
                        screen,
                        (180, 150, 70),
                        (
                            wx,
                            wy,
                            9,
                            12
                        )
                    )

    # Ground
    pygame.draw.rect(
        screen,
        (18, 20, 25),
        (
            0,
            GROUND_Y,
            WIDTH,
            HEIGHT - GROUND_Y
        )
    )

    # Ground line
    pygame.draw.line(
        screen,
        RED,
        (0, GROUND_Y),
        (WIDTH, GROUND_Y),
        3
    )


# =========================================================
# UI
# =========================================================
def draw_hp_bar(x, y, hp, max_hp, width=300):

    pygame.draw.rect(
        screen,
        BLACK,
        (x - 4, y - 4, width + 8, 28)
    )

    current_width = int(width * hp / max_hp)

    pygame.draw.rect(
        screen,
        RED,
        (x, y, width, 20)
    )

    pygame.draw.rect(
        screen,
        GREEN,
        (x, y, current_width, 20)
    )


def draw_ui(player, enemy):

    # Player HP
    screen.blit(
        FONT_SMALL.render(
            "SILENT FIGHTER",
            True,
            WHITE
        ),
        (30, 20)
    )

    draw_hp_bar(
        30,
        50,
        player.hp,
        player.max_hp
    )

    # Enemy HP
    enemy_x = WIDTH - 330

    screen.blit(
        FONT_SMALL.render(
            "THE CORRUPTOR",
            True,
            WHITE
        ),
        (enemy_x, 20)
    )

    draw_hp_bar(
        enemy_x,
        50,
        enemy.hp,
        enemy.max_hp
    )

    # Score
    score_text = FONT_MED.render(
        f"SCORE: {player.score}",
        True,
        YELLOW
    )

    screen.blit(
        score_text,
        (
            WIDTH // 2 -
            score_text.get_width() // 2,
            25
        )
    )

    # Combo
    if player.combo > 1:

        combo_text = FONT_BIG.render(
            f"{player.combo} HIT COMBO!",
            True,
            YELLOW
        )

        screen.blit(
            combo_text,
            (
                WIDTH // 2 -
                combo_text.get_width() // 2,
                90
            )
        )

    # Controls
    controls = FONT_SMALL.render(
        "A/D = MOVE    W = JUMP    J = PUNCH    K = POWER ATTACK",
        True,
        GRAY
    )

    screen.blit(
        controls,
        (
            WIDTH // 2 -
            controls.get_width() // 2,
            HEIGHT - 35
        )
    )


# =========================================================
# GAME OVER
# =========================================================
def game_over_screen(player, victory):

    overlay = pygame.Surface(
        (WIDTH, HEIGHT),
        pygame.SRCALPHA
    )

    overlay.fill((0, 0, 0, 190))

    screen.blit(
        overlay,
        (0, 0)
    )

    if victory:

        title = "CORRUPTOR DEFEATED!"
        color = YELLOW

    else:

        title = "SILENT FIGHTER FALLEN"
        color = RED

    text = FONT_BIG.render(
        title,
        True,
        color
    )

    screen.blit(
        text,
        (
            WIDTH // 2 -
            text.get_width() // 2,
            230
        )
    )

    score = FONT_MED.render(
        f"FINAL SCORE: {player.score}",
        True,
        WHITE
    )

    screen.blit(
        score,
        (
            WIDTH // 2 -
            score.get_width() // 2,
            300
        )
    )

    restart = FONT_SMALL.render(
        "Press R to restart",
        True,
        WHITE
    )

    screen.blit(
        restart,
        (
            WIDTH // 2 -
            restart.get_width() // 2,
            360
        )
    )


# =========================================================
# GAME RESET
# =========================================================
def reset_game():

    global player
    global enemy
    global particles

    player = Player()
    enemy = Corruptor(850)

    particles = []


# =========================================================
# INITIALIZE
# =========================================================
reset_game()

running = True
game_finished = False
victory = False

# =========================================================
# MAIN LOOP
# =========================================================
while running:

    clock.tick(FPS)

    # -----------------------------------------------
    # EVENTS
    # -----------------------------------------------
    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:

            if event.key == pygame.K_ESCAPE:
                running = False

            if game_finished:

                if event.key == pygame.K_r:
                    reset_game()
                    game_finished = False
                    victory = False

            else:

                if event.key == pygame.K_w:
                    player.jump()

                if event.key == pygame.K_j:
                    player.attack("normal")

                if event.key == pygame.K_k:
                    player.attack("strong")

    # -----------------------------------------------
    # GAME UPDATE
    # -----------------------------------------------
    if not game_finished:

        keys = pygame.key.get_pressed()

        player.update(keys)
        enemy.update(player)

        # -------------------------------------------
        # PLAYER ATTACK -> ENEMY
        # -------------------------------------------
        attack_data = player.attack_rect()

        if attack_data:

            attack_rect, damage = attack_data

            if attack_rect.colliderect(
                enemy.body_rect()
            ):

                old_hp = enemy.hp

                enemy.take_damage(damage)

                if enemy.hp < old_hp:

                    player.score += damage

                    player.combo += 1
                    player.combo_timer = 90

        # -------------------------------------------
        # ENEMY DEFEATED
        # -------------------------------------------
        if enemy.hp <= 0:

            player.score += 1000

            game_finished = True
            victory = True

        # -------------------------------------------
        # PLAYER DEFEATED
        # -------------------------------------------
        if player.hp <= 0:

            game_finished = True
            victory = False

        # -------------------------------------------
        # PARTICLES
        # -------------------------------------------
        for p in particles:
            p.update()

        particles = [
            p for p in particles
            if p.life > 0
        ]

    # =================================================
    # DRAW
    # =================================================
    draw_background()

    player.draw()
    enemy.draw()

    for p in particles:
        p.draw()

    draw_ui(
        player,
        enemy
    )

    if game_finished:
        game_over_screen(
            player,
            victory
        )

    pygame.display.flip()


pygame.quit()
sys.exit()