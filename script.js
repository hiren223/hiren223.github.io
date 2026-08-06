// ============================================================
// SCROLL REVEAL
// ============================================================
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  items.forEach(el => {
    const delay = el.getAttribute('data-delay') || 0;
    el.style.setProperty('--reveal-delay', delay);
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();




// ============================================================
// ANIMATED BACKGROUND
// ============================================================
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  // 1. Cache colors so we don't call getComputedStyle 60 times a second
  let cachedColors = {
    '--border': '#232b38',
    '--fn': '#10B981', 
    '--str': '#38BDF8', 
    '--kw': '#a0aabf',
    '--num': '#ffffff'
  };

  function updateColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    Object.keys(cachedColors).forEach(key => {
      const val = rootStyles.getPropertyValue(key).trim();
      if (val) cachedColors[key] = val;
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateColors(); 
  }
  
  resize();
  window.addEventListener('resize', resize);

  const NODE_COUNT = Math.round((w * h) / 35000); 
  const nodes = Array.from({ length: Math.max(50, Math.min(NODE_COUNT, 100)) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 1.5 // Slightly larger nodes
  }));
  const LINK_DIST = 150;

  const TOKENS = [
    '{ }', '</>', 'def', 'import pandas as pd', 'SELECT * FROM data',
    'R\u00B2', 'ROC-AUC', '[ ]', '\u03BB', 'while True:', 'GET /api/v1',
    'model.fit(X, y)', 'accuracy: 0.92', 'df.head()', '=> null',
    'CREATE TABLE', 'try / except', '0.761', 'np.array([...])'
  ];
  const colorVars = ['--fn', '--str', '--kw', '--num'];

  function spawnToken(recycle) {
    return {
      text: TOKENS[Math.floor(Math.random() * TOKENS.length)],
      x: Math.random() * w,
      y: recycle ? h + 20 : Math.random() * h,
      speed: Math.random() * 0.3 + 0.1, 
      size: Math.random() * 6 + 12, 
      color: colorVars[Math.floor(Math.random() * colorVars.length)],
      opacity: Math.random() * 0.4 + 0.1,
      drift: (Math.random() - 0.5) * 0.1
    };
  }

  const tokens = Array.from({ length: 16 }, () => spawnToken());

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const lineColor = cachedColors['--fn'];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < LINK_DIST) {
          ctx.strokeStyle = lineColor;
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.5; // Brighter connections
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    const nodeColor = cachedColors['--fn'];
    ctx.globalAlpha = 0.8; // Brighter nodes
    ctx.fillStyle = nodeColor;

    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    ctx.textBaseline = 'middle';
    tokens.forEach((t, idx) => {
      ctx.globalAlpha = t.opacity;
      ctx.fillStyle = cachedColors[t.color] || '#82aaff';
      ctx.font = `${t.size}px 'JetBrains Mono', monospace`;
      ctx.fillText(t.text, t.x, t.y);
      t.y -= t.speed;
      t.x += t.drift;
      if (t.y < -20) {
        tokens[idx] = spawnToken(true);
      }
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  // 2. Wait 50ms to ensure CSS is parsed before painting
  setTimeout(() => {
      updateColors();
      requestAnimationFrame(draw);
  }, 50);

})();


// ============================================================
// LIVE CLOCK (topbar)
// ============================================================
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;

  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 1000 * 30);


// ============================================================
// TYPED OUTPUT EFFECT (hero code block)
// ============================================================
const typedText = "Hiren Keraliya | let's build something with your data.";
const outputEl = document.getElementById('typed-output');
let idx = 0;

function typeChar() {
  if (!outputEl) return;

  if (idx <= typedText.length) {
    outputEl.textContent = typedText.slice(0, idx);
    idx++;
    setTimeout(typeChar, 45);
  }
}
setTimeout(typeChar, 600);


// ============================================================
// MOBILE NAV BURGER TOGGLE
// ============================================================
const navBurger = document.getElementById('nav-burger');
const navTabs = document.getElementById('nav-tabs');

if (navBurger && navTabs) {
  function openMenu() {
    navTabs.classList.add('open');
    navBurger.classList.add('open');
    navBurger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  }

  function closeMenu() {
    navTabs.classList.remove('open');
    navBurger.classList.remove('open');
    navBurger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  navBurger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navTabs.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navTabs.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (
      navTabs.classList.contains('open') &&
      !navTabs.contains(e.target) &&
      !navBurger.contains(e.target)
    ) {
      closeMenu();
    }
  });
}



