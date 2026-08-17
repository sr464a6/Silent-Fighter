# 🥷 SILENT FIGHTER

**“Dihina-hina saya diam, dicela saya juga diam. Tapi kali ini, SAYA AKAN LAWAN.”**

**Silent Fighter** is a 2D pixel-art fighting game built with **Python and Pygame**.

You play as **Silent Fighter**, a quiet fighter who has endured humiliation and insults for far too long. This time, silence is no longer an option.

The enemy is **The Corruptor**, a ruthless opponent dressed in a black suit, white shirt, red tie, and dark glasses.

The battle begins.

---

## 🎮 Game Overview

**Silent Fighter** is a fast-paced 2D fighting game featuring:

* 🥷 Pixel-art fighting gameplay
* 🏃 Walking and running
* 🦘 Jumping and landing
* 👊 Normal attacks
* ⚡ Powerful attacks
* 🥋 Ninja-style combat animations
* 💥 Hit effects
* 🔥 Combo system
* ❤️ Health system
* 🏆 Score system
* 👑 Victory screen
* 💀 Game Over screen
* 🌃 Night-city environment
* 🤖 Enemy AI
* 🎞️ Character sprite animations

---

# 🕹️ Controls

| Key   | Action        |
| ----- | ------------- |
| `A`   | Move Left     |
| `D`   | Move Right    |
| `W`   | Jump          |
| `J`   | Normal Attack |
| `K`   | Power Attack  |
| `R`   | Restart       |
| `ESC` | Exit Game     |

---

# ⚔️ Combat System

## 👊 Normal Attack

Press:

```text
J
```

A fast attack with moderate damage and a short cooldown.

---

## 💥 Power Attack

Press:

```text
K
```

A stronger attack with greater range and damage.

However, the power attack has a longer cooldown.

---

## 🥋 Ninja Combat

Silent Fighter can perform fast ninja-inspired movements and attacks.

The planned animation system includes:

```text
IDLE
  ↓
WALK
  ↓
RUN
  ↓
JUMP
  ↓
LAND
  ↓
PUNCH
  ↓
KICK
  ↓
HURT
  ↓
VICTORY
```

---

# 🔥 Combo System

Successful attacks increase the player's combo.

Example:

```text
1 HIT COMBO!
2 HIT COMBO!
3 HIT COMBO!
4 HIT COMBO!
5 HIT COMBO!
```

The combo resets if the player stops landing attacks for too long.

Higher combos reward aggressive and accurate gameplay.

---

# ❤️ Health System

Both fighters have their own health bar.

### Silent Fighter

```text
100 HP
```

### The Corruptor

```text
100 HP
```

Reduce The Corruptor's HP to zero to win the battle.

If Silent Fighter's HP reaches zero, the game is over.

---

# 🏆 Score System

Players earn score by successfully damaging The Corruptor.

Defeating the enemy awards a large bonus:

```text
+1000 SCORE
```

Example:

```text
SCORE: 1250
```

Try to defeat The Corruptor while maintaining the highest possible combo.

---

# 🎞️ Animation System

The game is designed to support sprite-based animation.

# ⚙️ Technologies

The game is developed using:

* **Python**
* **Pygame**
* Object-Oriented Programming
* 2D Game Development
* Sprite Animation
* Collision Detection
* Particle Effects
* Enemy AI
* Game State Management

---

# 📦 Installation

Make sure Python is installed on your computer.

Install Pygame:

```bash
pip install pygame
```

Or install all dependencies:

```bash
pip install -r requirements.txt
```

Run the game:

```bash
python silent_fighter.py
```

---

# 📄 License

This project is created for educational, creative, and game-development purposes.

