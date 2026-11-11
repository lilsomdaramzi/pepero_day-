// 빼빼로 흔들기 매직
(() => {
'use strict';

/* ================= 기본 ================= */
const CFG = window.PEPERO_CONFIG || {};
const TO = (new URLSearchParams(location.search).get('to') || CFG.to || 'you').trim().slice(0, 14) || 'you';
const FROM = (CFG.from || '').trim() || 'Someone';
const $ = s => document.querySelector(s);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TODAY = (() => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`; })();
const FONT = '700 {s}px "Space Grotesk", "Jua", sans-serif';
const font = s => FONT.replace('{s}', s);
const BIG = s => `italic ${s}px "Anton", "Impact", sans-serif`;
const fontsReady = (document.fonts ? Promise.all([document.fonts.load(font(20)), document.fonts.load(BIG(20)), document.fonts.load('20px "Gowun Dodum"'), document.fonts.ready]) : Promise.resolve()).catch(() => {});

/* ================= 소리 ================= */
// 배경음악은 페이지 열릴 때부터 미리 받아둠
const BGM_EL = new Audio('background.mp3');
BGM_EL.loop = true; BGM_EL.preload = 'auto';
// 마지막 화면·저장 이미지 배경
const BG_IMG = new Image();
BG_IMG.src = 'bg-toronto.jpg';
const snd = {
  ac: null,
  muted: store.get('pepero-muted', false),
  init() {
    if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
  },
  tone(f0, f1, dur, type = 'sine', vol = .25, delay = 0) {
    if (this.muted || !this.ac) return;
    const ac = this.ac, t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, f0, f1, vol = .2, delay = 0) {
    if (this.muted || !this.ac) return;
    const ac = this.ac, t = ac.currentTime + delay, len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * .2);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t); src.stop(t + dur);
  },
  tok() { this.tone(1100, 380, .07, 'sine', .3); },
  pop() { this.tone(500, 1300, .08, 'triangle', .2); this.tone(1400, 700, .06, 'sine', .1, .05); },
  tick() { this.tone(rand(2200, 3400), rand(1000, 1600), .035, 'sine', .06); },
  pour() { this.noise(1.3, 300, 1200, .3); this.tone(220, 90, .5, 'sine', .15, .1); },
  magic() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, f * 1.002, .5, 'triangle', .09, i * .07)); this.noise(1.2, 3000, 8000, .06); },
  chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, f * 1.001, .6, 'triangle', .14, i * .1)); },
  // 배경음악: background.mp3 반복 재생. music(볼륨)으로 켜고 크기 조절 (아이폰도 볼륨이 먹게 WebAudio로 연결)
  bgm: null,
  music(level) {
    if (!this.ac) return;
    const ac = this.ac;
    if (!this.bgm) {
      const el = BGM_EL, out = ac.createGain();
      out.gain.value = 0;
      ac.createMediaElementSource(el).connect(out).connect(ac.destination);
      el.play().catch(() => {});
      this.bgm = { el, out, level: 0 };
    }
    if (level != null) this.bgm.level = level;
    this.bgm.out.gain.setTargetAtTime(this.muted ? 0 : this.bgm.level, ac.currentTime, .3);
  },
  horn() { for (const d of [0, .26]) { this.tone(440, 440, .2, 'square', .12, d); this.tone(554, 554, .2, 'square', .1, d); } },
  slam() { this.tone(120, 40, .35, 'sine', .5); this.noise(.25, 3000, 400, .25); },
  // 엔진: 톱니파 + 바람 소리, 매 프레임 set()으로 갱신
  engine() {
    if (!this.ac) return null;
    const ac = this.ac, o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g).connect(ac.destination);
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), wf = ac.createBiquadFilter(), wg = ac.createGain();
    src.buffer = buf; src.loop = true; wf.type = 'bandpass'; wf.frequency.value = 700; wg.gain.value = 0;
    src.connect(wf).connect(wg).connect(ac.destination);
    o1.start(); o2.start(); src.start();
    const e = {
      set: (hz, vol, wind) => {
        const t = ac.currentTime, m = this.muted ? 0 : 1;
        o1.frequency.setTargetAtTime(hz, t, .06); o2.frequency.setTargetAtTime(hz / 2, t, .06);
        f.frequency.setTargetAtTime(250 + hz * 7, t, .06);
        g.gain.setTargetAtTime(vol * m, t, .08); wg.gain.setTargetAtTime(wind * m, t, .2);
      },
      stop: () => { e.set(40, 0, 0); setTimeout(() => { o1.stop(); o2.stop(); src.stop(); }, 600); },
    };
    return e;
  },
};

/* ================= 빼빼로 그리기 ================= */
// 논리 좌표 (300x560) 기준
const G = { W: 300, H: 560, sx: 85, sw: 130, top: 16, bottom: 548 };
G.cx = G.sx + G.sw / 2;
G.len = G.bottom - G.top;
const COAT = .72 * G.len;

// night: 밤하늘 배경, glow: 빛 번짐
const CHOCO = {
  milk:    { base: '#6B3E26', light: '#94603F', dark: '#3F2214', gloss: .35 },
  white:   { base: '#F3E8D2', light: '#FFFDF7', dark: '#D3C09C', gloss: .5 },
  berry:   { base: '#F28DAE', light: '#FFC0D3', dark: '#C9617F', gloss: .4 },
  matcha:  { base: '#86AD5F', light: '#B2D08A', dark: '#5C8240', gloss: .35 },
  neon:    { base: '#FF2BD6', light: '#FFA6F2', dark: '#A00C8F', gloss: .5,  glow: '#FF2BD6', night: true },
  cyber:   { base: '#00D9FF', light: '#A8F6FF', dark: '#006F8F', gloss: .5,  glow: '#00D9FF', night: true },
  galaxy:  { base: '#3A2C8F', light: '#7B61D9', dark: '#160F45', gloss: .35, glow: '#7B61FF', night: true, galaxy: true },
  gold:    { base: '#D4AF37', light: '#FFF3B0', dark: '#8A6A12', gloss: .75 },
  rainbow: { base: '#FFB3C7', light: '#FFFFFF', dark: '#C98AB0', gloss: .5, rainbow: true },
};
const RAINBOW = ['#FF9AA2', '#FFC8A0', '#FFF0A0', '#B5EAD7', '#A0D2FF', '#C7B3FF'];
const pickConcept = () => CHOCO[CFG.concept] ? CFG.concept : pick(Object.keys(CHOCO));

function roundRectPath(x, y, w, h, r) {
  const p = new Path2D();
  p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  return p;
}

// 초코 영역 (아래쪽은 흘러내린 모양)
const chocoCache = new Map();
function chocoPath(p) {
  if (p.coat <= 0) return null;
  const key = p.seed + '|' + p.coat.toFixed(1);
  if (chocoCache.has(key)) return chocoCache.get(key);
  const r = rng(p.seed), x0 = G.sx - 3, x1 = G.sx + G.sw + 3, y0 = G.top - 3, yb = G.top + p.coat, R = 22;
  const path = new Path2D();
  path.moveTo(x0, yb); path.lineTo(x0, y0 + R); path.quadraticCurveTo(x0, y0, x0 + R, y0);
  path.lineTo(x1 - R, y0); path.quadraticCurveTo(x1, y0, x1, y0 + R); path.lineTo(x1, yb);
  const k = Math.min(1, p.coat / 120);
  for (let x = x1; x > x0 + .5;) {
    const d = Math.min(x - x0, 14 + r() * 20), xb = x - d, xm = (x + xb) / 2, L = (3 + r() * r() * 30) * k;
    path.bezierCurveTo(x - d * .25, yb, xm + d * .24, yb + L, xm, yb + L);
    path.bezierCurveTo(xm - d * .24, yb + L, xb + d * .25, yb, xb, yb);
    x = xb;
  }
  path.closePath();
  if (chocoCache.size > 300) chocoCache.clear();
  chocoCache.set(key, path);
  return path;
}

function drawBiscuit(ctx, p) {
  const { sx, sw, top, bottom } = G, path = roundRectPath(sx, top, sw, bottom - top, 16);
  const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  g.addColorStop(0, '#B4763C'); g.addColorStop(.3, '#EEC68C'); g.addColorStop(.6, '#DFAC6A'); g.addColorStop(1, '#A4672F');
  ctx.save();
  ctx.fillStyle = g; ctx.fill(path); ctx.clip(path);
  const r = rng(p.seed ^ 0x9e37);
  ctx.fillStyle = 'rgba(120,70,25,.22)';
  for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(sx + r() * sw, top + r() * (bottom - top), .8 + r() * 1.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawPepero(ctx, p, now = 0) {
  drawBiscuit(ctx, p);
  const cp = chocoPath(p);
  if (!cp) return;
  const c = CHOCO[p.choco], x0 = G.sx - 3, x1 = G.sx + G.sw + 3, yb = G.top + p.coat, px = ctx.getTransform().a;
  let g;
  if (c.rainbow) {
    g = ctx.createLinearGradient(0, G.top, 0, yb);
    RAINBOW.forEach((col, i) => g.addColorStop(i / (RAINBOW.length - 1), col));
  } else {
    g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, c.dark); g.addColorStop(.17, c.base); g.addColorStop(.33, c.light); g.addColorStop(.6, c.base); g.addColorStop(1, c.dark);
  }
  ctx.save();
  if (c.glow) { ctx.shadowColor = c.glow; ctx.shadowBlur = 22 * px; }
  ctx.fillStyle = g; ctx.fill(cp);
  ctx.restore();
  ctx.save();
  ctx.clip(cp);
  if (c.galaxy) {
    // 성운 + 별
    const r = rng(p.seed ^ 0x51ed);
    for (let i = 0; i < 4; i++) {
      const nx = G.sx + r() * G.sw, ny = G.top + r() * p.coat, ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 50);
      ng.addColorStop(0, ['rgba(255,120,220,.45)', 'rgba(120,200,255,.4)'][i % 2]); ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng; ctx.fillRect(x0, G.top - 5, x1 - x0, p.coat + 40);
    }
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) { ctx.globalAlpha = .4 + r() * .6; ctx.beginPath(); ctx.arc(G.sx + r() * G.sw, G.top + r() * p.coat, .5 + r() * 1.3, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // 사진은 토핑에 안 묻히게 맨 위에
  for (const it of p.items) if (it.k !== 'photo' && it.k !== 'fancy') drawItem(ctx, it, now);
  for (const it of p.items) if (it.k === 'photo' || it.k === 'fancy') drawItem(ctx, it, now);
  // 둥근 막대 느낌의 광택
  const gl = ctx.createLinearGradient(x0, 0, x1, 0);
  gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.26, `rgba(255,255,255,${c.gloss * .6})`);
  gl.addColorStop(.33, 'rgba(255,255,255,0)'); gl.addColorStop(.85, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,.2)');
  ctx.fillStyle = gl; ctx.fill(cp);
  ctx.restore();
  drawEyes(ctx, p, now);
}

// 몬스터 눈: 초코가 덮이면 뿅 생기고, 깜빡이고, 두리번거림
function drawEyes(ctx, p, now) {
  const grow = easeOut(clamp((p.coat - 70) / 50, 0, 1));
  if (grow <= 0) return;
  const c = CHOCO[p.choco], up = M && M.stage === 3;
  // 두리번 (사진 비 올 땐 위를 봄)
  const lx = up ? 0 : Math.sin(now / 1300) * .55, ly = up ? -.6 : Math.sin(now / 1700) * .25;
  // 깜빡: 3.4초마다, 가끔 두 번
  const ph = now % 3400, blink = ph < 150 ? 1 - Math.sin(ph / 150 * Math.PI) : (ph > 300 && ph < 450 && Math.floor(now / 3400) % 3 === 0 ? 1 - Math.sin((ph - 300) / 150 * Math.PI) : 1);
  const ink = c.night ? '#2A0B3A' : '#3B1E12';
  for (const [ex, ey, r, lashSide] of [[G.cx - 27, G.top + 58, 21, -1], [G.cx + 29, G.top + 64, 16, 1]]) {
    ctx.save();
    ctx.translate(ex, ey); ctx.scale(grow, grow);
    // 볼터치
    ctx.fillStyle = 'rgba(255,120,170,.45)';
    ctx.beginPath(); ctx.ellipse(lashSide * r * .25, r * 1.45, r * .55, r * .28, 0, 0, TAU); ctx.fill();
    if (blink < .15) {
      // 감은 눈 (웃는 곡선)
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, -r * .1, r * .75, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
    } else {
      ctx.save(); ctx.scale(1, blink);
      // 흰자
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      const wg = ctx.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r);
      wg.addColorStop(0, '#FFFFFF'); wg.addColorStop(1, '#E6E1EE');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
      // 눈동자
      const px = lx * r * .38, py = ly * r * .38;
      ctx.fillStyle = c.glow || '#7A4A2E';
      ctx.beginPath(); ctx.arc(px, py, r * .58, 0, TAU); ctx.fill();
      ctx.fillStyle = '#120812';
      ctx.beginPath(); ctx.arc(px, py, r * .38, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px - r * .18, py - r * .2, r * .17, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(px + r * .17, py + r * .14, r * .08, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // 속눈썹
    ctx.strokeStyle = ink; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    const top = -r * Math.max(blink, .15);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + lashSide * (.45 + i * .32), bx = Math.cos(a) * r, by = Math.sin(a) * r * Math.max(blink, .15);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * r * .38, by + Math.sin(a) * r * .38 + (top > -r * .5 ? r * .2 : 0)); ctx.stroke();
    }
    ctx.restore();
  }
  // 작은 입
  ctx.save();
  ctx.translate(G.cx + 2, G.top + 92); ctx.scale(grow, grow);
  ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-5, 0, 5, .1 * Math.PI, .9 * Math.PI); ctx.arc(5, 0, 5, .1 * Math.PI, .9 * Math.PI); ctx.stroke();
  ctx.restore();
}

function heartPath(ctx, s) {
  ctx.beginPath(); ctx.moveTo(0, s * .9);
  ctx.bezierCurveTo(-s * 1.3, 0, -s * .6, -s * 1.05, 0, -s * .35);
  ctx.bezierCurveTo(s * .6, -s * 1.05, s * 1.3, 0, 0, s * .9);
  ctx.closePath();
}
function starPath(ctx, s) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath();
}
function twinklePath(ctx, z) {
  ctx.beginPath(); ctx.moveTo(0, -z);
  ctx.quadraticCurveTo(0, 0, z, 0); ctx.quadraticCurveTo(0, 0, 0, z); ctx.quadraticCurveTo(0, 0, -z, 0); ctx.quadraticCurveTo(0, 0, 0, -z);
}

// 토핑·사진 하나 (t가 있으면 톡 튀어나오는 애니메이션)
function drawItem(ctx, it, now) {
  let s = 1, a = 1;
  if (it.t && now) {
    const k = clamp((now - it.t) / 320, 0, 1);
    if (k <= 0) return;
    if (k < 1) { s = 1.7 - .7 * easeOut(k); a = k; }
  }
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(it.x, it.y); ctx.rotate(it.rot || 0); ctx.scale(s, s);
  switch (it.k) {
    case 'sprinkle':
      ctx.lineCap = 'round'; ctx.lineWidth = 3.6; ctx.strokeStyle = it.c;
      ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0); ctx.stroke();
      ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.moveTo(-3.5, -.8); ctx.lineTo(3, -.8); ctx.stroke();
      break;
    case 'glitter':
      ctx.fillStyle = it.c; twinklePath(ctx, it.s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(0, 0, it.s * .18, 0, TAU); ctx.fill();
      break;
    case 'heart':
      heartPath(ctx, it.s); ctx.fillStyle = it.c; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(-it.s * .38, -it.s * .35, it.s * .18, it.s * .12, -.6, 0, TAU); ctx.fill();
      break;
    case 'star':
      starPath(ctx, it.s); ctx.fillStyle = it.c; ctx.fill();
      break;
    case 'photo': {
      const ph = PHOTOS[it.i] || PHOTOS[0];
      drawSticker(ctx, ph, it.r, ph.shape);
      break;
    }
    case 'fancy':
      drawFancy(ctx, it.kind, it.r, now);
      break;
  }
  ctx.restore();
}

/* ================= 사진 ================= */
const SHAPES = ['circle', 'heart', 'star', 'cat', 'flower'];
function placeholder(i) {
  const c = document.createElement('canvas'); c.width = c.height = 240;
  const x = c.getContext('2d');
  x.fillStyle = ['#FFD3DF', '#FFE7A8', '#CFEFE3', '#D9D3FF', '#FFDCC2'][i % 5];
  x.fillRect(0, 0, 240, 240);
  x.fillStyle = '#4A2A1A';
  x.beginPath(); x.arc(88, 108, 10, 0, TAU); x.arc(152, 108, 10, 0, TAU); x.fill();
  x.strokeStyle = '#4A2A1A'; x.lineWidth = 7; x.lineCap = 'round';
  x.beginPath(); x.arc(120, 122, 22, .2 * Math.PI, .8 * Math.PI); x.stroke();
  return c;
}
const PHOTOS = (CFG.photos && CFG.photos.length ? CFG.photos : [null, null, null, null, null]).map((e, i) => {
  const src = e && (typeof e === 'string' ? e : e.src);
  const ph = {
    fx: (e && e.focusX != null) ? e.focusX : .5, fy: (e && e.focusY != null) ? e.focusY : .5,
    shape: SHAPES.includes(e && e.shape) ? e.shape : SHAPES[i % SHAPES.length], img: placeholder(i),
  };
  if (src) {
    const im = new Image();
    im.onload = () => {
      // 큰 사진은 줄여서 보관
      const s = Math.min(1, 480 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      ph.img = c;
    };
    im.src = src;
  }
  return ph;
});

// 스티커 모양 (반지름 r 안에 맞춤)
function shapePath(ctx, sh, r) {
  ctx.beginPath();
  if (sh === 'heart') {
    ctx.moveTo(0, r * 1.02);
    ctx.bezierCurveTo(-r * 1.5, r * .02, -r * .95, -r * 1.3, 0, -r * .52);
    ctx.bezierCurveTo(r * .95, -r * 1.3, r * 1.5, r * .02, 0, r * 1.02);
  } else if (sh === 'star') {
    // 둥근 별: 꼭짓점을 제어점으로, 변의 중점을 지나감
    const pts = [];
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .7 : r * 1.12, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(a) * rr, Math.sin(a) * rr + r * .06]); }
    const m = i => { const a = pts[i % 10], b = pts[(i + 1) % 10]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    ctx.moveTo(...m(9));
    for (let i = 0; i < 10; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], ...m(i));
  } else if (sh === 'cat') {
    ctx.moveTo(-r * .9, -r * .3);
    ctx.lineTo(-r * .82, -r * 1.08); ctx.quadraticCurveTo(-r * .78, -r * 1.16, -r * .7, -r * 1.1);
    ctx.lineTo(-r * .3, -r * .78);
    ctx.quadraticCurveTo(0, -r * .9, r * .3, -r * .78);
    ctx.lineTo(r * .7, -r * 1.1); ctx.quadraticCurveTo(r * .78, -r * 1.16, r * .82, -r * 1.08);
    ctx.lineTo(r * .9, -r * .3);
    ctx.bezierCurveTo(r * 1.12, r * .35, r * .62, r * .95, 0, r * .95);
    ctx.bezierCurveTo(-r * .62, r * .95, -r * 1.12, r * .35, -r * .9, -r * .3);
  } else if (sh === 'flower') {
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, x = Math.cos(a) * r * .58, y = Math.sin(a) * r * .58; ctx.moveTo(x + r * .48, y); ctx.arc(x, y, r * .48, 0, TAU); }
    ctx.moveTo(r * .7, 0); ctx.arc(0, 0, r * .7, 0, TAU);
  } else {
    ctx.arc(0, 0, r, 0, TAU);
  }
  ctx.closePath();
}
function drawPhoto(ctx, ph, r, sh) {
  const im = ph.img, w = im.width, h = im.height, sc = 2.2 * r / Math.min(w, h), dw = w * sc, dh = h * sc, R = 1.1 * r;
  ctx.save();
  shapePath(ctx, sh, r); ctx.clip();
  ctx.drawImage(im, -R - (dw - 2 * R) * ph.fx, -R - (dh - 2 * R) * ph.fy, dw, dh);
  ctx.restore();
}
// 흰 테두리 + 그림자 + 사진
function drawSticker(ctx, ph, r, sh) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fff'; shapePath(ctx, sh, r + 4); ctx.fill();
  ctx.restore();
  drawPhoto(ctx, ph, r, sh);
}

// 반짝이 스티커: CN타워, 다이아, 돈, 코인, 빼빼로, 단풍잎, 하트 (흰 테두리 스티커)
function drawFancy(ctx, kind, r, now = 0) {
  const p = new Path2D();
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'diamond') {
    p.moveTo(-r * .9, -r * .25); p.lineTo(-r * .5, -r * .7); p.lineTo(r * .5, -r * .7); p.lineTo(r * .9, -r * .25); p.lineTo(0, r * .9); p.closePath();
  } else if (kind === 'money') {
    p.addPath(roundRectPath(-r, -r * .55, r * 2, r * 1.1, r * .12));
  } else if (kind === 'coin' ) {
    p.arc(0, 0, r * .85, 0, TAU);
  } else if (kind === 'cn') {
    p.moveTo(-r * .2, r); p.lineTo(-r * .06, -r * .3); p.lineTo(r * .06, -r * .3); p.lineTo(r * .2, r); p.closePath();
    p.moveTo(r * .32, -r * .3); p.ellipse(0, -r * .3, r * .32, r * .13, 0, 0, TAU);
    p.addPath(roundRectPath(-r * .045, -r * .62, r * .09, r * .34, r * .03));
    p.moveTo(r * .13, -r * .6); p.ellipse(0, -r * .6, r * .13, r * .06, 0, 0, TAU);
    p.addPath(roundRectPath(-r * .02, -r * 1, r * .04, r * .42, r * .02));
  } else if (kind === 'pepero') {
    p.addPath(roundRectPath(-r * .17, -r, r * .34, r * 2, r * .17));
  } else if (kind === 'maple') {
    const L = [[0, -1], [.15, -.6], [.4, -.75], [.35, -.35], [.75, -.45], [.62, -.15], [.85, 0], [.45, .15], [.5, .4], [.1, .25], [.06, .8], [-.06, .8], [-.1, .25], [-.5, .4], [-.45, .15], [-.85, 0], [-.62, -.15], [-.75, -.45], [-.35, -.35], [-.4, -.75], [-.15, -.6]];
    L.forEach(([a, b], i) => (i ? p.lineTo(a * r, b * r) : p.moveTo(a * r, b * r))); p.closePath();
  } else {
    p.moveTo(0, r * .85); p.bezierCurveTo(-r * 1.25, 0, -r * .6, -r * 1.05, 0, -r * .38); p.bezierCurveTo(r * .6, -r * 1.05, r * 1.25, 0, 0, r * .85); p.closePath();
  }
  // 흰 테두리 + 그림자
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(3, r * .22); ctx.stroke(p);
  ctx.fillStyle = '#fff'; ctx.fill(p);
  ctx.restore();
  let g;
  if (kind === 'diamond') {
    g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#E6FDFF'); g.addColorStop(.5, '#7FDBFF'); g.addColorStop(1, '#4A6BFF');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1, r * .05);
    ctx.beginPath();
    ctx.moveTo(-r * .9, -r * .25); ctx.lineTo(r * .9, -r * .25);
    ctx.moveTo(-r * .5, -r * .7); ctx.lineTo(-r * .22, -r * .25); ctx.lineTo(0, r * .9); ctx.lineTo(r * .22, -r * .25); ctx.lineTo(r * .5, -r * .7);
    ctx.moveTo(0, -r * .7); ctx.lineTo(-r * .22, -r * .25); ctx.moveTo(0, -r * .7); ctx.lineTo(r * .22, -r * .25);
    ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(r * .55, -r * .75); twinklePath(ctx, r * .3 * (.7 + .3 * Math.sin(now / 150))); ctx.fill(); ctx.restore();
  } else if (kind === 'money') {
    g = ctx.createLinearGradient(0, -r * .55, 0, r * .55); g.addColorStop(0, '#9BE29A'); g.addColorStop(1, '#4FA65A');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.strokeStyle = '#2E7A3C'; ctx.lineWidth = Math.max(1, r * .05); ctx.stroke(roundRectPath(-r * .85, -r * .42, r * 1.7, r * .84, r * .08));
    ctx.fillStyle = '#C8F2C4'; ctx.beginPath(); ctx.ellipse(0, 0, r * .32, r * .32, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1F5E2C'; ctx.font = font(r * .5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, r * .03);
    ctx.font = font(r * .22); ctx.fillText('100', -r * .62, -r * .25); ctx.fillText('100', r * .62, r * .27);
  } else if (kind === 'coin') {
    g = ctx.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r); g.addColorStop(0, '#FFF3A8'); g.addColorStop(.6, '#F5C53A'); g.addColorStop(1, '#C8901A');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.strokeStyle = '#B07A12'; ctx.lineWidth = Math.max(1, r * .06); ctx.beginPath(); ctx.arc(0, 0, r * .65, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#9A6A0E'; ctx.font = font(r * .8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, r * .05);
  } else if (kind === 'cn') {
    g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#FF6BD6'); g.addColorStop(.5, '#9B6BFF'); g.addColorStop(1, '#3A2A8F');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.fillStyle = '#FFE27A';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * r * .08, -r * .3, Math.max(.8, r * .025), 0, TAU); ctx.fill(); }
    ctx.fillStyle = Math.floor(now / 400) % 2 ? '#FF3040' : '#FF9AA0';
    ctx.beginPath(); ctx.arc(0, -r, Math.max(1.2, r * .06), 0, TAU); ctx.fill();
  } else if (kind === 'pepero') {
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = '#E8B470'; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = '#FF5BC8'; ctx.fillRect(-r, -r, r * 2, r * 1.25);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-r * .1, -r, r * .07, r * 1.25);
    const cs = ['#FFE066', '#7FD8BE', '#fff', '#57C7FF'];
    for (let i = 0; i < 7; i++) { ctx.fillStyle = cs[i % 4]; ctx.fillRect(-r * .12 + (i % 2) * r * .14, -r * .85 + i * r * .15, r * .1, r * .04); }
    ctx.restore();
  } else if (kind === 'maple') {
    g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#FF5A5A'); g.addColorStop(1, '#C8102E');
    ctx.fillStyle = g; ctx.fill(p);
  } else {
    g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#FF9AC8'); g.addColorStop(1, '#FF3D7F');
    ctx.fillStyle = g; ctx.fill(p);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-r * .35, -r * .35, r * .16, r * .1, -.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* ================= 캔버스 공통 ================= */
const DPR = () => Math.min(window.devicePixelRatio || 1, 2.5);
function fit(cv, W, H) {
  const st = cv.parentElement, w = st.clientWidth, h = st.clientHeight;
  if (!w || !h) return;
  const k = Math.min(w / W, h / H), dpr = DPR();
  cv.style.width = W * k + 'px'; cv.style.height = H * k + 'px';
  cv.width = Math.round(W * k * dpr); cv.height = Math.round(H * k * dpr);
  cv._s = cv.width / W;
}
function begin(cv, s) {
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(s, 0, 0, s, 0, 0);
  return ctx;
}
function fullCanvas(cv) {
  const dpr = DPR();
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv._s = dpr;
}

/* ================= 상태 ================= */
let P, M;
const cvMagic = $('#cvMagic'), cvRain = $('#rain');
function reset() {
  const choco = pickConcept();
  P = { choco, coat: 0, seed: (Math.random() * 1e9) | 0, items: [] };
  // stage: 0 첫 흔들기 대기, 1 초코 쏟아지는 중, 2 두 번째 흔들기 대기, 3 사진 비, 4 끝
  M = { stage: 0, t0: 0, ready: 0, fallers: [], drips: [], drops: [], sparks: [], landed: 0, deco: [], decoUntil: 0 };
  document.body.classList.toggle('night', !!CHOCO[choco].night);
  blobs.pepero = null;
}
const blobs = {};

/* ================= 0. 배달 드라이브 (약 15초) ================= */
const cvDrive = $('#cvDrive');
const DR = { on: false, t0: 0, last: 0, dist: 0, eng: null, fired: new Set(), flash: 0 };
const DRIVE_MS = 15200;
const TOP = 165;
// 시간(ms) → 속도(mph)
function speedAt(t) {
  if (t < 1700) return 0;
  if (t < 10000) return TOP * Math.pow((t - 1700) / 8300, .65);
  if (t < 12600) return TOP;
  if (t < 14300) return TOP * Math.pow(1 - (t - 12600) / 1700, 2);
  return 0;
}
// 쾅 박히는 문구
const SLAMS = [
  { t: 2700, end: 4600, text: "WHAT'S GOING ON???" },
  { t: 5000, end: 7100, text: 'WHAT DELIVERY???' },
  { t: 7500, end: 9900, small: `FROM ${FROM.toUpperCase()}`, text: `TO ${TO.toUpperCase()}` },
  { t: 10300, end: 12500, text: 'SPECIAL\nDELIVERY' },
  { t: 13500, end: DRIVE_MS, text: 'ARRIVED.' },
];
// 시간에 맞춰 한 번씩 실행
const CUES = [
  [200, () => { snd.horn(); buzz([80, 60, 80]); notif('Beep beep! Your delivery is on the way.'); }],
  [1800, () => $('#notif').classList.remove('show')],
  [13300, () => { snd.horn(); buzz([80, 60, 80]); }],
  [13900, () => notif(`Delivered ✓  A package for ${TO} has arrived.`)],
  ...SLAMS.map(s => [s.t, () => { snd.slam(); buzz(40); DR.flash = performance.now(); }]),
];
function notif(text) { $('#notifText').textContent = text; $('#notif').classList.add('show'); }

$('#btnGo').onclick = () => {
  // 시작하면 소리는 무조건 켬
  snd.muted = false; store.set('pepero-muted', false); updMute();
  snd.init(); snd.music(.8);
  // iOS 흔들기 권한 (탭할 때만 물어볼 수 있음)
  try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().catch(() => {}); } catch (e) {}
  $('#driveStart').hidden = true; $('#btnSkip').hidden = false;
  fullCanvas(cvDrive);
  Object.assign(DR, { on: true, t0: performance.now(), last: performance.now(), dist: 0, fired: new Set(), eng: snd.engine() });
};
$('#btnSkip').onclick = endDrive;
function endDrive() {
  if (!DR.on) return;
  DR.on = false;
  if (DR.eng) DR.eng.stop();
  snd.music(.35);
  $('#notif').classList.remove('show');
  $('#s-drive').hidden = true; $('#s-intro').hidden = false;
}

// 원근: 깊이 z(1=코앞) → 화면 좌표
function drawDrive(now) {
  const W = innerWidth, H = innerHeight, t = now - DR.t0, ctx = begin(cvDrive, cvDrive._s);
  const v = speedAt(t), dt = Math.min(50, now - DR.last), sp = v / TOP;
  DR.last = now; DR.dist += v * dt * .00011;
  CUES.forEach(([at, fn], i) => { if (t >= at && !DR.fired.has(i)) { DR.fired.add(i); fn(); } });
  // 엔진음: 기어마다 rpm이 올랐다 떨어짐
  const gears = [0, 35, 70, 105, 140, 175];
  let g = 1; while (g < 5 && v > gears[g]) g++;
  const rpm = v <= 0 ? 0 : clamp((v - gears[g - 1]) / (gears[g] - gears[g - 1]), 0, 1);
  if (DR.eng) DR.eng.set(v <= 0 ? 38 : 55 + rpm * 120 + g * 6, v <= 0 ? .05 : .09 + rpm * .05, sp * .12);

  const y0 = H * .42, vp = W * .46, RW = W * 1.15, Y = z => y0 + (H - y0) / z, X = (u, z) => vp + u * RW / z;
  ctx.save();
  ctx.translate(rand(-1, 1) * sp * 2.5, rand(-1, 1) * sp * 2.5);
  // 토론토 밤하늘 (도시 불빛에 지평선이 보랏빛)
  let gr = ctx.createLinearGradient(0, 0, 0, y0);
  gr.addColorStop(0, '#04061A'); gr.addColorStop(.6, '#141C46'); gr.addColorStop(1, '#4A3466');
  ctx.fillStyle = gr; ctx.fillRect(-10, -10, W + 20, y0 + 10);
  let r = rng(11);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 50; i++) { ctx.globalAlpha = .3 + r() * .6; ctx.fillRect(r() * W, r() * y0 * .8, 1.3, 1.3); }
  ctx.globalAlpha = 1;
  // 스카이라인 (다가갈수록 커짐)
  const zoom = 1 + Math.min(DR.dist, 80) * .006, base = y0 + 1, cx0 = vp + W * .08;
  r = rng(5);
  const towers = [];
  for (let i = 0; i < 26; i++) towers.push({ x: (r() - .5) * 1.5, w: .03 + r() * .05, h: .05 + r() * r() * .2, lit: r() });
  towers.sort((a, b) => b.h - a.h);
  for (const b of towers) {
    const bx = cx0 + b.x * W * zoom, bw = b.w * W * zoom, bh = b.h * H * zoom;
    ctx.fillStyle = '#0B1026'; ctx.fillRect(bx, base - bh, bw, bh);
    // 불 켜진 창문
    const wr = rng(Math.floor(b.lit * 1e6));
    for (let yy = base - bh + 3; yy < base - 2; yy += 4 * zoom) for (let xx = bx + 2; xx < bx + bw - 2; xx += 3.5 * zoom) {
      if (wr() < .35) { ctx.fillStyle = wr() < .8 ? 'rgba(255,214,140,.85)' : 'rgba(170,220,255,.8)'; ctx.fillRect(xx, yy, 1.4 * zoom, 1.6 * zoom); }
    }
  }
  // CN 타워
  // 지붕에 안 가리게 높이 제한, 보랏빛 조명
  const tx = vp - W * .16 * zoom, th = Math.min(H * .2 * zoom, y0 - H * .2), tw = W * .02 * zoom;
  gr = ctx.createRadialGradient(tx, base - th * .5, 0, tx, base - th * .5, th * .7);
  gr.addColorStop(0, 'rgba(190,110,255,.28)'); gr.addColorStop(1, 'rgba(190,110,255,0)');
  ctx.fillStyle = gr; ctx.fillRect(tx - th, base - th * 1.2, th * 2, th * 1.2);
  gr = ctx.createLinearGradient(tx - tw, 0, tx + tw, 0);
  gr.addColorStop(0, '#2A1850'); gr.addColorStop(.5, '#9B6BFF'); gr.addColorStop(1, '#2A1850');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(tx - tw, base); ctx.lineTo(tx - tw * .3, base - th * .72); ctx.lineTo(tx + tw * .3, base - th * .72); ctx.lineTo(tx + tw, base); ctx.fill();
  ctx.fillRect(tx - tw * .15, base - th, tw * .3, th * .3);
  ctx.fillStyle = '#1A1238';
  ctx.beginPath(); ctx.ellipse(tx, base - th * .72, tw * 1.6, tw * .7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(tx, base - th * .84, tw * .7, tw * .35, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,120,.95)';
  for (let i = -5; i <= 5; i++) ctx.fillRect(tx + i * tw * .28 - .6, base - th * .72 - .8, 1.2, 1.6);
  if (Math.floor(now / 600) % 2) {
    gr = ctx.createRadialGradient(tx, base - th, 0, tx, base - th, tw * 2);
    gr.addColorStop(0, 'rgba(255,40,40,1)'); gr.addColorStop(1, 'rgba(255,40,40,0)');
    ctx.fillStyle = gr; ctx.fillRect(tx - tw * 2, base - th - tw * 2, tw * 4, tw * 4);
  }
  // 도시 불빛 번짐
  gr = ctx.createLinearGradient(0, y0 - H * .08, 0, y0);
  gr.addColorStop(0, 'rgba(255,170,90,0)'); gr.addColorStop(1, 'rgba(255,170,90,.18)');
  ctx.fillStyle = gr; ctx.fillRect(-10, y0 - H * .08, W + 20, H * .08);
  // 땅 (왼쪽은 밤 호수)
  ctx.fillStyle = '#07090F'; ctx.fillRect(-10, y0, W + 20, H - y0 + 10);
  // 도로
  const quad = (u0, u1, z0, z1) => { ctx.beginPath(); ctx.moveTo(X(u0, z0), Y(z0)); ctx.lineTo(X(u1, z0), Y(z0)); ctx.lineTo(X(u1, z1), Y(z1)); ctx.lineTo(X(u0, z1), Y(z1)); ctx.closePath(); };
  gr = ctx.createLinearGradient(0, y0, 0, H);
  gr.addColorStop(0, '#2B2C35'); gr.addColorStop(1, '#141519');
  ctx.fillStyle = gr; quad(-1.05, 1.05, 1, 400); ctx.fill();
  // 헤드라이트 불빛
  gr = ctx.createRadialGradient(vp, H * .95, 0, vp, H * .95, W * .8);
  gr.addColorStop(0, 'rgba(255,245,220,.28)'); gr.addColorStop(1, 'rgba(255,245,220,0)');
  ctx.fillStyle = gr; quad(-1.05, 1.05, 1, 6); ctx.fill();
  ctx.fillStyle = '#C9A227'; quad(-1, -.97, 1, 400); ctx.fill();
  ctx.fillStyle = '#BFC3CC'; quad(.97, 1, 1, 400); ctx.fill();
  // 차선 점선 (앞으로 흘러옴)
  const SP = 5, off = DR.dist % SP;
  ctx.fillStyle = '#D8DCE4';
  for (let k = 0; k < 40; k++) {
    const z = 1 + k * SP - off;
    if (z < .6) continue;
    ctx.globalAlpha = clamp(3 / z, .25, 1);
    for (const u of [-.34, .34]) { quad(u - .012, u + .012, Math.max(z, .6), z + 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  // 왼쪽 중앙분리대
  ctx.fillStyle = '#23252C';
  ctx.beginPath(); ctx.moveTo(X(-1.1, 1), Y(1)); ctx.lineTo(X(-1.1, 400), Y(400)); ctx.lineTo(X(-1.1, 400), Y(400) - H * .06 / 400); ctx.lineTo(X(-1.1, 1), Y(1) - H * .06); ctx.fill();
  // 앞차 후미등
  for (const [u, z0, ph] of [[-.66, 9, 0], [.66, 14, 2], [0, 24, 4]]) {
    const z = z0 + Math.sin(now / 1500 + ph) * 2.5, cw = W * .3 / z, ch = cw * .45, x = X(u, z), y = Y(z);
    ctx.fillStyle = '#0A0B0F'; ctx.fillRect(x - cw / 2, y - ch, cw, ch);
    for (const s of [-1, 1]) {
      gr = ctx.createRadialGradient(x + s * cw * .38, y - ch * .55, 0, x + s * cw * .38, y - ch * .55, cw * .35);
      gr.addColorStop(0, 'rgba(255,40,50,1)'); gr.addColorStop(.25, 'rgba(255,40,50,.7)'); gr.addColorStop(1, 'rgba(255,40,50,0)');
      ctx.fillStyle = gr; ctx.fillRect(x + s * cw * .38 - cw * .35, y - ch * .55 - cw * .35, cw * .7, cw * .7);
    }
  }
  // 가로등 (오렌지 불빛, 멀리서부터)
  const LS = 6, loff = DR.dist % LS;
  for (let k = 30; k >= 0; k--) {
    const z = 1 + k * LS - loff;
    if (z < .5) continue;
    for (const s of [-1, 1]) {
      const px = X(s * 1.22, z), py = Y(z), hgt = H * .55 / z, lx = X(s * .8, z), ly = py - hgt;
      ctx.strokeStyle = '#1A1C22'; ctx.lineWidth = Math.max(1, W * .012 / z);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, ly); ctx.lineTo(lx, ly); ctx.stroke();
      gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, W * .25 / z);
      gr.addColorStop(0, 'rgba(255,190,100,.95)'); gr.addColorStop(.15, 'rgba(255,170,70,.5)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(lx, ly, W * .25 / z, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,80,.08)';
      ctx.beginPath(); ctx.ellipse(X(s * .7, z), py, W * .35 / z, H * .1 / z, 0, 0, TAU); ctx.fill();
    }
  }
  // 고속도로 표지판 (한 번 지나감)
  const sz = 1 + 70 - DR.dist;
  if (sz > .8 && sz < 300) {
    const sy = Y(sz) - H * .62 / sz, pw = W * .012 / sz, gx0 = X(-.2, sz), gx1 = X(1.1, sz), gh = H * .16 / sz;
    ctx.fillStyle = '#2A2D35';
    ctx.fillRect(X(-1.15, sz) - pw / 2, sy, pw, Y(sz) - sy); ctx.fillRect(X(1.15, sz) - pw / 2, sy, pw, Y(sz) - sy);
    ctx.fillRect(X(-1.15, sz), sy + gh * .2, X(1.15, sz) - X(-1.15, sz), pw * 1.5);
    ctx.fillStyle = '#0B6B3A'; ctx.fill(roundRectPath(gx0, sy - gh * .3, gx1 - gx0, gh, gh * .08));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(.5, gh * .03); ctx.stroke(roundRectPath(gx0 + gh * .05, sy - gh * .25, gx1 - gx0 - gh * .1, gh * .9, gh * .06));
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = font(gh * .26); ctx.fillText('Gardiner Expy  E', gx0 + gh * .2, sy - gh * .05);
    ctx.font = font(gh * .22); ctx.fillText('↑  Downtown Toronto', gx0 + gh * .2, sy + gh * .32);
  }
  // 속도선
  if (sp > .5) {
    ctx.strokeStyle = `rgba(255,255,255,${(sp - .5) * .5})`; ctx.lineWidth = 1.5;
    const r = rng(Math.floor(now / 60));
    for (let i = 0; i < 14; i++) {
      const a = r() * TAU, r0 = W * (.35 + r() * .2), r1 = r0 + W * (.15 + r() * .25);
      ctx.beginPath(); ctx.moveTo(vp + Math.cos(a) * r0, y0 + Math.sin(a) * r0); ctx.lineTo(vp + Math.cos(a) * r1, y0 + Math.sin(a) * r1); ctx.stroke();
    }
  }
  ctx.restore();

  // 차 안 (살짝만 흔들림)
  ctx.save();
  ctx.translate(rand(-1, 1) * sp, rand(-1, 1) * sp);
  // 천장
  ctx.fillStyle = '#2B2723';
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, H * .15); ctx.quadraticCurveTo(W * .5, H * .25, -10, H * .18); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.beginPath(); ctx.moveTo(-10, H * .15); ctx.quadraticCurveTo(W * .5, H * .22, W + 10, H * .13); ctx.lineTo(W + 10, H * .15); ctx.quadraticCurveTo(W * .5, H * .25, -10, H * .18); ctx.fill();
  // 룸미러
  ctx.fillStyle = '#1A1A1C'; ctx.fill(roundRectPath(W * .76, H * .2, W * .28, H * .045, 12));
  // 대시보드
  ctx.fillStyle = '#1D2024';
  ctx.beginPath(); ctx.moveTo(-10, H * .7); ctx.quadraticCurveTo(W * .5, H * .63, W + 10, H * .69); ctx.lineTo(W + 10, H + 10); ctx.lineTo(-10, H + 10); ctx.fill();
  ctx.strokeStyle = '#F28C28'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-10, H * .7); ctx.quadraticCurveTo(W * .5, H * .63, W + 10, H * .69); ctx.stroke();
  // 계기판
  const gw = W * .48, gh = H * .085, gx = W * .45 - gw / 2, gy = H * .875;
  ctx.fillStyle = '#07080A'; ctx.fill(roundRectPath(gx, gy, gw, gh, 10));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F28C28'; ctx.font = BIG(gh * .55); ctx.fillText(v <= 0 ? 'N' : String(g), gx + gw * .18, gy + gh * .5);
  ctx.fillStyle = '#fff'; ctx.font = BIG(gh * .6); ctx.fillText(String(Math.round(v)), gx + gw * .55, gy + gh * .45);
  ctx.font = font(gh * .16); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('MPH', gx + gw * .55, gy + gh * .85);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i / 10 < rpm ? (i > 7 ? '#FF3B30' : '#F28C28') : 'rgba(255,255,255,.12)';
    ctx.fillRect(gx + gw * .8, gy + gh * (.85 - i * .075), gw * .12, gh * .05);
  }
  // 핸들
  const hx = W * .45, hy = H * 1.08, hr = W * .5;
  ctx.lineWidth = W * .075; ctx.strokeStyle = '#121214';
  ctx.beginPath(); ctx.arc(hx, hy, hr, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.arc(hx, hy, hr + W * .03, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
  ctx.restore();

  // 문구 슬램
  for (const s of SLAMS) if (t >= s.t && t < s.end) slamText(ctx, s, t, W, H);
  // 번쩍
  const fk = (now - DR.flash) / 250;
  if (fk >= 0 && fk < 1) { ctx.fillStyle = `rgba(255,255,255,${.35 * (1 - fk)})`; ctx.fillRect(0, 0, W, H); }
  // 끝: 하얗게 페이드
  if (t > DRIVE_MS - 600) { ctx.fillStyle = `rgba(255,241,244,${clamp((t - DRIVE_MS + 600) / 600, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  if (t > DRIVE_MS) endDrive();
}

function slamText(ctx, s, t, W, H) {
  const k = clamp((t - s.t) / 320, 0, 1), out = clamp((s.end - t) / 220, 0, 1);
  const sc = 1 + (1 - easeOut(k)) * 2.4, a = Math.min(k * 2, out), lines = s.text.split('\n');
  let fs = W * .15;
  ctx.font = BIG(fs);
  const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (widest > W * .88) fs *= W * .88 / widest;
  const glitch = t - s.t < 450 ? 6 : (Math.random() < .06 ? 4 : 0);
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.translate(W / 2, H * .43); ctx.scale(sc, sc); ctx.transform(1, 0, -.12, 1, 0, 0);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (s.small) { ctx.font = font(fs * .32); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; ctx.fillText(s.small, 0, -fs * .85); }
  ctx.font = BIG(fs);
  lines.forEach((l, i) => {
    const y = (i - (lines.length - 1) / 2) * fs * 1.05;
    ctx.shadowBlur = 0;
    if (glitch) {
      ctx.fillStyle = 'rgba(255,45,85,.85)'; ctx.fillText(l, -glitch, y + rand(-2, 2));
      ctx.fillStyle = 'rgba(0,229,255,.85)'; ctx.fillText(l, glitch, y + rand(-2, 2));
    }
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18;
    ctx.lineWidth = fs * .06; ctx.strokeStyle = '#000'; ctx.strokeText(l, 0, y);
    ctx.fillStyle = '#fff'; ctx.fillText(l, 0, y);
  });
  ctx.restore();
}

/* ================= 인트로 ================= */
$('#introTo').textContent = `To. ${TO}`;
$('#introTitle').append(`${FROM} sent you`, document.createElement('br'), 'a Pepero kit');
$('#btnStart').onclick = () => {
  snd.init(); snd.pop(); buzz(15);
  // iOS 흔들기 권한 (버튼 누를 때만 물어볼 수 있음)
  try { if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().catch(() => {}); } catch (e) {}
  startMagic();
};

/* ================= 흔들기 매직 ================= */
const HINT = {
  0: 'Shake your phone!\nSomething sweet is about to pour',
  2: 'Shake it once more ✦\nlook up at the sky',
};
function startMagic() {
  reset();
  $('#s-intro').hidden = true; $('#s-magic').hidden = false;
  $('#magicTitle').textContent = `${TO}'s Pepero`;
  $('#doneBar').hidden = true;
  setHint(0);
  fit(cvMagic, G.W, G.H);
  fitDeco();
}
function setHint(stage) {
  const h = $('#shakeHint');
  h.hidden = !HINT[stage];
  if (HINT[stage]) { $('#hintText').textContent = HINT[stage]; h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); }
}

// 흔들기 감지
let lastAcc = null;
window.addEventListener('devicemotion', e => {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const cur = { x: a.x || 0, y: a.y || 0, z: a.z || 0 };
  if (lastAcc && Math.abs(cur.x - lastAcc.x) + Math.abs(cur.y - lastAcc.y) + Math.abs(cur.z - lastAcc.z) > 25) shake();
  lastAcc = cur;
});
// 흔들기가 안 되면 화면 탭
$('#s-magic').addEventListener('pointerdown', e => { if (!e.target.closest('button')) shake(); });

function shake() {
  if ($('#s-magic').hidden || !$('#letter').hidden) return;
  const now = performance.now();
  if (now < M.ready) return;
  if (M.stage === 0) startCoat(now);
  else if (M.stage === 2) startRain(now);
}

// 1차: 하늘에서 초코가 차라락 + 토핑 우수수
const SPRINKLE_C = ['#FF5A7A', '#FFD84D', '#57C7FF', '#7EE081', '#FFFFFF', '#B48CFF', '#FF9F45'];
function topping(kind, x, y) {
  const it = { k: kind, x, y, rot: rand(0, TAU) };
  if (kind === 'sprinkle') it.c = pick(SPRINKLE_C);
  if (kind === 'glitter') { it.s = rand(2.5, 5.5); it.c = pick(['#FFFFFF', '#FFE27A', '#FFB8E6', '#9FE8FF', '#E0C3FF']); }
  if (kind === 'heart') { it.s = rand(6, 10); it.c = pick(['#E8364F', '#FF7BA0', '#FFFFFF']); it.rot = rand(-.5, .5); }
  if (kind === 'star') { it.s = rand(5, 9); it.c = pick(['#FFD84D', '#FFFFFF', '#FFF1A8']); }
  return it;
}
function startCoat(now) {
  M.stage = 1; M.t0 = now; setHint(1);
  snd.pour(); buzz([40, 30, 60, 30, 80]);
  // 토핑: 하늘에서 떨어져서 초코에 박힘
  const kinds = ['sprinkle', 'sprinkle', 'sprinkle', 'glitter', 'glitter', 'heart', 'star'];
  for (let i = 0; i < 90; i++) {
    const tx = rand(G.sx, G.sx + G.sw), ty = rand(G.top + 4, G.top + COAT), at = now + 500 + rand(0, 1500);
    M.fallers.push({ it: topping(pick(kinds), tx, ty), x0: tx + rand(-60, 60), at, dur: rand(450, 750) });
  }
}

// 2차: 사진 + CN타워·다이아·돈 스티커가 하늘에서 비처럼
const FANCY = ['cn', 'diamond', 'money', 'coin', 'pepero', 'maple', 'heart'];
function startRain(now) {
  M.stage = 3; M.t0 = now; M.flash = now; setHint(3);
  snd.magic(); snd.slam(); buzz([30, 40, 30, 40, 60]);
  fullCanvas(cvRain);
  const W = innerWidth, H = innerHeight, n = Math.max(30, PHOTOS.length * 2);
  const drop = (o, k) => ({ x: rand(.04, .96) * W, r: rand(24, 44), rot: rand(-.6, .6), vr: rand(-.002, .002), sway: rand(10, 35), ph: rand(0, TAU),
    delay: k * 95 + rand(0, 150), speed: rand(.24, .5), ...o });
  // 사진
  M.rain = shuffle([...Array(n)].map((_, i) => i % PHOTOS.length)).map((i, k) => drop({ i }, k));
  // 사진 일부는 배경에 들러붙음 (빼빼로 뒤 기둥은 피함)
  const pr = cvMagic.getBoundingClientRect(), colL = pr.left + pr.width * .3, colR = pr.right - pr.width * .3;
  const sticky = d => { if ((d.x < colL || d.x > colR) && Math.random() < (d.fancy ? .7 : .35)) d.stick = rand(.08, .92) * H; return d; };
  M.rain.forEach(sticky);
  // 반짝이 스티커 (더 빨리 돌면서)
  for (let k = 0; k < 34; k++) M.rain.push(sticky(drop({ fancy: FANCY[k % FANCY.length], r: rand(18, 34), vr: rand(-.007, .007), speed: rand(.3, .6) }, k * 1.3)));
  // 화면 쪽으로 확 날아오는 것들
  for (let k = 0; k < 12; k++) {
    const a = rand(0, TAU);
    M.rain.push({ zoom: true, fancy: k % 3 ? FANCY[k % FANCY.length] : null, i: k % PHOTOS.length, cx: W / 2, cy: H * .32, dx: Math.cos(a), dy: Math.sin(a), rot: rand(-.5, .5), vr: rand(-.004, .004), delay: k * 140 });
  }
  // 빼빼로에 착 붙는 것들: 사진 6장 + 스티커 3개
  const pids = shuffle([...Array(PHOTOS.length).keys()]);
  for (let s = 0; s < 6; s++) {
    const f = (s + .5) / 6;
    M.rain.push(drop({ i: pids[s % pids.length], dur: rand(1500, 2000), delay: 600 + s * 420,
      land: { x: G.cx + (s % 2 ? 22 : -22) + rand(-6, 6), y: G.top + 135 + f * (COAT - 165), r: rand(28, 32) } }, 0));
  }
  ['diamond', 'cn', 'money'].forEach((kind, s) => {
    M.rain.push(drop({ fancy: kind, dur: rand(1500, 1900), delay: 900 + s * 700,
      land: { x: G.cx + (s % 2 ? -36 : 38), y: G.top + 160 + s * 85, r: 20 } }, 0));
  });
}

function stageToScreen(x, y) {
  const r = cvMagic.getBoundingClientRect();
  return [r.left + x / G.W * r.width, r.top + y / G.H * r.height, r.width / G.W];
}
function drawMagic(now) {
  if (!cvMagic._s) return;
  const ctx = begin(cvMagic, cvMagic._s), c = CHOCO[P.choco];
  const bob = (M.stage === 0 || M.stage === 2) ? Math.sin(now / 600) * 5 : 0;
  ctx.save();
  // 쏟아지는 순간 화면 흔들림
  if (M.stage === 1 && now - M.t0 < 500) { const k = 1 - (now - M.t0) / 500; ctx.translate(Math.sin(now / 15) * 4 * k, Math.cos(now / 19) * 2 * k); }
  ctx.translate(0, bob);
  ctx.fillStyle = c.night ? 'rgba(255,255,255,.08)' : 'rgba(107,62,38,.12)';
  ctx.beginPath(); ctx.ellipse(G.cx, G.bottom + 6, 80, 6, 0, 0, TAU); ctx.fill();

  if (M.stage === 1) {
    const t = now - M.t0, k = clamp(t / 1500, 0, 1);
    P.coat = COAT * easeOut(k);
    // 위에서 쏟아지는 초코 줄기
    if (k < .85) {
      const w = 46 * (1 - k / .85) + 6, sg = ctx.createLinearGradient(G.cx - w, 0, G.cx + w, 0);
      sg.addColorStop(0, c.dark); sg.addColorStop(.4, c.light); sg.addColorStop(1, c.base);
      ctx.save();
      if (c.glow) { ctx.shadowColor = c.glow; ctx.shadowBlur = 18 * cvMagic._s; }
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(G.cx - w * .6, -40); ctx.lineTo(G.cx + w * .6, -40);
      ctx.quadraticCurveTo(G.cx + w, G.top - 6, G.cx + w * 1.4, G.top + 8); ctx.lineTo(G.cx - w * 1.4, G.top + 8);
      ctx.quadraticCurveTo(G.cx - w, G.top - 6, G.cx - w * .6, -40); ctx.fill();
      ctx.restore();
      // 튀는 방울
      for (let i = 0; i < 2; i++) M.drops.push({ x: G.cx + rand(-30, 30), y: G.top + 4, vx: rand(-3.5, 3.5), vy: rand(-5, -1.5), s: rand(2, 4.5) });
      // 옆으로 흘러내리는 줄기
      if (Math.random() < .25) M.drips.push({ x: rand(G.sx + 4, G.sx + G.sw - 4), y: G.top + P.coat, len: 0, v: rand(1.5, 3), max: rand(20, 60) });
    }
    if (t > 2300) { M.stage = 2; M.ready = now + 500; setHint(2); snd.chime(); }
  }
  drawPepero(ctx, P, now);

  // 초코 방울
  ctx.fillStyle = c.base;
  M.drops = M.drops.filter(d => {
    d.vy += .35; d.x += d.vx; d.y += d.vy;
    if (d.y > G.top + P.coat + 30) return false;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, TAU); ctx.fill();
    return true;
  });
  // 떨어지는 토핑 → 도착하면 초코에 박힘
  M.fallers = M.fallers.filter(f => {
    const k = (now - (f.at - f.dur)) / f.dur;
    if (k < 0) return true;
    if (k >= 1) { P.items.push(f.it); if (Math.random() < .25) snd.tick(); return false; }
    const e = k * k, it = f.it;
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 4);
    drawItem(ctx, { ...it, x: f.x0 + (it.x - f.x0) * e, y: -30 + (it.y + 30) * e, rot: it.rot + (1 - k) * 4 }, 0);
    ctx.restore();
    return true;
  });
  ctx.restore();

  // 사진 비
  if (M.stage === 3) drawRain(now);
}

function drawRain(now) {
  const ctx = begin(cvRain, cvRain._s), H = innerHeight, t = now - M.t0;
  let alive = 0;
  const art = (d, r) => d.fancy ? drawFancy(ctx, d.fancy, r, now) : drawSticker(ctx, PHOTOS[d.i], r, PHOTOS[d.i].shape);
  for (const d of M.rain) {
    const tt = t - d.delay;
    if (tt < 0) { alive++; continue; }
    if (d.done) continue;
    let x, y, r = d.r, rot = d.rot + tt * d.vr;
    if (d.zoom) {
      // 화면 쪽으로 커지며 날아옴
      const k = tt / 1300;
      if (k >= 1) { d.done = true; continue; }
      x = d.cx + d.dx * k * k * innerWidth * .9; y = d.cy + d.dy * k * k * H * .8;
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); ctx.translate(x, y); ctx.rotate(rot); art(d, 6 + k * k * 120); ctx.restore();
      alive++;
      continue;
    }
    if (d.land) {
      // 마법처럼 빙글 내려와서 빼빼로에 착
      const k = clamp(tt / d.dur, 0, 1), e = easeInOut(k), [tx, ty, sc] = stageToScreen(d.land.x, d.land.y);
      x = d.x + (tx - d.x) * e + Math.sin(tt / 300 + d.ph) * d.sway * (1 - e);
      y = -60 + (ty + 60) * e;
      r = d.r + (d.land.r * sc - d.r) * e;
      rot = d.rot * (1 - e) + Math.sin(tt / 250) * .5 * (1 - e);
      if (k >= 1) {
        d.done = true;
        const it = { x: d.land.x, y: d.land.y, r: d.land.r, rot: rand(-.25, .25), t: now };
        P.items.push(d.fancy ? { k: 'fancy', kind: d.fancy, ...it } : { k: 'photo', i: d.i, ...it });
        burst(tx, ty); snd.pop(); buzz(20);
        continue;
      }
    } else {
      x = d.x + Math.sin(tt / 500 + d.ph) * d.sway;
      y = -60 + tt * d.speed;
      // 배경에 착 들러붙기
      if (d.stick != null && y >= d.stick) { d.done = true; addDeco(d, x, y, r, rot, now); continue; }
      if (y > H + 80) { d.done = true; continue; }
    }
    alive++;
    if (Math.random() < .35) M.sparks.push({ x: x + rand(-r, r) * .6, y: y - r * .6, vx: rand(-.4, .4), vy: rand(-.8, -.2), t: now });
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); art(d, r); ctx.restore();
  }
  // 반짝이 꼬리
  M.sparks = M.sparks.filter(s => {
    const k = (now - s.t) / 600;
    if (k >= 1) return false;
    s.x += s.vx; s.y += s.vy;
    ctx.save(); ctx.translate(s.x, s.y); ctx.globalAlpha = 1 - k; ctx.fillStyle = pick(['#FFF6C8', '#FFD6F5', '#C8F6FF']);
    twinklePath(ctx, 5 * (1 - k) + 1.5); ctx.fill(); ctx.restore();
    return true;
  });
  // 시작할 때 번쩍
  const fk = (now - M.flash) / 450;
  if (fk < 1) { ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - fk)})`; ctx.fillRect(0, 0, innerWidth, H); }
  if (!alive && !M.sparks.length) finish();
}
// 배경 스티커 (덕지덕지)
const cvDeco = $('#cvDeco');
function fitDeco() {
  const dpr = DPR();
  cvDeco.width = cvDeco.clientWidth * dpr; cvDeco.height = cvDeco.clientHeight * dpr; cvDeco._s = dpr;
  M.decoUntil = performance.now() + 50;
}
// 빼빼로 뒤쪽(가운데 기둥)은 피해서 자리 고르기 — 화면 좌표
function sideX(W) {
  const pr = cvMagic.getBoundingClientRect(), b = cvDeco.getBoundingClientRect();
  const l = pr.left + pr.width * .3 - b.left, rr = pr.right - pr.width * .3 - b.left;
  return Math.random() < .5 ? rand(0, Math.max(10, l)) : rand(Math.min(W - 10, rr), W);
}
function addDeco(d, x, y, r, rot, t) {
  const b = cvDeco.getBoundingClientRect();
  M.deco.push({ fancy: d.fancy, i: d.i, x: x - b.left, y: y - b.top, r, rot, t });
  M.decoUntil = Math.max(M.decoUntil, t + 400);
  if (Math.random() < .5) snd.pop();
}
function drawDeco(now) {
  if (!cvDeco._s || now > M.decoUntil) return;
  const ctx = begin(cvDeco, cvDeco._s);
  for (const d of M.deco) {
    const k = clamp((now - d.t) / 280, 0, 1);
    if (k <= 0) continue;
    const s = 1 + (1 - easeOut(k)) * .8;
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.scale(s, s);
    if (d.fancy) drawFancy(ctx, d.fancy, d.r, now); else drawSticker(ctx, PHOTOS[d.i], d.r, PHOTOS[d.i].shape);
    ctx.restore();
  }
}
function burst(x, y) {
  for (let i = 0; i < 14; i++) { const a = rand(0, TAU), v = rand(1.5, 4); M.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: performance.now() }); }
}

// 편지 딱
function finish() {
  M.stage = 4;
  begin(cvRain, cvRain._s);
  confetti(); snd.chime(); buzz([20, 40, 20]);
  // 남은 자리까지 스티커로 덕지덕지
  const now = performance.now(), W = cvDeco.clientWidth, H = cvDeco.clientHeight;
  for (let k = 0; k < 22; k++) {
    const d = k % 3 ? { fancy: FANCY[k % FANCY.length] } : { i: k % PHOTOS.length };
    M.deco.push({ ...d, x: sideX(W), y: rand(.08, .95) * H, r: d.fancy ? rand(18, 32) : rand(24, 36), rot: rand(-.6, .6), t: now + k * 70 });
    setTimeout(() => snd.pop(), k * 70);
  }
  M.decoUntil = now + 22 * 70 + 400;
  blobs.pepero = makeBlob();
  setTimeout(() => { openLetter(); $('#doneBar').hidden = false; }, 2000);
}
$('#btnAgain').onclick = () => { snd.tok(); startMagic(); };

/* ================= 편지 ================= */
$('.lt-to').textContent = `To. ${CFG.letterTo || TO}`;
$('.lt-msg').textContent = CFG.message || 'Happy Pepero Day!';
$('.lt-from').textContent = `From. ${CFG.letterFrom || FROM}`;
function openLetter() { $('#letter').hidden = false; snd.chime(); }
$('#btnLetter').onclick = openLetter;
$('#cardClose').onclick = () => { $('#letter').hidden = true; snd.tok(); };

/* ================= 이미지 저장·공유 ================= */
async function exportCanvas() {
  await fontsReady;
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const night = CHOCO[P.choco].night, x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 1350);
  g.addColorStop(0, night ? '#1E0F3D' : '#FFE4EC'); g.addColorStop(1, night ? '#0A0618' : '#FFF6EC');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  // 토론토 밤 배경 (가로 꽉 차게) + 살짝 어둡게
  if (BG_IMG.naturalWidth) {
    const s = Math.max(1080 / BG_IMG.naturalWidth, 1350 / BG_IMG.naturalHeight), w = BG_IMG.naturalWidth * s, h = BG_IMG.naturalHeight * s;
    x.drawImage(BG_IMG, (1080 - w) / 2, (1350 - h) * .4, w, h);
    const sh = x.createLinearGradient(0, 0, 0, 1350);
    sh.addColorStop(0, 'rgba(12,4,28,.35)'); sh.addColorStop(.5, 'rgba(12,4,28,.2)'); sh.addColorStop(1, 'rgba(12,4,28,.8)');
    x.fillStyle = sh; x.fillRect(0, 0, 1080, 1350);
  }
  const r = rng(7);
  for (let i = 0; i < 40; i++) {
    x.save(); x.translate(r() * 1080, r() * 1350); x.rotate(r() * TAU); x.globalAlpha = night ? .5 : .28;
    x.fillStyle = (night ? ['#FF5BE0', '#7DF9FF', '#FFE27A'] : ['#FF8FB1', '#FFFFFF', '#F7C873'])[Math.floor(r() * 3)];
    if (night) starPath(x, 4 + r() * 8); else heartPath(x, 8 + r() * 14);
    x.fill(); x.restore();
  }
  // 양옆에 사진·돈·다이아·CN타워 스티커 덕지덕지
  for (let k = 0; k < 34; k++) {
    const sx = k % 2 ? 30 + r() * 330 : 720 + r() * 330, sy = 200 + r() * 990;
    x.save(); x.translate(sx, sy); x.rotate((r() - .5) * 1.1);
    if (k % 3) drawFancy(x, FANCY[k % FANCY.length], 34 + r() * 26);
    else { const ph = PHOTOS[k % PHOTOS.length]; drawSticker(x, ph, 50 + r() * 22, ph.shape); }
    x.restore();
  }
  x.textAlign = 'center'; x.fillStyle = night ? '#FFF0FB' : '#5A2E1C';
  if (night) { x.shadowColor = CHOCO[P.choco].glow; x.shadowBlur = 30; }
  x.font = BIG(96); x.fillText(`${TO.toUpperCase()}'S PEPERO`, 540, 140, 980);
  x.shadowBlur = 0;
  const s = 1.95;
  x.save(); x.translate(540 - G.W * s / 2, 165); x.scale(s, s); drawPepero(x, P); x.restore();
  x.font = font(38); x.fillStyle = night ? '#C9B6E8' : '#9A7464'; x.fillText(`From. ${FROM}  ·  ${TODAY}`, 540, 1300);
  return c;
}
const toBlob = c => new Promise((res, rej) => {
  try { c.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/png'); } catch (e) { rej(e); }
});
// 공유 버튼 누른 직후 바로 share()를 부를 수 있게 미리 만들어 둠
function makeBlob() { const p = exportCanvas().then(toBlob); p.catch(() => {}); return p; }
function getBlob() { if (!blobs.pepero) blobs.pepero = makeBlob(); return blobs.pepero; }

const FAIL_MSG = 'Could not create the image. Please open this page from a web address.';
function showImg(url, hint) { $('#imgViewImg').src = url; $('#imgViewHint').textContent = hint; $('#imgView').hidden = false; }
$('#btnSave').onclick = async () => {
  snd.tok();
  let blob;
  try { blob = await getBlob(); } catch (e) { blobs.pepero = null; toast(FAIL_MSG); return; }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `${TO}_pepero.png`;
  document.body.append(a); a.click(); a.remove();
  showImg(url, 'If it did not save, press and hold the image to save it');
};
// 공유: 폰 공유창(카톡·인스타·메시지 등)에 완성 이미지를 바로 넘김
// 공유창이 없으면(카톡 인앱 브라우저, PC) 이미지를 띄워서 길게 눌러 저장 → 직접 보내도록 안내
$('#btnShare').onclick = async () => {
  snd.tok();
  let blob;
  try { blob = await getBlob(); } catch (e) { blobs.pepero = null; toast(FAIL_MSG); return; }
  const file = new File([blob], 'pepero.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `${TO}'s Pepero 🍫` }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  showImg(URL.createObjectURL(blob), 'Sharing is not available here.\nPress and hold the image to save it, then send it.');
};
async function copyLink() {
  try { await navigator.clipboard.writeText(location.href); toast('Link copied'); }
  catch (e) { toast('Could not copy. Please copy the link from the address bar'); }
}
$('#imgViewCopy').onclick = copyLink;
$('#imgViewClose').onclick = () => { $('#imgView').hidden = true; };

// 카톡·인스타 인앱 브라우저 안내
const UA = navigator.userAgent;
if (/KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(UA)) $('#inapp').hidden = false;
$('#btnExternal').onclick = () => {
  if (/KAKAOTALK/i.test(UA)) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
  else { copyLink(); toast('Link copied. Paste it into Safari or Chrome'); }
};

/* ================= 토스트·컨페티 ================= */
let toastTimer = 0;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

const cfCv = $('#confetti'), CF = [];
function confetti(n = 160) {
  fullCanvas(cfCv);
  const W = innerWidth, H = innerHeight, cols = ['#FF5A7A', '#FFD84D', '#57C7FF', '#7EE081', '#FF8FB1', '#B48CFF', '#FFFFFF'];
  for (let i = 0; i < n; i++) {
    CF.push({ x: W / 2 + rand(-40, 40), y: H * .55, vx: rand(-9, 9), vy: rand(-19, -8), r: rand(0, TAU), vr: rand(-.3, .3), s: rand(6, 11), c: pick(cols), h: Math.random() < .3 });
  }
}
function drawConfetti() {
  const ctx = begin(cfCv, cfCv._s), H = innerHeight;
  for (let i = CF.length - 1; i >= 0; i--) {
    const p = CF[i];
    p.vy += .42; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
    if (p.y > H + 30) { CF.splice(i, 1); continue; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
    if (p.h) { heartPath(ctx, p.s * .6); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.r * 2)) + 1);
    ctx.restore();
  }
  if (!CF.length) begin(cfCv, 1);
}

/* ================= 소리 버튼 ================= */
function updMute() { $('#mute').classList.toggle('off', snd.muted); }
$('#mute').onclick = () => { snd.muted = !snd.muted; store.set('pepero-muted', snd.muted); snd.init(); snd.tok(); if (snd.bgm) snd.music(); updMute(); };
updMute();

/* ================= 렌더 루프 ================= */
reset();
window.addEventListener('resize', () => {
  if (!$('#s-magic').hidden) fit(cvMagic, G.W, G.H);
  if (M.stage === 3) fullCanvas(cvRain);
  if (DR.on) fullCanvas(cvDrive);
  if (!$('#s-magic').hidden) fitDeco();
});
function loop(now) {
  requestAnimationFrame(loop);
  if (DR.on) drawDrive(now);
  if (!$('#s-magic').hidden) { drawDeco(now); drawMagic(now); }
  if (CF.length) drawConfetti();
}
requestAnimationFrame(loop);
})();