// ================= SKILL CHIP TAP-TO-SHOW (mobile) =================
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.setAttribute("tabindex", "0"); // enables :focus-within on tap
    chip.addEventListener("click", (e) => {
      const alreadyOpen = chip.classList.contains("tip-open");
      document.querySelectorAll(".chip.tip-open").forEach((c) => c.classList.remove("tip-open"));
      if (!alreadyOpen) chip.classList.add("tip-open");
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".chip")) {
      document.querySelectorAll(".chip.tip-open").forEach((c) => c.classList.remove("tip-open"));
    }
  });


// ============================================================
// ACTIVE SECTION HIGHLIGHT
// ============================================================
const sections = document.querySelectorAll('section[id]');
const tabs = document.querySelectorAll('.tab');

function onScroll() {
  let current = sections[0]?.id;

  sections.forEach((sec) => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= 120) {
      current = sec.id;
    }
  });

  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


// ============================================================
// CONTACT FORM SUBMISSION (Vercel serverless function)
// ============================================================
const Form = document.getElementById('contact-form');
const fNote = document.getElementById('form-note');

if (Form) {
  Form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = Form.querySelector('.form-submit');
    submitBtn.disabled = true;
    showNote('sending...', 'info');

    try {
      const formData = new FormData(Form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
    access_key: "069cb0b8-1614-49a5-9f97-edc09efd038c", // Make sure your access key is explicitly passed here if not in HTML
    name: Form.name.value,
    email: Form.email.value,
    message: Form.message.value,
    subject: "New Portfolio Contact Message"
  })
      });
      const data = await res.json();

     if (data.success) {
        showNote("message sent — I'll get back to you soon!", 'success');
        showToast('Message sent successfully!', 'success');
        Form.reset();
      } else {
        const errText = data.error || 'something went wrong';
        showNote(errText, 'error');
        showToast(errText, 'error');
      }
    } catch (err) {
      showNote('network error — please try again', 'error');
      showToast('network error — please try again', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function showNote(text, type) {
  fNote.textContent = '>>> ' + text;
  fNote.classList.remove('note-success', 'note-error', 'note-visible');
  void fNote.offsetWidth;
  if (type === 'success') fNote.classList.add('note-success');
  if (type === 'error') fNote.classList.add('note-error');
  fNote.classList.add('note-visible');
}

 (function () {
    const tabBtns = document.querySelectorAll(".exp-tab-btn");
    const panels = document.querySelectorAll(".exp-panel");

    function animateSkillBars() {
      document.querySelectorAll(".skill-bar-fill").forEach((bar) => {
        const pct = bar.dataset.pct || "0";
        bar.style.setProperty("--fill-pct", pct + "%");
        bar.classList.remove("filled");
        void bar.offsetWidth; // reflow to restart transition
        bar.classList.add("filled");
      });
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        if (btn.classList.contains("active")) return;

        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        panels.forEach((panel) => {
          if (panel.dataset.panel === target) {
            panel.style.display = "flex";
            panel.classList.remove("exp-panel-anim");
            void panel.offsetWidth;
            panel.classList.add("exp-panel-anim");

            if (target === "skills") {
              setTimeout(animateSkillBars, 150);
            }
          } else {
            panel.style.display = "none";
          }
        });
      });
    });
  })();
  // ============ END EXPERIENCE / SKILLS TAB SWITCHER ============


