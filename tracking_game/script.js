// Tracking Game — a hybrid motor + color-matching task, instrumented for data.
// Original: Si Jia (Michael) Li, 2023. Rebuilt as a research instrument, 2026.
//
// The target follows a SUM-OF-SINES trajectory: x(t) and y(t) are each a sum of
// a few sinusoids at fixed frequencies with random phases. It looks unpredictable
// to the player, but because the input frequencies are known, the logged data
// supports a frequency-response analysis of the human tracker.

const LOGICAL_W = 640, LOGICAL_H = 420;
const COLORS = ['#2f6fed', '#f59e0b'];      // colorblind-safe blue / amber
const COLOR_NAMES = ['blue', 'amber'];
const TRIAL_SEC = 45;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const el = {
  score: document.getElementById('score'),
  accuracy: document.getElementById('accuracy'),
  time: document.getElementById('time'),
  matchpill: document.getElementById('matchpill'),
  swTarget: document.getElementById('sw-target'),
  swYou: document.getElementById('sw-you'),
  overlay: document.getElementById('overlay'),
  startbtn: document.getElementById('startbtn'),
  resultsOverlay: document.getElementById('resultsOverlay'),
  metrics: document.getElementById('metrics'),
  downloadbtn: document.getElementById('downloadbtn'),
  againbtn: document.getElementById('againbtn'),
};

// ---- sum-of-sines trajectory ----
// distinct frequency sets for x and y so the two axes are uncorrelated.
const FREQS_X = [0.10, 0.23, 0.37, 0.55];   // Hz
const FREQS_Y = [0.13, 0.29, 0.47, 0.61];   // Hz
function makeAxis(freqs) {
  const amps = freqs.map(f => 1 / f);                 // pink-ish: more energy at low freq
  const norm = amps.reduce((s, a) => s + a, 0);
  const phases = freqs.map(() => Math.random() * Math.PI * 2);
  return { freqs, amps, phases, norm };
}
function axisPos(axis, t, center, halfRange) {
  let s = 0;
  for (let i = 0; i < axis.freqs.length; i++)
    s += axis.amps[i] * Math.sin(2 * Math.PI * axis.freqs[i] * t + axis.phases[i]);
  return center + halfRange * (s / axis.norm);         // |s/norm| <= 1 → always in bounds
}

// ---- state ----
const target = { x: LOGICAL_W / 2, y: LOGICAL_H / 2, r: 34, color: 0 };
const player = { x: LOGICAL_W / 2, y: LOGICAL_H / 2, r: 26, color: 0 };
let axX, axY;
let score = 0, matchedTime = 0, activeTime = 0, combo = 1, pulse = 0;
let trialT = 0, colorTimer = 0, colorInterval = 3;
let running = false, pointerSeen = false;

// data logging
let log = null;               // { meta, frames, events }
let pendingChangeT = null;    // time of last target color change awaiting a matching switch
let rtSamples = [];
let errSum = 0, errN = 0, switches = 0;

// ---- canvas sizing ----
function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const s = (rect.width / LOGICAL_W) * dpr;
  ctx.setTransform(s, 0, 0, s, 0, 0);
}
window.addEventListener('resize', resize);

// ---- input ----
function setPointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  player.x = (clientX - rect.left) / rect.width * LOGICAL_W;
  player.y = (clientY - rect.top) / rect.height * LOGICAL_H;
  pointerSeen = true;
}
canvas.addEventListener('mousemove', e => setPointer(e.clientX, e.clientY));
canvas.addEventListener('touchmove', e => { e.preventDefault(); setPointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

function switchColor() {
  if (!running) return;
  player.color = (player.color + 1) % COLORS.length;
  switches++;
  log.events.push({ t: +trialT.toFixed(3), type: 'playerSwitch', to: player.color });
  // reaction time: matching switch after a target change that broke the match
  if (pendingChangeT !== null && player.color === target.color) {
    rtSamples.push(trialT - pendingChangeT);
    pendingChangeT = null;
  }
}
canvas.addEventListener('mousedown', e => { e.preventDefault(); switchColor(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); switchColor(); }, { passive: false });
window.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); switchColor(); } });

// ---- trial lifecycle ----
function startTrial() {
  axX = makeAxis(FREQS_X); axY = makeAxis(FREQS_Y);
  score = 0; matchedTime = 0; activeTime = 0; combo = 1;
  trialT = 0; colorTimer = 0; colorInterval = 3;
  target.color = 0; player.color = 0;
  errSum = 0; errN = 0; switches = 0; rtSamples = []; pendingChangeT = null;
  log = {
    meta: {
      version: 2, task: 'hybrid-tracking', date: new Date().toISOString(),
      durationSec: TRIAL_SEC, field: { w: LOGICAL_W, h: LOGICAL_H },
      targetRadius: target.r, playerRadius: player.r, colors: COLORS,
      trajectory: {
        type: 'sum-of-sines',
        x: { freqsHz: axX.freqs, amps: axX.amps, phases: axX.phases },
        y: { freqsHz: axY.freqs, amps: axY.amps, phases: axY.phases },
      },
      userAgent: navigator.userAgent,
      inputType: matchMedia('(pointer:coarse)').matches ? 'touch' : 'mouse',
    },
    frames: [], events: [],
  };
  running = true;
  el.overlay.classList.add('hidden');
  el.resultsOverlay.classList.add('hidden');
}
el.startbtn.addEventListener('click', startTrial);
el.againbtn.addEventListener('click', startTrial);

