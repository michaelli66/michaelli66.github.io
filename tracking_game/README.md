# Tracking Game

A small browser experiment that mirrors a **hybrid control task** from
brain–machine-interface research: you have to do two things at once.

- **Track** — keep your cursor (or finger) on the moving target.
- **Match** — make your color match the target's color at the same time.

Live at **https://michaelli66.github.io/tracking_game/tracking_game.html**.

## How to play

| | Track | Switch color |
|--|-------|--------------|
| **Desktop** | move the mouse | left-click |
| **Phone**   | drag your finger | tap |

The target slides left–right across the canvas and changes color every few
seconds. Your job is to stay on it *and* keep your color matching — the same
split-attention trade-off (continuous tracking vs. discrete decisions) that
co-adaptive interfaces have to reason about.

## Scoring

You earn points **only while you're both on the target and matching its color**.
Staying locked on builds a **combo multiplier** (up to ×4), so sustained tracking
is worth far more than brief taps. The HUD shows your score, your **on-target %**
(how much of the session you were locked on), the two color swatches, and a status
pill (`TRACKING` / `SWITCH COLOR!` / `MATCHED ×n`). The target also **speeds up and
recolors faster** the longer you play.

## How it works

Plain HTML5 canvas, no libraries, in `script.js`:

- **State** — two objects, `target` (position, velocity, radius, color) and
  `player` (position, radius, color), plus score/combo/timing counters.
- **`update(dt)`** — moves and bounces the target, ramps difficulty, rotates the
  target color on a shrinking timer, and computes on-target / color-match / scoring.
- **`render(state)`** — draws the target (with a glow when matched) and the
  player's ring, and updates the HUD in the DOM.
- **loop** — a `requestAnimationFrame` loop with delta-time, so motion is smooth
  and framerate-independent. Input is unified across mouse, touch, and `Space`.

```
tracking_game/
  tracking_game.html   themed page: HUD, play field, start overlay, styles
  script.js            game logic (state → update → render loop)
  assets/husky.jpg     husky sprite (unused by the current build)
  README.md            this file
```

Tunables at the top of `script.js`: `COLORS` (palette, currently colorblind-safe
blue/amber), the target's speed in the `target` object, and the difficulty/combo
constants inside `update()`.

## Ideas to make it more interesting

- **Timed rounds + high score** saved to `localStorage`.
- **More than two colors**, added as you level up.
- **Shrinking target** or a second decoy target to split attention further.
- **"Juice"**: particle burst on lock-on, a combo sound, screen-shake on a miss.
- **Adaptive difficulty** that tunes speed to keep you near a target accuracy —
  which is literally the co-adaptive-interface idea the task comes from.

## Credit

Original author: Si Jia (Michael) Li, 2023. Rebuilt 2026.