// ============================================================
// SITE LOADER
// ============================================================
(function initLoader() {
  "use strict";

  const loaderEl = document.getElementById('site-loader');
  if (!loaderEl) return;

  document.documentElement.classList.add('is-loading'); // lock scroll immediately

  /* ---------------- palette / constants ---------------- */
  const COLORS = { emerald: '#10B981', cyan: '#38BDF8', purple: '#C792EA', blue: '#82AAFF' };
  const PALETTE = [COLORS.cyan, COLORS.emerald, COLORS.blue, COLORS.purple];

  const MIN_TIME = 1200;     // ms — loader never disappears faster than this
  const MAX_TIME = 8000;     // ms — hard cap for real-progress timeline
  const HANG_LIMIT = 10500;  // ms — absolute safety net, forces completion no matter what
  const ZOOM_MS = 800;       // ms — final zoom-into-brain duration

  const isSmall = window.innerWidth < 700;
  const NODE_COUNT = isSmall ? 70 : 110;
  const K_NEAREST = 3;

  function hexToRgba(hex, alpha) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------------- canvas setup ---------------- */
  const canvas = document.getElementById('loaderCanvas');
  const ctx = canvas.getContext('2d');
  const flashOverlay = document.getElementById('flashOverlay');
  const typedTextEl = document.getElementById('typedText');
  const progressFill = document.getElementById('progressFill');
  const pctNum = document.getElementById('pctNum');
  const stageLabel = document.getElementById('stageLabel');

  let W, H, CX, CY, DPR, brainR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    CX = W / 2; CY = H * 0.44;
    brainR = Math.min(W, H) * 0.155;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();

  /* ---------------- real asset-load progress ---------------- */
  const images = Array.from(document.images || []);
  let totalTasks = images.length;
  let doneTasks = 0;
  function taskDone() { doneTasks = Math.min(doneTasks + 1, totalTasks); }
  images.forEach((img) => {
    if (img.complete) taskDone();
    else {
      img.addEventListener('load', taskDone, { once: true });
      img.addEventListener('error', taskDone, { once: true });
    }
  });
  let fontsDone = false;
  if (document.fonts && document.fonts.ready) {
    totalTasks += 1;
    document.fonts.ready.then(() => { fontsDone = true; taskDone(); });
  } else { fontsDone = true; }
  if (totalTasks === 0) totalTasks = 1;

  const startTime = performance.now();
  let pageReady = false;
  let displayed = 0;

  const minTimeP = new Promise((r) => setTimeout(r, MIN_TIME));
  const pageLoadedP = new Promise((r) => {
    if (document.readyState === 'complete') r();
    else window.addEventListener('load', r);
  });
  Promise.all([minTimeP, pageLoadedP]).then(() => { pageReady = true; });

  function realProgress() { return Math.min(doneTasks / totalTasks, 1); }


  /* ---------------- anatomical brain node cloud (3D unit space) ---------------- */
  function generateBrainPoints(count) {
    const pts = [];
    const hemiOffset = 0.30;
    const cerebrumCount = Math.floor(count * 0.85);
    let made = 0, attempts = 0;

    while (made < cerebrumCount && attempts < cerebrumCount * 50) {
      attempts++;
      const side = Math.random() < 0.5 ? -1 : 1;
      const theta = Math.acos(1 - 2 * Math.random());
      const phi = Math.random() * Math.PI * 2;
      let x = Math.sin(theta) * Math.cos(phi);
      let y = Math.cos(theta);
      let z = Math.sin(theta) * Math.sin(phi);

      const rx = 0.40, ry = 0.46, rz = 0.60;
      const frontBack = z > 0 ? 1 + 0.14 * z : 1 + 0.22 * z;
      const gyri = 1 + 0.055 * Math.sin(phi * 7 + theta * 9) + 0.03 * Math.sin(phi * 13 - theta * 6 + 1.4);
      const shell = 0.86 + Math.random() * 0.14;

      const px = side * hemiOffset + x * rx * frontBack * gyri * shell;
      const py = y * ry * gyri * shell;
      const pz = z * rz * frontBack * gyri * shell;
      if (Math.abs(px) < 0.045) continue;

      let ok = true;
      const minD = 0.09;
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - px, dy = pts[i].y - py, dz = pts[i].z - pz;
        if (dx * dx + dy * dy + dz * dz < minD * minD) { ok = false; break; }
      }
      if (!ok) continue;
      pts.push({ x: px, y: py, z: pz, side: side < 0 ? 'left' : 'right' });
      made++;
    }

    const stemCount = Math.max(6, count - pts.length);
    for (let i = 0; i < stemCount; i++) {
      pts.push({
        x: (Math.random() - 0.5) * 0.1,
        y: -0.5 - Math.random() * 0.25,
        z: (Math.random() - 0.5) * 0.1,
        side: i % 2 === 0 ? 'left' : 'right'
      });
    }
    return pts;
  }

  function buildEdges(nodes, k) {
    const edges = [], seen = new Set();
    for (let i = 0; i < nodes.length; i++) {
      const dists = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dz = nodes[i].z - nodes[j].z;
        dists.push({ j, d: dx * dx + dy * dy + dz * dz });
      }
      dists.sort((a, b) => a.d - b.d);
      for (let n = 0; n < Math.min(k, dists.length); n++) {
        const j = dists[n].j;
        const key = i < j ? i + '_' + j : j + '_' + i;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ a: i, b: j, color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
      }
    }
    return edges;
  }

  const rawPoints = generateBrainPoints(NODE_COUNT);
  const brainNodes = rawPoints.map((p) => ({
    x: p.x, y: p.y, z: p.z, side: p.side,
    baseR: 1.6 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    activated: false,
    _sx: 0, _sy: 0, _scale: 1, _z: 0
  }));
  const edges = buildEdges(brainNodes, K_NEAREST);

  let angleY = 0;
  const CAMERA_Z = 3;
  function projectBrain(now) {
    if (!zooming) angleY += 0.006;
    const angleX = Math.sin(now * 0.00035) * 0.14;
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);

    for (const n of brainNodes) {
      const x1 = n.x * cosY + n.z * sinY;
      const z1 = -n.x * sinY + n.z * cosY;
      const y2 = n.y * cosX - z1 * sinX;
      const z2 = n.y * sinX + z1 * cosX;
      const scale = CAMERA_Z / (CAMERA_Z - z2);
      n._sx = CX + x1 * scale * brainR;
      n._sy = CY + y2 * scale * brainR;
      n._scale = scale;
      n._z = z2;
    }
  }

  /* ---------------- incoming traveling neurons ---------------- */
  const travelers = [];
  let spawnedCount = 0;

  function spawnNeuron(nodeIndex) {
    const node = brainNodes[nodeIndex];
    const fromLeft = node.side === 'left';
    const sx0 = fromLeft ? -30 : W + 30;
    const sy0 = CY + (Math.random() - 0.5) * H * 0.8;
    travelers.push({
      nodeIndex,
      sx0, sy0,
      lastX: sx0, lastY: sy0,
      dur: 650 + Math.random() * 550,
      spawnTime: performance.now() + Math.random() * 260,
      ctrlOffset: (fromLeft ? 1 : -1) * (60 + Math.random() * 90),
      color: node.color
    });
  }

  const sparks = []; // tiny arrival flashes

  function updateAndDrawTravelers(now, brightness) {
    for (let i = travelers.length - 1; i >= 0; i--) {
      const p = travelers[i];
      if (now < p.spawnTime) continue;

      const node = brainNodes[p.nodeIndex];
      const tx = node._sx, ty = node._sy;
      const t = Math.min((now - p.spawnTime) / p.dur, 1);
      const ease = easeInOutQuad(t);

      const dx = tx - p.sx0, dy = ty - p.sy0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const midX = (p.sx0 + tx) / 2 + nx * p.ctrlOffset;
      const midY = (p.sy0 + ty) / 2 + ny * p.ctrlOffset;

      const omt = 1 - ease;
      const px = omt * omt * p.sx0 + 2 * omt * ease * midX + ease * ease * tx;
      const py = omt * omt * p.sy0 + 2 * omt * ease * midY + ease * ease * ty;

      // trailing streak
      ctx.strokeStyle = hexToRgba(p.color, 0.55 * brightness);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.lastX, p.lastY);
      ctx.lineTo(px, py);
      ctx.stroke();
      p.lastX = px; p.lastY = py;

      // head glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 7);
      glow.addColorStop(0, hexToRgba('#FFFFFF', 0.9 * brightness));
      glow.addColorStop(0.4, hexToRgba(p.color, 0.6 * brightness));
      glow.addColorStop(1, hexToRgba(p.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (t >= 1) {
        node.activated = true;
        for (let s = 0; s < 6; s++) {
          const a = Math.random() * Math.PI * 2;
          sparks.push({ x: tx, y: ty, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, life: 1, color: p.color });
        }
        travelers.splice(i, 1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.life -= 0.05;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = hexToRgba(s.color, s.life * brightness);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------------- draw the assembled (activated) brain ---------------- */
  function drawEdges(now, brightness) {
    for (const e of edges) {
      const A = brainNodes[e.a], B = brainNodes[e.b];
      if (!A.activated || !B.activated) continue;
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.0016 + e.a));
      ctx.strokeStyle = hexToRgba(e.color, 0.14 * brightness * pulse);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(A._sx, A._sy);
      ctx.lineTo(B._sx, B._sy);
      ctx.stroke();
    }
  }

  function drawNodes(now, brightness) {
    const activeOrdered = brainNodes.filter((n) => n.activated).sort((a, b) => a._z - b._z);
    for (const n of activeOrdered) {
      const breathe = 1 + Math.sin(now * 0.0015 * n.speed + n.phase) * 0.22;
      const depthBright = 0.45 + ((n._z + 1) / 2) * 0.75;
      const r = Math.max(0.6, n.baseR * n._scale * breathe);
      const glowR = r * 5 * brightness * depthBright;

      const glow = ctx.createRadialGradient(n._sx, n._sy, 0, n._sx, n._sy, glowR);
      glow.addColorStop(0, hexToRgba(n.color, 0.55 * brightness * depthBright));
      glow.addColorStop(1, hexToRgba(n.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(n._sx, n._sy, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hexToRgba('#FFFFFF', 0.85 * brightness * depthBright);
      ctx.beginPath();
      ctx.arc(n._sx, n._sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------------- typing status ---------------- */
  const FULL_TEXT = 'Training Intelligence...';
  let typedIdx = 0;
  (function typeStep() {
    if (typedIdx <= FULL_TEXT.length) {
      typedTextEl.textContent = FULL_TEXT.slice(0, typedIdx);
      typedIdx++;
      setTimeout(typeStep, 55 + Math.random() * 40);
    }
  })();

  const STAGES = [
    { at: 0, label: 'initializing' },
    { at: 0.2, label: 'spawning neurons' },
    { at: 0.5, label: 'connecting synapses' },
    { at: 0.8, label: 'integrating cortex' },
    { at: 0.96, label: 'finalizing' },
    { at: 1, label: 'ready' }
  ];
  function currentStage(p) {
    let s = STAGES[0].label;
    for (const st of STAGES) if (p >= st.at) s = st.label;
    return s;
  }

  /* ---------------- completion / zoom sequence ---------------- */
  let completed = false;
  let zooming = false;
  let zoomStart = null;
  let flashFired = false;

  function triggerZoom() {
    zooming = true;
    zoomStart = performance.now();
  }

  function drawZoom(now) {
    const t = Math.min((now - zoomStart) / ZOOM_MS, 1);
    const te = t * t; // accelerating, "flying toward" feel
    const scale = 1 + te * 70;
    const fade = Math.max(0, 1 - Math.pow(t, 1.4));

    drawEdges(now, fade);
    for (const n of brainNodes) {
      if (!n.activated) continue;
      const sx = CX + (n._sx - CX) * scale;
      const sy = CY + (n._sy - CY) * scale;
      const r = Math.max(0.5, n.baseR * (1 + te * 4));
      const glowR = r * 5 * fade;

      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      glow.addColorStop(0, hexToRgba(n.color, 0.6 * fade));
      glow.addColorStop(1, hexToRgba(n.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = hexToRgba('#FFFFFF', 0.9 * fade);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }

    if (t >= 0.12 && !flashFired) {
      flashFired = true;
      flashOverlay.classList.add('burst');
    }

    if (t >= 1) {
      finish();
      return;
    }
    requestAnimationFrame(draw);
  }

  function finish() {
    loaderEl.classList.add('loader-hidden');
    document.documentElement.classList.remove('is-loading'); // unlock scroll
    setTimeout(() => loaderEl.remove(), 600);
  }

  /* ---------------- main loop ---------------- */
  function draw(now) {
    ctx.clearRect(0, 0, W, H);

    const elapsed = now - startTime;

    if (elapsed > HANG_LIMIT && !completed) {
      // absolute safety net — force everything to finish immediately
      brainNodes.forEach((n) => (n.activated = true));
      travelers.length = 0;
      completed = true;
      triggerZoom();
    }

   if (zooming) {
  drawZoom(now);
  return;
}

    const timerP = Math.min(elapsed / MAX_TIME, 1);
    const cap = pageReady ? 1 : 0.92;
    const target = Math.min(easeOutCubic(timerP) + (pageReady ? 0.4 : 0), cap);
    displayed += (target - displayed) * 0.05;
    if (pageReady && displayed > 0.985) displayed = 1;

    const brightness = 0.4 + displayed * 0.6;
    const pct = Math.round(displayed * 100);
    progressFill.style.width = pct + '%';
    pctNum.textContent = pct;
    stageLabel.textContent = currentStage(displayed);

    projectBrain(now);

    const spawnTarget = Math.floor(displayed * NODE_COUNT);
    while (spawnedCount < spawnTarget) {
      spawnNeuron(spawnedCount);
      spawnedCount++;
    }

    drawEdges(now, brightness);
    drawNodes(now, brightness);
    updateAndDrawTravelers(now, brightness);

    const allSpawned = spawnedCount >= NODE_COUNT;
    const allArrived = travelers.length === 0 && allSpawned;
    const minTimeElapsed = elapsed >= MIN_TIME;

    if (!completed && allArrived && pageReady && displayed >= 0.999 && minTimeElapsed) {
      completed = true;
      triggerZoom();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  let resizeTimer = null;
window.addEventListener('resize', () => {
  if (completed) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resize();
  }, 150);
});
})();



// ============================================================
// CERTIFICATE VIEWER MODAL (custom PDF.js renderer)
// ============================================================
(function initCertificateModal() {
  const modal = document.getElementById('certificateModal');
  const canvas = document.getElementById('certificateCanvas');
  const loadingEl = document.getElementById('certLoading');
  const zoomLabel = document.getElementById('certZoomLabel');
  const pageLabel = document.getElementById('certPageLabel');
  const zoomInBtn = document.getElementById('certZoomIn');
  const zoomOutBtn = document.getElementById('certZoomOut');
  const prevBtn = document.getElementById('certPrev');
  const nextBtn = document.getElementById('certNext');
  const downloadLink = document.getElementById('certDownload');

  if (!modal || !canvas || typeof pdfjsLib === 'undefined') return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const ctx = canvas.getContext('2d');
  let pdfDoc = null;
  let currentPage = 1;
  let zoom = 1.2;
  let lastFocused = null;

  function showLoading(show) {
    loadingEl.classList.toggle('hidden', !show);
    canvas.style.visibility = show ? 'hidden' : 'visible';
  }

  function renderPage(num) {
    showLoading(true);
    pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: zoom });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = { canvasContext: ctx, viewport: viewport };
      page.render(renderContext).promise.then(() => {
        showLoading(false);
        pageLabel.textContent = `${num} / ${pdfDoc.numPages}`;
        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      });
    });
  }

  window.openCertificate = function (pdfPath) {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    downloadLink.href = pdfPath;
    zoom = 1.2;
    currentPage = 1;
    showLoading(true);

    pdfjsLib.getDocument(pdfPath).promise.then((doc) => {
      pdfDoc = doc;
      renderPage(currentPage);
    }).catch(() => {
      loadingEl.innerHTML = '<i class="ri-error-warning-line"></i> Unable to load certificate.';
    });
  };

  window.closeCertificate = function () {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();

    setTimeout(() => {
      pdfDoc = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      loadingEl.innerHTML = '<i class="ri-loader-4-line"></i> Loading certificate...';
    }, 350);
  };

  zoomInBtn.addEventListener('click', () => {
    if (!pdfDoc) return;
    zoom = Math.min(zoom + 0.2, 3);
    renderPage(currentPage);
  });

  zoomOutBtn.addEventListener('click', () => {
    if (!pdfDoc) return;
    zoom = Math.max(zoom - 0.2, 0.5);
    renderPage(currentPage);
  });

  prevBtn.addEventListener('click', () => {
    if (!pdfDoc || currentPage <= 1) return;
    currentPage--;
    renderPage(currentPage);
  });

  nextBtn.addEventListener('click', () => {
    if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
    currentPage++;
    renderPage(currentPage);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCertificate();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeCertificate();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'ArrowLeft') prevBtn.click();
  });
})();

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(text, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="toast-icon ${type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}"></i>
    <span class="toast-text">${text}</span>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  function dismiss() {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  const timer = setTimeout(dismiss, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
}