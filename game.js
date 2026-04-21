// ── Constants ────────────────────────────────────────────────
const CELL        = 20;
const COLS        = 24;
const ROWS        = 24;
const W           = CELL * COLS;
const H           = CELL * ROWS;
const MAX_LEVEL   = 20;
const APPLES_PER  = 5;        // apples per level-up
const SPEED_START = 200;      // ms at level 1
const SPEED_END   = 60;       // ms at level 20

// Speed for a given level, spread evenly across 19 steps
function speedAt(lv) {
  return Math.round(SPEED_START - (lv - 1) * (SPEED_START - SPEED_END) / (MAX_LEVEL - 1));
}

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = W;
canvas.height = H;

// ── UI refs ──────────────────────────────────────────────────
const ui = {
  score:     document.getElementById('scoreDisplay'),
  best:      document.getElementById('bestDisplay'),
  level:     document.getElementById('levelDisplay'),
  overlay:   document.getElementById('overlay'),
  title:     document.getElementById('overlayTitle'),
  bigScore:  document.getElementById('overlayScore'),
  sub:       document.getElementById('overlaySub'),
  mainBtn:   document.getElementById('mainBtn'),
  reviveBtn: document.getElementById('reviveBtn'),
  modeBtn:   document.getElementById('modeBtn'),
};

// ── Persistent state ─────────────────────────────────────────
let best      = parseInt(localStorage.getItem('snakeBest') || '0');
let infinity  = false;   // wall-wrap mode

// ── Game state ───────────────────────────────────────────────
let snake, dir, nextDir, food;
let score, level, applesEaten;
let running, paused, usedRevive;
let loopId, animId;

updateBestUI();

// ── Theme toggle ─────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = dark ? 'DARK MODE' : 'LIGHT MODE';
}

// ── Mode toggle (box ↔ infinity) ─────────────────────────────
function toggleMode() {
  infinity = !infinity;
  ui.modeBtn.textContent = infinity ? 'BOX MODE' : 'INFINITY';
  ui.modeBtn.classList.toggle('active', infinity);
  if (running || score > 0) startGame();
}

// ── Start / Restart ──────────────────────────────────────────
function startGame() {
  snake        = [{ x:12, y:12 }, { x:11, y:12 }, { x:10, y:12 }];
  dir          = { x:1, y:0 };
  nextDir      = { x:1, y:0 };
  score        = 0;
  level        = 1;
  applesEaten  = 0;
  running      = true;
  paused       = false;
  usedRevive   = false;

  spawnFood();
  updateScoreUI();
  hideOverlay();
  startLoop();
}

// ── Revive (preserves score & level) ─────────────────────────
function revivePlayer() {
  usedRevive = true;
  snake      = [{ x:12, y:12 }, { x:11, y:12 }, { x:10, y:12 }];
  dir        = { x:1, y:0 };
  nextDir    = { x:1, y:0 };
  running    = true;
  paused     = false;

  spawnFood();
  hideOverlay();
  startLoop();
}

// ── Loop management ──────────────────────────────────────────
function startLoop() {
  clearInterval(loopId);
  cancelAnimationFrame(animId);
  loopId = setInterval(tick, speedAt(level));
  scheduleRender();
}

function scheduleRender() {
  animId = requestAnimationFrame(() => {
    draw();
    if (running) scheduleRender();
  });
}

// ── Tick (logic) ─────────────────────────────────────────────
function tick() {
  if (!running || paused) return;

  dir = nextDir;
  const head = wrapOrClip({ x: snake[0].x + dir.x, y: snake[0].y + dir.y });

  if (!infinity && isWallHit(head)) { endGame(); return; }
  if (isSelfHit(head))              { endGame(); return; }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    eatApple();
  } else {
    snake.pop();
  }
}

// ── Apple logic ───────────────────────────────────────────────
function eatApple() {
  score++;
  applesEaten++;
  if (score > best) { best = score; localStorage.setItem('snakeBest', best); }

  // Level up every APPLES_PER apples, cap at MAX_LEVEL
  if (applesEaten % APPLES_PER === 0 && level < MAX_LEVEL) {
    level++;
    clearInterval(loopId);
    loopId = setInterval(tick, speedAt(level));
  }

  spawnFood();
  updateScoreUI();
  animatePop();

  if (level === MAX_LEVEL && applesEaten % APPLES_PER === 0) winGame();
}

// ── Collision / wrap helpers ─────────────────────────────────
function wrapOrClip(pos) {
  if (!infinity) return pos;
  return {
    x: ((pos.x % COLS) + COLS) % COLS,
    y: ((pos.y % ROWS) + ROWS) % ROWS,
  };
}

