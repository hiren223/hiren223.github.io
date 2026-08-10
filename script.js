// ================= DOOR LOCK LOGIC =================
(function () {
  const CORRECT_PASSCODE = "3141";
  let enteredCode = "";
  let isUnlocked = false;

  const doorSystem = document.getElementById("doorSystem");
  const doorLoader = document.getElementById("doorLoader");
  const keypadDisplay = document.getElementById("keypadDisplay");
  
  if (!doorLoader || !keypadDisplay) return;

  const keys = doorLoader.querySelectorAll(".key-num");

  keys.forEach((key) => {
    key.addEventListener("click", () => {
      if (isUnlocked) return;
      const val = key.textContent.trim();

      if (val === "C") {
        enteredCode = "";
        updateDisplay();
      } else if (val === "✓") {
        verifyPasscode();
      } else if (enteredCode.length < 4) {
        enteredCode += val;
        updateDisplay();
        if (enteredCode.length === 4) verifyPasscode();
      }
    });
  });

  function updateDisplay() {
    keypadDisplay.textContent = enteredCode ? enteredCode.padEnd(4, "_") : "____";
  }

  function verifyPasscode() {
    if (enteredCode === CORRECT_PASSCODE) {
      isUnlocked = true;
      keypadDisplay.textContent = "OPEN";
      keypadDisplay.classList.add("success");

      setTimeout(beginOpening, 300);
    } else {
      keypadDisplay.classList.add("error");
      setTimeout(() => {
        enteredCode = "";
        keypadDisplay.classList.remove("error");
        updateDisplay();
      }, 600);
    }
  }

  function beginOpening() {
    doorLoader.classList.add("opening");

    setTimeout(() => {
      if (doorSystem) doorSystem.classList.add("unlocked");
      document.body.classList.add("door-unlocked");
    }, 600);

    setTimeout(() => {
      doorLoader.classList.add("hidden");
      setTimeout(() => doorLoader.remove(), 1000);
    }, 600);
  }
})();

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
    r: Math.random() * 2 + 1.5
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
          ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.5;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    const nodeColor = cachedColors['--fn'];
    ctx.globalAlpha = 0.8;
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

  setTimeout(() => {
    updateColors();
    requestAnimationFrame(draw);
  }, 50);
})();

// ================= REAL-TIME MINI SKY & CLOCK =================
(function () {
  "use strict";

  const SUNRISE = 6;
  const SUNSET = 18;

  const miniSkyViewport = document.getElementById('miniSkyViewport');
  const miniSun = document.getElementById('miniSun');
  const miniMoon = document.getElementById('miniMoon');
  const clockEl = document.getElementById('clock');
  const skyStatusBadge = document.getElementById('skyStatusBadge');

  if (!miniSkyViewport || !clockEl) return;

  function getArcCoordinates(progress) {
    const angle = progress * Math.PI;
    const x = 15 + (1 - Math.cos(angle)) * 35;
    const y = 80 - Math.sin(angle) * 55;
    return { x, y };
  }

  function updateSkyAndClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let h12 = hours % 12;
    h12 = h12 ? h12 : 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = String(h12).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    
    clockEl.textContent = `${h}:${m} ${ampm}`;

    const decimalTime = hours + (minutes / 60);
    const isDaytime = decimalTime >= SUNRISE && decimalTime < SUNSET;

    if (isDaytime) {
      const dayProgress = (decimalTime - SUNRISE) / (SUNSET - SUNRISE);
      const pos = getArcCoordinates(dayProgress);

      miniSun.style.left = `${pos.x}%`;
      miniSun.style.top = `${pos.y}%`;
      miniSun.style.opacity = '1';

      miniMoon.style.left = '50%';
      miniMoon.style.top = '130%';
      miniMoon.style.opacity = '0';

      if (decimalTime < 8) {
        miniSkyViewport.style.setProperty('--sky-top', '#1e1b4b');
        miniSkyViewport.style.setProperty('--sky-bottom', '#f97316');
        miniSkyViewport.style.setProperty('--star-opacity', '0');
        if (skyStatusBadge) skyStatusBadge.textContent = '🌅 SUNRISE';
      } else if (decimalTime > 16) {
        miniSkyViewport.style.setProperty('--sky-top', '#31103f');
        miniSkyViewport.style.setProperty('--sky-bottom', '#ea580c');
        miniSkyViewport.style.setProperty('--star-opacity', '0.1');
        if (skyStatusBadge) skyStatusBadge.textContent = '🌇 SUNSET';
      } else {
        miniSkyViewport.style.setProperty('--sky-top', '#0284c7');
        miniSkyViewport.style.setProperty('--sky-bottom', '#38bdf8');
        miniSkyViewport.style.setProperty('--star-opacity', '0');
        if (skyStatusBadge) skyStatusBadge.textContent = '☀️ DAYTIME';
      }
    } else {
      let nightProgress;
      if (decimalTime >= SUNSET) {
        nightProgress = (decimalTime - SUNSET) / (24 - SUNSET + SUNRISE);
      } else {
        nightProgress = (decimalTime + (24 - SUNSET)) / (24 - SUNSET + SUNRISE);
      }

      const pos = getArcCoordinates(nightProgress);

      miniMoon.style.left = `${pos.x}%`;
      miniMoon.style.top = `${pos.y}%`;
      miniMoon.style.opacity = '1';

      miniSun.style.left = '50%';
      miniSun.style.top = '130%';
      miniSun.style.opacity = '0';

      miniSkyViewport.style.setProperty('--sky-top', '#030712');
      miniSkyViewport.style.setProperty('--sky-bottom', '#0f172a');
      miniSkyViewport.style.setProperty('--star-opacity', '0.85');
      if (skyStatusBadge) skyStatusBadge.textContent = '🌙 NIGHTTIME';
    }
  }

  updateSkyAndClock();
  setInterval(updateSkyAndClock, 1000);
})();

