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

## How it works

Plain HTML5 canvas, no libraries, organized as **Model–View–Controller** in
`script.js`:

- **`SphereModel`** — the target's position/velocity and current color; bounces
  off the walls and rotates its color on a timer.
- **`SphereView`** — draws the target and the player's cursor sphere; tracks
  pointer position; toggles the player's color.
- **`SphereController`** — wires up input (mouse vs. touch based on the user
  agent) and runs the animation + color-change loops.

```
tracking_game/
  tracking_game.html   page + instructions + <canvas>
  script.js            game logic (MVC)
  assets/husky.jpg     husky sprite (an alternate cursor)
```

Tunable constants live at the bottom of `script.js`: `colors` (the palette both
spheres cycle through), the target's start position/speed in `new SphereModel`,
and the loop/`changeColor` intervals in `SphereController.start()`.

## Known limitations / ideas

- The page UI is unstyled and doesn't match the main site theme.
- No **score** or hit/match feedback — you can't tell how well you're doing.
- The husky sprite cursor (`drawHusky`) is implemented but commented out.
- The color palette (green / teal) isn't colorblind-friendly.
- `setInterval` drives animation; `requestAnimationFrame` would be smoother.

## Credit

Original author: Si Jia (Michael) Li, 2023.
