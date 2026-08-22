
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
        verifyPasscode(); // ONLY trigger point for verification now
      } else if (enteredCode.length < 4) {
        enteredCode += val;
        updateDisplay();
        // removed: auto-verify on reaching 4 digits — user must press ✓ now
      }
    });
  });

  function updateDisplay() {
    keypadDisplay.textContent = enteredCode ? enteredCode.padEnd(4, "_") : "____";
  }

  function verifyPasscode() {
    if (enteredCode.length < 4) {
      // not enough digits entered yet — flash error instead of silently doing nothing
      keypadDisplay.classList.add("error");
      setTimeout(() => keypadDisplay.classList.remove("error"), 400);
      return;
    }

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
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", {
    alpha: true
  });

  let w = 0;
  let h = 0;
  let dpr = 1;

  const mouse = {
    x: -1000,
    y: -1000,
    active: false,
    radius: 210,
    splitRadius: 32
  };

  const CONFIG = {
    nodeCount: 70,

    /*
     * Normal graph connection distance.
     */
    linkDistance: 145,

    /*
     * Distance at which nodes react
     * to the mouse.
     */
    mouseDistance: 220,

    /*
     * Distance where the node starts
     * splitting away from the mouse.
     */
    splitDistance: 42,

    /*
     * Infinite movement speed.
     */
    speed: 0.22,

    /*
     * Mouse attraction strength.
     */
    connectStrength: 0.018,

    /*
     * Mouse split/repulsion strength.
     */
    splitStrength: 0.18
  };

  let nodes = [];

  /* --------------------------------
     Resize
  -------------------------------- */

  function resize() {
    dpr = Math.min(
      window.devicePixelRatio || 1,
      1.5
    );

    w = window.innerWidth;
    h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    createNodes();
  }

  /* --------------------------------
     Create nodes
  -------------------------------- */

  function createNodes() {
  const count = CONFIG.nodeCount;

  nodes = Array.from(
    { length: count },
    () => {
      const angle = Math.random() * Math.PI * 2;

      return {
        x: Math.random() * w,
        y: Math.random() * h,

        vx:
          Math.cos(angle) *
          (CONFIG.speed + Math.random() * 0.25),

        vy:
          Math.sin(angle) *
          (CONFIG.speed + Math.random() * 0.25),

        radius: Math.random() * 1.6 + 1.2,

        phase: Math.random() * Math.PI * 2
      };
    }
  );
}

  /* --------------------------------
     Mouse
  -------------------------------- */

  window.addEventListener(
    "mousemove",
    (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseleave",
    () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    }
  );

  /* --------------------------------
     Infinite movement
  -------------------------------- */

  function updateNodes() {
    nodes.forEach((node) => {
      /*
       * Natural movement.
       */

      node.x += node.vx;
      node.y += node.vy;

      /*
       * Tiny organic movement.
       */

      node.phase += 0.008;

      node.vx +=
        Math.cos(node.phase) * 0.001;

      node.vy +=
        Math.sin(node.phase * 0.8) * 0.001;

      /*
       * Mouse interaction.
       */

      if (mouse.active) {
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;

        const distance = Math.sqrt(
          dx * dx + dy * dy
        );

        /*
         * Mouse is close.
         */

        if (
          distance <
          CONFIG.mouseDistance
        ) {
          /*
           * VERY close:
           *
           * Split node away from cursor.
           */

          if (
            distance <
            CONFIG.splitDistance
          ) {
            const safeDistance =
              Math.max(distance, 0.001);

            const force =
              (1 -
                distance /
                  CONFIG.splitDistance) *
              CONFIG.splitStrength;

            node.vx +=
              (dx / safeDistance) *
              force;

            node.vy +=
              (dy / safeDistance) *
              force;
          }

          /*
           * Normal close:
           *
           * Gently pull node toward
           * the mouse.
           *
           * This makes the graph connect
           * naturally around the cursor.
           */

          else {
            const safeDistance =
              Math.max(distance, 0.001);

            const influence =
              1 -
              distance /
                CONFIG.mouseDistance;

            const force =
              influence *
              CONFIG.connectStrength;

            node.vx -=
              (dx / safeDistance) *
              force;

            node.vy -=
              (dy / safeDistance) *
              force;
          }
        }
      }

      /*
       * Keep movement controlled.
       */

      const maxSpeed = 0.85;

      const speed = Math.sqrt(
        node.vx * node.vx +
          node.vy * node.vy
      );

      if (speed > maxSpeed) {
        node.vx =
          (node.vx / speed) *
          maxSpeed;

        node.vy =
          (node.vy / speed) *
          maxSpeed;
      }

      /*
       * Infinite wrapping.
       *
       * Nodes never disappear.
       */

      const padding = 25;

      if (node.x < -padding) {
        node.x = w + padding;
      }

      if (node.x > w + padding) {
        node.x = -padding;
      }

      if (node.y < -padding) {
        node.y = h + padding;
      }

      if (node.y > h + padding) {
        node.y = -padding;
      }
    });
  }

  /* --------------------------------
     Draw normal connections
  -------------------------------- */

  function drawNodeConnections() {
    for (
      let i = 0;
      i < nodes.length;
      i++
    ) {
      const a = nodes[i];

      for (
        let j = i + 1;
        j < nodes.length;
        j++
      ) {
        const b = nodes[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        const distance = Math.sqrt(
          dx * dx + dy * dy
        );

        if (
          distance >
          CONFIG.linkDistance
        ) {
          continue;
        }

        const opacity =
          (1 -
            distance /
              CONFIG.linkDistance) *
          0.20;

        ctx.beginPath();

        ctx.moveTo(
          a.x,
          a.y
        );

        ctx.lineTo(
          b.x,
          b.y
        );

        ctx.strokeStyle =
          `rgba(168, 140, 255, ${opacity})`;

        ctx.lineWidth = 0.7;

        ctx.stroke();
      }
    }
  }

  /* --------------------------------
     Mouse connections
  -------------------------------- */

  function drawMouseConnections() {
    if (!mouse.active) return;

    /*
     * Find nodes near mouse.
     */

    const nearbyNodes = [];

    nodes.forEach((node) => {
      const dx =
        node.x - mouse.x;

      const dy =
        node.y - mouse.y;

      const distance = Math.sqrt(
        dx * dx +
          dy * dy
      );

      if (
        distance <
        mouse.radius
      ) {
        nearbyNodes.push({
          node,
          distance
        });
      }
    });

    /*
     * Sort closest first.
     */

    nearbyNodes.sort(
      (a, b) =>
        a.distance -
        b.distance
    );

    /*
     * Connect only the closest
     * nodes to the mouse.
     */

    const maxConnections = 8;

    nearbyNodes
      .slice(0, maxConnections)
      .forEach(
        ({
          node,
          distance
        }) => {
          /*
           * If the cursor is directly
           * over the node, don't connect.
           *
           * The node is splitting.
           */

          if (
            distance <
            CONFIG.splitDistance
          ) {
            return;
          }

          const opacity =
            (1 -
              distance /
                mouse.radius) *
            0.65;

          ctx.beginPath();

          ctx.moveTo(
            mouse.x,
            mouse.y
          );

          ctx.lineTo(
            node.x,
            node.y
          );

          ctx.strokeStyle =
            `rgba(196, 181, 253, ${opacity})`;

          ctx.lineWidth = 1;

          ctx.stroke();

          /*
           * Mouse connection point.
           */

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            node.radius + 1.5,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            `rgba(196, 181, 253, ${opacity + 0.15})`;

          ctx.fill();
        }
      );

    /*
     * Draw mouse as graph node.
     */

    ctx.beginPath();

    ctx.arc(
      mouse.x,
      mouse.y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(255,255,255,0.95)";

    ctx.fill();

    /*
     * Mouse ring.
     */

    ctx.beginPath();

    ctx.arc(
      mouse.x,
      mouse.y,
      11,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(168,140,255,0.45)";

    ctx.lineWidth = 1;

    ctx.stroke();
  }

  /* --------------------------------
     Draw nodes
  -------------------------------- */

  function drawNodes() {
    nodes.forEach((node) => {
      let radius =
        node.radius;

      let opacity = 0.45;

      if (mouse.active) {
        const dx =
          node.x - mouse.x;

        const dy =
          node.y - mouse.y;

        const distance =
          Math.sqrt(
            dx * dx +
              dy * dy
          );

        if (
          distance <
          mouse.radius
        ) {
          const influence =
            1 -
            distance /
              mouse.radius;

          radius +=
            influence * 1.8;

          opacity +=
            influence * 0.35;
        }
      }

      /*
       * Node glow.
       */

      ctx.beginPath();

      ctx.arc(
        node.x,
        node.y,
        radius * 3,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        `rgba(168,140,255,${opacity * 0.05})`;

      ctx.fill();

      /*
       * Node.
       */

      ctx.beginPath();

      ctx.arc(
        node.x,
        node.y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        `rgba(216,205,255,${opacity})`;

      ctx.fill();
    });
  }

  /* --------------------------------
     Main animation
  -------------------------------- */

  function animate() {
    ctx.clearRect(
      0,
      0,
      w,
      h
    );

    updateNodes();

    drawNodeConnections();

    drawMouseConnections();

    drawNodes();

    requestAnimationFrame(
      animate
    );
  }

  /* --------------------------------
     Start
  -------------------------------- */

  resize();

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );

  requestAnimationFrame(
    animate
  );
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
document.addEventListener('DOMContentLoaded',()=>{
const navBurger=document.getElementById('nav-burger');
const navTabs=document.getElementById('nav-tabs');
const topbar=document.querySelector('.topbar');

if(!navBurger||!navTabs||!topbar)return;

function openMenu(){
topbar.classList.add('open');
navTabs.classList.add('open');
navBurger.classList.add('open');
navBurger.setAttribute('aria-expanded','true');
}

function closeMenu(){
topbar.classList.remove('open');
navTabs.classList.remove('open');
navBurger.classList.remove('open');
navBurger.setAttribute('aria-expanded','false');
}

navBurger.addEventListener('click',e=>{
e.preventDefault();
e.stopPropagation();
if(e.stopImmediatePropagation)e.stopImmediatePropagation();

if(topbar.classList.contains('open')){
closeMenu();
}else{
openMenu();
}
},true);

navTabs.querySelectorAll('.tab').forEach(tab=>{
tab.addEventListener('click',e=>{
e.stopPropagation();
closeMenu();
});
});

document.addEventListener('click',e=>{
if(!topbar.contains(e.target)){
closeMenu();
}
});

window.addEventListener('resize',()=>{
if(window.innerWidth>720){
closeMenu();
}
});
});

// ================= EXPERIENCE TIMELINE: SCROLL-SYNCED GLOW =================
(function () {
  const gitLog = document.querySelector('.git-log');
  const progressEl = document.getElementById('gitLogProgress');
  if (!gitLog || !progressEl) return;

  const dots = () => document.querySelectorAll('.commit-dot');

  function updateTimelineGlow() {
    const rect = gitLog.getBoundingClientRect();
    if (rect.height === 0) return; // section hidden (e.g. Skills tab active) — skip safely

    const viewportH = window.innerHeight;
    const triggerLine = viewportH * 0.55; // where in the viewport progress is measured from

    let progressPx = triggerLine - rect.top;
    progressPx = Math.max(0, Math.min(progressPx, rect.height));

    const pct = (progressPx / rect.height) * 100;
    progressEl.style.height = pct + '%';

    dots().forEach((dot) => {
      const dotRect = dot.getBoundingClientRect();
      const dotOffset = dotRect.top - rect.top + dotRect.height / 2;
      dot.classList.toggle('lit', progressPx >= dotOffset);
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateTimelineGlow();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateTimelineGlow);
  document.addEventListener('DOMContentLoaded', updateTimelineGlow);

  // re-check when the Experience tab becomes visible again (in case Skills was active)
  document.querySelectorAll('.exp-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setTimeout(updateTimelineGlow, 60));
  });

  updateTimelineGlow();
})();
// ============ END TIMELINE SCROLL GLOW ============
// ================= EXPERIENCE / SKILLS TAB SWITCHER =================

document.addEventListener('DOMContentLoaded', function () {
  const tabBtns = document.querySelectorAll('.exp-tab-btn');
  const panels = document.querySelectorAll('.exp-panel');

  if (!tabBtns.length || !panels.length) return; // section not on this page — skip safely

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (btn.classList.contains('active')) return; // already selected, no-op

      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      panels.forEach((panel) => {
        if (panel.dataset.panel === target) {
          panel.style.display = 'flex';
          panel.classList.remove('exp-panel-anim');
          void panel.offsetWidth; // force reflow so the animation replays every time
          panel.classList.add('exp-panel-anim');
        } else {
          panel.style.display = 'none';
        }
      });
    });
  });
});
// ============ END EXPERIENCE / SKILLS TAB SWITCHER ============

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
      if (typeof showToast === 'function') showToast('please fill out all required fields correctly', 'error');
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