function endTrial() {
  running = false;
  el.matchpill.textContent = 'DONE'; el.matchpill.classList.remove('on');
  const meanErr = errN ? errSum / errN : 0;
  const pctOn = activeTime ? matchedTime / activeTime * 100 : 0;
  const meanRT = rtSamples.length ? rtSamples.reduce((s, x) => s + x, 0) / rtSamples.length : null;
  const summary = {
    score: Math.round(score),
    meanTrackingErrorPx: +meanErr.toFixed(1),
    pctMatched: +pctOn.toFixed(1),
    colorSwitches: switches,
    meanSwitchRTsec: meanRT !== null ? +meanRT.toFixed(3) : null,
    frames: log.frames.length,
  };
  log.summary = summary;

  el.metrics.innerHTML = `
    <div class="metric"><div class="mk">Score</div><div class="mv">${summary.score.toLocaleString()}</div></div>
    <div class="metric"><div class="mk">Matched</div><div class="mv">${summary.pctMatched}<small>%</small></div></div>
    <div class="metric"><div class="mk">Mean tracking error</div><div class="mv">${summary.meanTrackingErrorPx}<small> px</small></div></div>
    <div class="metric"><div class="mk">Color switch RT</div><div class="mv">${meanRT !== null ? (meanRT * 1000).toFixed(0) : '—'}<small> ms</small></div></div>`;
  el.resultsOverlay.classList.remove('hidden');
}

el.downloadbtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(log)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracking_${log.meta.date.replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ---- update ----
function update(dt) {
  trialT += dt;
  target.x = axisPos(axX, trialT, LOGICAL_W / 2, (LOGICAL_W / 2 - target.r) * 0.94);
  target.y = axisPos(axY, trialT, LOGICAL_H / 2, (LOGICAL_H / 2 - target.r) * 0.94);

  colorTimer += dt;
  if (colorTimer >= colorInterval) {
    colorTimer = 0;
    colorInterval = 2 + Math.random() * 2.5;              // randomized 2–4.5 s
    target.color = (target.color + 1) % COLORS.length;
    log.events.push({ t: +trialT.toFixed(3), type: 'targetSwitch', to: target.color });
    if (player.color !== target.color) pendingChangeT = trialT;   // start RT clock
  }

  const dist = Math.hypot(player.x - target.x, player.y - target.y);
  const onTarget = dist < target.r;
  const matched = onTarget && player.color === target.color;

  activeTime += dt;
  errSum += dist; errN++;
  if (matched) { matchedTime += dt; combo = Math.min(combo + dt * 0.7, 4); score += dt * 100 * combo; }
  else { combo = Math.max(1, combo - dt * 1.5); }

  // per-frame log
  log.frames.push({
    t: +trialT.toFixed(3),
    tx: +target.x.toFixed(1), ty: +target.y.toFixed(1),
    cx: +player.x.toFixed(1), cy: +player.y.toFixed(1),
    tc: target.color, pc: player.color, m: matched ? 1 : 0,
  });

  pulse += dt * (matched ? 7 : 3);
  if (trialT >= TRIAL_SEC) endTrial();
  return { onTarget, matched, colorMatch: player.color === target.color };
}

// ---- render ----
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function render(st) {
  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
  const tr = target.r + Math.sin(pulse) * (st.matched ? 3 : 1.2);
  if (st.matched) {
    ctx.save(); ctx.shadowColor = COLORS[target.color]; ctx.shadowBlur = 34;
    circle(target.x, target.y, tr); ctx.fillStyle = COLORS[target.color]; ctx.fill(); ctx.restore();
    circle(target.x, target.y, tr + 9); ctx.lineWidth = 3; ctx.strokeStyle = COLORS[target.color] + '66'; ctx.stroke();
  } else { circle(target.x, target.y, tr); ctx.fillStyle = COLORS[target.color]; ctx.fill(); }

  circle(player.x, player.y, player.r); ctx.lineWidth = 6; ctx.strokeStyle = COLORS[player.color]; ctx.stroke();
  if (st.matched) { circle(player.x, player.y, player.r); ctx.fillStyle = COLORS[player.color] + '22'; ctx.fill(); }
  circle(player.x, player.y, 3); ctx.fillStyle = COLORS[player.color]; ctx.fill();

  el.score.textContent = Math.floor(score).toLocaleString();
  el.accuracy.textContent = activeTime ? Math.round(matchedTime / activeTime * 100) + '%' : '0%';
  el.time.textContent = Math.max(0, TRIAL_SEC - trialT).toFixed(1);
  el.swTarget.style.background = COLORS[target.color];
  el.swYou.style.background = COLORS[player.color];
  const pill = el.matchpill;
  if (st.matched) { pill.textContent = 'MATCHED ×' + combo.toFixed(1); pill.classList.add('on'); }
  else if (st.onTarget && !st.colorMatch) { pill.textContent = 'SWITCH COLOR!'; pill.classList.remove('on'); }
  else { pill.textContent = 'TRACKING'; pill.classList.remove('on'); }
}

// ---- loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (running) render(update(dt));
  requestAnimationFrame(frame);
}
el.swTarget.style.background = COLORS[0];
el.swYou.style.background = COLORS[0];
resize();
requestAnimationFrame(frame);
