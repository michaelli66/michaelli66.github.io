// Tracking Game — a hybrid motor + color-matching task.
// Original: Si Jia (Michael) Li, 2023. Rebuilt 2026.

const LOGICAL_W = 640, LOGICAL_H = 420;
const COLORS = ['#2f6fed', '#f59e0b'];        // colorblind-safe blue / amber
const COLOR_NAMES = ['Blue', 'Amber'];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const el = {
  score: document.getElementById('score'),
  accuracy: document.getElementById('accuracy'),
  matchpill: document.getElementById('matchpill'),
  swTarget: document.getElementById('sw-target'),
  swYou: document.getElementById('sw-you'),
  overlay: document.getElementById('overlay'),
  startbtn: document.getElementById('startbtn'),
};

// ---- state ----
const target = { x: 160, y: 210, vx: 150, vy: 90, r: 34, color: 0 };
const player = { x: LOGICAL_W / 2, y: LOGICAL_H / 2, r: 26, color: 0 };
let score = 0, matchedTime = 0, activeTime = 0, combo = 1;
let elapsed = 0, colorTimer = 0, colorInterval = 3.2;
let running = false, pointerSeen = false, pulse = 0;

// ---- canvas sizing (crisp on any DPI, drawn in logical coords) ----
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
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  setPointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

function switchColor() { player.color = (player.color + 1) % COLORS.length; }
canvas.addEventListener('mousedown', e => { e.preventDefault(); switchColor(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); switchColor(); }, { passive: false });
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); if (running) switchColor(); }
});

function start() {
  score = 0; matchedTime = 0; activeTime = 0; combo = 1; elapsed = 0;
  colorTimer = 0; colorInterval = 3.2; target.color = 0; player.color = 0;
  running = true;
  el.overlay.classList.add('hidden');
}
el.startbtn.addEventListener('click', start);

// ---- update ----
function update(dt) {
  elapsed += dt;
  // difficulty: target speeds up and recolors faster over time
  const speed = 1 + Math.min(elapsed / 45, 0.9);   // up to ~1.9x
  target.x += target.vx * speed * dt;
  target.y += target.vy * speed * dt;
  if (target.x < target.r) { target.x = target.r; target.vx *= -1; }
  if (target.x > LOGICAL_W - target.r) { target.x = LOGICAL_W - target.r; target.vx *= -1; }
  if (target.y < target.r) { target.y = target.r; target.vy *= -1; }
  if (target.y > LOGICAL_H - target.r) { target.y = LOGICAL_H - target.r; target.vy *= -1; }

  colorTimer += dt;
  if (colorTimer >= colorInterval) {
    colorTimer = 0;
    colorInterval = Math.max(1.5, 3.2 - elapsed / 30);
    target.color = (target.color + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
  }

  const dist = Math.hypot(player.x - target.x, player.y - target.y);
  const onTarget = dist < target.r;
  const colorMatch = player.color === target.color;
  const matched = onTarget && colorMatch;

  if (running) {
    activeTime += dt;
    if (matched) {
      matchedTime += dt;
      combo = Math.min(combo + dt * 0.7, 4);
      score += dt * 100 * combo;
    } else {
      combo = Math.max(1, combo - dt * 1.5);
    }
  }
  pulse += dt * (matched ? 7 : 3);
  return { onTarget, colorMatch, matched };
}

// ---- render ----
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

function render(st) {
  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

  // target (with glow when matched)
  const tr = target.r + Math.sin(pulse) * (st.matched ? 3 : 1.2);
  if (st.matched) {
    ctx.save();
    ctx.shadowColor = COLORS[target.color]; ctx.shadowBlur = 34;
    circle(target.x, target.y, tr); ctx.fillStyle = COLORS[target.color]; ctx.fill();
    ctx.restore();
    circle(target.x, target.y, tr + 9); ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS[target.color] + '66'; ctx.stroke();
  } else {
    circle(target.x, target.y, tr); ctx.fillStyle = COLORS[target.color]; ctx.fill();
  }

  // player ring
  circle(player.x, player.y, player.r);
  ctx.lineWidth = 6; ctx.strokeStyle = COLORS[player.color]; ctx.stroke();
  if (st.matched) { circle(player.x, player.y, player.r); ctx.fillStyle = COLORS[player.color] + '22'; ctx.fill(); }
  circle(player.x, player.y, 3); ctx.fillStyle = COLORS[player.color]; ctx.fill();

  // HUD
  el.score.textContent = Math.floor(score).toLocaleString();
  el.accuracy.textContent = activeTime > 0 ? Math.round(matchedTime / activeTime * 100) + '%' : '0%';
  el.swTarget.style.background = COLORS[target.color];
  el.swYou.style.background = COLORS[player.color];

  const pill = el.matchpill;
  if (!running) { pill.textContent = 'READY'; pill.classList.remove('on'); }
  else if (st.matched) { pill.textContent = 'MATCHED ×' + combo.toFixed(1); pill.classList.add('on'); }
  else if (st.onTarget && !st.colorMatch) { pill.textContent = 'SWITCH COLOR!'; pill.classList.remove('on'); }
  else { pill.textContent = 'TRACKING'; pill.classList.remove('on'); }
}

// ---- loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const st = update(dt);
  render(st);
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