// ============================================================
// TYPED OUTPUT EFFECT
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

// ================= SKILL CHIP TAP-TO-SHOW =================
document.querySelectorAll(".chip").forEach((chip) => {
  chip.setAttribute("tabindex", "0");
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
// CONTACT FORM SUBMISSION
// ============================================================
const Form = document.getElementById('contact-form');
const fNote = document.getElementById('form-note');

if (Form) {
  // Select all input and textarea elements inside the form
  const inputs = Form.querySelectorAll('input[name="name"], input[name="email"], textarea[name="message"]');

  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });

  Form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // 1. Run full validation check before fetch call
    let isValid = true;
    inputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      showNote('please fill out all required fields correctly', 'error');
      if (typeof showToast === 'function') showToast('Please correct input errors', 'error');
      return;
    }

    const submitBtn = Form.querySelector('.form-submit');
    if (submitBtn) submitBtn.disabled = true;
    showNote('sending...', 'info');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: "069cb0b8-1614-49a5-9f97-edc09efd038c",
          name: Form.querySelector('[name="name"]').value.trim(),
          email: Form.querySelector('[name="email"]').value.trim(),
          message: Form.querySelector('[name="message"]').value.trim(),
          subject: "New Portfolio Contact Message"
        })
      });

      const data = await res.json();

      if (data.success) {
        showNote("message sent — I'll get back to you soon!", 'success');
        if (typeof showToast === 'function') showToast('Message sent successfully!', 'success');
        Form.reset();
        clearAllErrors();
      } else {
        const errText = data.message || data.error || 'submission failed — please check inputs';
        showNote(errText, 'error');
        if (typeof showToast === 'function') showToast(errText, 'error');
      }
    } catch (err) {
      showNote('network error — please try again', 'error');
      if (typeof showToast === 'function') showToast('network error — please try again', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Safer Field Validation Function
function validateField(input) {
  const val = input.value.trim();
  const fieldName = input.name || 'Field';
  let errorMessage = '';

  if (!val) {
    errorMessage = `${fieldName} is required`;
  } else if (input.name === 'email' && !validateEmail(val)) {
    errorMessage = 'Please enter a valid email address';
  } else if (input.name === 'name' && val.length < 2) {
    errorMessage = 'Name must be at least 2 characters';
  } else if (input.name === 'message' && val.length < 10) {
    errorMessage = 'Message must be at least 10 characters';
  }

  if (errorMessage) {
    input.classList.add('input-error');
    showFieldError(input, errorMessage);
    return false;
  } else {
    clearFieldError(input);
    return true;
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, message) {
  let errorEl = input.nextElementSibling;
  if (!errorEl || !errorEl.classList.contains('field-error')) {
    errorEl = document.getElementById(`${input.id}-error`);
  }
  if (errorEl) errorEl.textContent = `>>> ${message}`;
}

function clearFieldError(input) {
  input.classList.remove('input-error');
  let errorEl = input.nextElementSibling;
  if (!errorEl || !errorEl.classList.contains('field-error')) {
    errorEl = document.getElementById(`${input.id}-error`);
  }
  if (errorEl) errorEl.textContent = '';
}

function clearAllErrors() {
  if (!Form) return;
  Form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
  Form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
}

function showNote(text, type) {
  if (!fNote) return;
  fNote.textContent = '>>> ' + text;
  fNote.classList.remove('note-success', 'note-error', 'note-visible');
  void fNote.offsetWidth;
  if (type === 'success') fNote.classList.add('note-success');
  if (type === 'error') fNote.classList.add('note-error');
  fNote.classList.add('note-visible');
}

// ============================================================
// CERTIFICATE VIEWER MODAL
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