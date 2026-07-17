# Tracking Game

A small browser experiment that doubles as a **research instrument** for a
hybrid control task from brain–machine-interface / sensorimotor research: you do
two things at once.

- **Track** — keep your ring on a drifting target.
- **Match** — keep your color matching the target's color.

Live at **https://michaelli66.github.io/tracking_game/tracking_game.html**.

## The trial

Each run is a **45-second trial**. The target follows a **sum-of-sines**
trajectory — `x(t)` and `y(t)` are each a sum of a few sinusoids at fixed
frequencies with random phases. It looks unpredictable to the player, but because
the input frequencies are known, the logged data supports a **frequency-response
analysis** of the human tracker (tracking bandwidth, gain, phase lag).

You score points only while you're **on the target AND color-matched**; holding
that builds a combo multiplier (up to ×4). At the end you get a readout —
**score, % matched, mean tracking error, mean color-switch reaction time** — and
can **download the whole session as JSON**.

| | Track | Switch color |
|--|-------|--------------|
| **Desktop** | move the mouse | click or `Space` |
| **Phone**   | drag your finger | tap |

## Data logged per session

The downloaded `tracking_<timestamp>.json` contains:

```jsonc
{
  "meta": {
    "task": "hybrid-tracking", "date": "…", "durationSec": 45,
    "field": { "w": 640, "h": 420 }, "targetRadius": 34, "playerRadius": 26,
    "colors": ["#2f6fed", "#f59e0b"],
    "trajectory": {                       // reproducible: the exact stimulus
      "type": "sum-of-sines",
      "x": { "freqsHz": [...], "amps": [...], "phases": [...] },
      "y": { "freqsHz": [...], "amps": [...], "phases": [...] }
    },
    "userAgent": "…", "inputType": "mouse" | "touch"
  },
  "frames": [ { "t", "tx","ty",   // target x/y
                     "cx","cy",   // cursor x/y
                     "tc","pc",   // target / player color index
                     "m" } ],     // matched flag (0/1)  — ~60 Hz
  "events": [ { "t", "type": "targetSwitch"|"playerSwitch", "to" } ],
  "summary": { "score", "meanTrackingErrorPx", "pctMatched",
               "colorSwitches", "meanSwitchRTsec", "frames" }
}
```

That per-frame time series is the point: from it you can derive tracking error,
lag (cursor-vs-target cross-correlation), a frequency response (since the input
spectrum is known), and color-switch reaction times.

## How it works

Plain HTML5 canvas, no libraries, in `script.js`:

- **State** — `target` and `player` objects, plus score/combo/timing counters and
  a `log` object accumulating frames + events.
- **`update(dt)`** — advances the sum-of-sines target, rotates the target color on
  a randomized 2–4.5 s timer, computes on-target / match / scoring, and appends a
  frame to the log. Ends the trial at 45 s.
- **`render(state)`** — draws the target (glow when matched) and the player ring,
  and updates the HUD.
- **loop** — a delta-time `requestAnimationFrame` loop, so motion is smooth and
  framerate-independent. Input is unified across mouse, touch, and `Space`.

```
tracking_game/
  tracking_game.html   themed page: HUD, play field, start + results overlays
  script.js            game logic + data logging
  assets/              image assets
  README.md            this file
```

Tunables at the top of `script.js`: `COLORS`, `TRIAL_SEC`, and the frequency sets
`FREQS_X` / `FREQS_Y` that define the trajectory.

## Research questions this can probe

- **Tracking bandwidth & sensorimotor delay** from the sum-of-sines frequency response.
- **Dual-task cost**: how much the color-matching subtask degrades tracking.
- **Predictable vs. random** trajectories: feedforward internal models vs. pure feedback.
- **Learning curves** within and across sessions.
- **Individual differences / motor screening** (tremor, bradykinesia signatures).

## Ideas not yet built

- Timed **high-score** board (needs a small backend for a *shared* board).
- Adaptive difficulty that tunes target speed to hold you near a target accuracy —
  a browser-sized version of the co-adaptive-interface idea.
- A second **decoy** target, or a shrinking target, to push the attention split.
- Juice: lock-on particle burst, a combo sound.

## Credit

Original author: Si Jia (Michael) Li, 2023. Rebuilt as an instrumented trial, 2026.
