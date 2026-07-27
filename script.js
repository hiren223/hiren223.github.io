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

  function getVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
  }
  resize();
  window.addEventListener('resize', resize);

  const NODE_COUNT = Math.round((window.innerWidth * window.innerHeight) / 55000);
  const nodes = Array.from({ length: Math.max(30, Math.min(NODE_COUNT, 50)) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    r: Math.random() * 1.6 + 1
  }));
  const LINK_DIST = 150;

  const TOKENS = [
    '{ }', '</>', 'def', 'import pandas as pd', 'SELECT * FROM data',
    'R\u00B2', 'ROC-AUC', '[ ]', '\u03BB', 'while True:', 'GET /api/v1',
    'model.fit(X, y)', 'accuracy: 0.92', 'df.head()', '=> null',
    'CREATE TABLE', 'try / except', '0.761', 'np.array([...])'
  ];
  const colorVars = ['--fn', '--str', '--kw', '--num'];

  const tokens = Array.from({ length: 16 }, () => spawnToken());

  function spawnToken(recycle) {
    return {
      text: TOKENS[Math.floor(Math.random() * TOKENS.length)],
      x: Math.random() * w,
      y: recycle ? h + 20 : Math.random() * h,
      speed: Math.random() * 0.12 + 0.05,
      size: Math.random() * 5 + 11,
      color: colorVars[Math.floor(Math.random() * colorVars.length)],
      opacity: Math.random() * 0.5 + 0.05,
      drift: (Math.random() - 0.5) * 0.06
    };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const lineColor = getVar('--border') || '#232b38';
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < LINK_DIST) {
          ctx.strokeStyle = lineColor;
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    const nodeColor = getVar('--fn') || '#82aaff';
    ctx.globalAlpha = 0.55;
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
      ctx.fillStyle = getVar(t.color) || '#82aaff';
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

  requestAnimationFrame(draw);
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
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: Form.name.value,
          email: Form.email.value,
          message: Form.message.value
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
  const loader = document.getElementById('site-loader');
  if (!loader) return;

  const bar = document.getElementById('loader-bar');
  const percentText = document.getElementById('loader-percent');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 14 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
    }
    bar.style.width = progress + '%';
    percentText.textContent = Math.floor(progress) + '%';
  }, 120);

  const minTime = new Promise(resolve => setTimeout(resolve, 1000));
  const pageLoaded = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  });

  Promise.all([minTime, pageLoaded]).then(() => {
    bar.style.width = '100%';
    percentText.textContent = '100%';
    setTimeout(() => {
      loader.classList.add('loader-hidden');
      setTimeout(() => loader.remove(), 500);
    }, 200);
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