function isWallHit(pos) {
  return pos.x < 0 || pos.x >= COLS || pos.y < 0 || pos.y >= ROWS;
}

function isSelfHit(pos) {
  return snake.some(s => s.x === pos.x && s.y === pos.y);
}

// ── Food spawn ────────────────────────────────────────────────
function spawnFood() {
  do {
    food = { x: rand(COLS), y: rand(ROWS) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

// ── End states ───────────────────────────────────────────────
function endGame() {
  stopGame();
  const isNewBest = score > 0 && score >= best;
  const title     = isNewBest ? 'NEW BEST!' : 'GAME OVER';
  const sub       = isNewBest ? 'Personal Record!'
                  : usedRevive ? 'No revives left.' : 'You have 1 revive.';

  showOverlay(title, fmt(score), sub, isNewBest ? 'pr' : 'gameover');
  ui.reviveBtn.style.display = usedRevive ? 'none' : 'block';
  ui.mainBtn.textContent = 'RESTART';
}

function winGame() {
  stopGame();
  showOverlay('YOU WIN!', fmt(score), 'MAX LEVEL REACHED!', 'win');
  ui.reviveBtn.style.display = 'none';
  ui.mainBtn.textContent = 'PLAY AGAIN';
}

function stopGame() {
  running = false;
  clearInterval(loopId);
  cancelAnimationFrame(animId);
  draw(); // render final frame before overlay appears
}

// ── Draw ─────────────────────────────────────────────────────
function draw() {
  const C = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  ctx.fillStyle = C('--surface');
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = C('--border');
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) line(x * CELL, 0, x * CELL, H);
  for (let y = 0; y <= ROWS; y++) line(0, y * CELL, W, y * CELL);

  drawSnake(C('--snake'));
  drawFood(C('--apple'));
}

function drawSnake(color) {
  ctx.fillStyle = color;
  snake.forEach(seg => {
    ctx.fillRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4);
  });
}

function drawFood(color) {
  const pulse = Math.sin(Date.now() / 300) * 1.5;
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(fx, fy, 5 + pulse * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Draw helpers ─────────────────────────────────────────────
function line(x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function dot(x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// ── UI helpers ───────────────────────────────────────────────
function fmt(n)   { return String(n).padStart(3, '0'); }
function fmtLv(n) { return String(n).padStart(2, '0'); }

function updateScoreUI() {
  ui.score.textContent = fmt(score);
  ui.level.textContent = fmtLv(level);
  updateBestUI();
}
function updateBestUI() {
  ui.best.textContent = fmt(best);
}

// type: 'pr' | 'gameover' | 'win'
function showOverlay(title, scoreText, sub, type) {
  ui.title.textContent   = title;
  ui.bigScore.textContent = scoreText;
  ui.sub.textContent     = sub;

  const colors = { pr: 'var(--snake)', gameover: 'var(--text)', win: 'var(--snake)' };
  ui.title.style.color = colors[type] || 'var(--text)';
  if (type === 'pr') ui.title.classList.add('pr-flash');

  ui.overlay.classList.remove('hidden');
}

function hideOverlay() {
  ui.overlay.classList.add('hidden');
  ui.title.classList.remove('pr-flash');
  ui.bigScore.textContent = '';
}

function animatePop() {
  ui.score.classList.remove('pop');
  void ui.score.offsetWidth;
  ui.score.classList.add('pop');
}

// ── Keyboard input ────────────────────────────────────────────
const DIRS = {
  ArrowUp:    {x:0,y:-1}, w:{x:0,y:-1}, W:{x:0,y:-1},
  ArrowDown:  {x:0,y:1},  s:{x:0,y:1},  S:{x:0,y:1},
  ArrowLeft:  {x:-1,y:0}, a:{x:-1,y:0}, A:{x:-1,y:0},
  ArrowRight: {x:1,y:0},  d:{x:1,y:0},  D:{x:1,y:0},
};

document.addEventListener('keydown', e => {
  if (DIRS[e.key]) {
    e.preventDefault();
    const nd = DIRS[e.key];
    if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
    return;
  }
  if (e.key === 'p' || e.key === 'P') { if (running) paused = !paused; }
  if (e.key === 'r' || e.key === 'R') startGame();
});

// ── Touch / Swipe ─────────────────────────────────────────────
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  const nd = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? {x:1,y:0} : {x:-1,y:0})
    : (dy > 0 ? {x:0,y:1} : {x:0,y:-1});
  if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
  touchStart = null;
}, { passive: true });

// ── Util ─────────────────────────────────────────────────────
function rand(n) { return Math.floor(Math.random() * n); }