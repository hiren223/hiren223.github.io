/**
 * Preloader — the HIREN zoom reveal.
 *
 * The overlay is a sibling of the app, never a replacement for it: the
 * portfolio mounts and renders behind it, so lifting the overlay uncovers the
 * real hero instead of a page that still has to boot.
 *
 * Three honest gates decide when the sequence may finish:
 *
 *   1. the first route has mounted  — <AppReady/> dispatches APP_READY_EVENT
 *   2. the window has loaded        — `load`, i.e. subresources are in
 *   3. the faces have settled       — document.fonts, including a forced
 *                                     load of Bebas Neue so the word is
 *                                     measured and revealed in the face it
 *                                     will actually keep
 *
 * Until all three are open the bar eases toward 92% and stops there, so a
 * fast machine never sits through a fake count and a slow one never watches
 * 100% arrive before the page does. A last-resort release exists only so a
 * hung font request can never trap the visitor behind the overlay.
 *
 * The sequence, once 100% is reached: hold → the bar and counter fade → the
 * word scales up and past the camera while its own fill fades → the ground
 * dissolves → the overlay unmounts, taking its pointer-events with it.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./preloader.css";

/** Dispatched by <AppReady/> once the first route has mounted. */
const APP_READY_EVENT = "hk:app-ready";

/* Module scope on purpose: a StrictMode remount must not be able to miss the
   signal, and the *order* of the two effects must not matter. */
let appReadySignalled = false;

function signalAppReady() {
  if (appReadySignalled) return;
  appReadySignalled = true;
  window.dispatchEvent(new Event(APP_READY_EVENT));
}

/**
 * Rendered inside the Suspense boundary, after the routes: it only mounts once
 * the lazy route chunk has resolved and rendered, which makes its effect the
 * earliest honest "the page is on screen" signal available.
 */
export function AppReady() {
  useEffect(() => {
    signalAppReady();
  }, []);
  return null;
}

type Phase = "load" | "hold" | "zoom" | "done";

/* The bar eases toward CAP and stops there while any gate is closed. */
const CAP = 92;
const TAU_LOAD = 850; // ms of easing toward the cap
const TAU_FINISH = 130; // ms of easing once every gate is open

const HOLD_MS = 260; // 100% held, bar and counter still up
const ZOOM_DELAY_MS = 320; // the bar has finished fading before the letters move
const BAR_FADE_S = 0.3;
const ZOOM_S = 1.15;
const ZOOM_SCALE = 26; // far past "bigger than the viewport"
const RUN_MS = 1620; // zoom start → unmount (covers the longest fade)
const MAX_WAIT_MS = 8000; // release the overlay no matter what
/* In dev the stylesheet — and with it the @import of the display face — is
   injected by the module graph, so the family can still be unregistered when
   this effect first runs and document.fonts.load() would then resolve against
   nothing. A short grace lets the @import land first. */
const FONT_GRACE_MS = 250;

/* The word fills this share of the viewport width, and never more than this
   share of its height — the composition (word + bar + counter) stays centred
   and whole on every aspect ratio. */
const WORD_SPAN = 0.86;
/* 0.72, not 0.6: measured, a 0.6 cap bound before the width did on any window
   wider than 16:9 and on short ones, leaving the word at 54–74% of the width
   when it can comfortably hold 82% and still keep the bar and counter on
   screen (the composition is 0.8em of word plus ~80px, so it fits a 320px
   viewport). */
const WORD_MAX_H = 0.72;
const WORD_MIN_PX = 56;

/* Accelerating away from the viewer, without a hard stop at the end. */
const EASE_ZOOM: [number, number, number, number] = [0.62, 0.02, 0.75, 0.35];

export function Preloader() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("load");
  const [pct, setPct] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  /* Bumped whenever the font set finishes loading, so a face that arrives late
     re-fits the word instead of leaving it sized to the fallback. */
  const [fontEpoch, setFontEpoch] = useState(0);

  const wordRef = useRef<HTMLSpanElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef(0);
  const readyRef = useRef(false);

  /* ---------- readiness: three gates, one release ---------- */
  useEffect(() => {
    let alive = true;
    let appDone = appReadySignalled;
    let fontsDone = false;
    let windowDone = document.readyState === "complete";

    const settle = () => {
      if (!alive || readyRef.current) return;
      if (!appDone || !fontsDone || !windowDone) return;
      readyRef.current = true;
    };

    const onApp = () => {
      appDone = true;
      settle();
    };
    const onLoad = () => {
      windowDone = true;
      settle();
    };
    const onFonts = () => {
      fontsDone = true;
      setFontsReady(true);
      settle();
    };

    window.addEventListener(APP_READY_EVENT, onApp);
    window.addEventListener("load", onLoad);

    /* Asking for the face by name is the point: `ready` alone can resolve
       before the @import has even been discovered, and then the word would be
       measured against a fallback and keep the wrong size. */
    let grace = 0;
    if (document.fonts) {
      grace = window.setTimeout(() => {
        if (!alive) return;
        const faces = Promise.all([
          document.fonts.ready,
          document.fonts.load('1em "Bebas Neue"', "HIREN"),
        ]);
        void faces.then(onFonts, onFonts);
      }, FONT_GRACE_MS);
    } else {
      onFonts();
    }

    /* Escape hatch: a stalled font request must not leave the overlay up. */
    const bail = window.setTimeout(() => {
      if (!alive) return;
      fontsDone = true;
      windowDone = true;
      appDone = true;
      setFontsReady(true);
      settle();
    }, MAX_WAIT_MS);

    return () => {
      alive = false;
      window.clearTimeout(bail);
      window.clearTimeout(grace);
      window.removeEventListener(APP_READY_EVENT, onApp);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  /* A late face (or a resize-driven reflow) re-fits the word. */
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const refit = () => setFontEpoch((epoch) => epoch + 1);
    fonts.addEventListener("loadingdone", refit);
    return () => fonts.removeEventListener("loadingdone", refit);
  }, []);

  /* ---------- the ramp: one rAF, one clock ---------- */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      if (!last) last = now;
      /* Clamped, so a backgrounded tab cannot jump the count on return. */
      const dt = Math.min(now - last, 100);
      last = now;

      const ready = readyRef.current;
      const cur = progressRef.current;
      const cap = ready ? 100 : CAP;
      const tau = ready ? TAU_FINISH : TAU_LOAD;
      const next = cur + (cap - cur) * (1 - Math.exp(-dt / tau));
      progressRef.current = next;

      const shown = Math.round(next);
      /* The bar is written straight to the DOM: 60fps of compositing, and a
         re-render only when the integer counter actually changes. */
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${Math.min(next / 100, 1)})`;
      }
      setPct((previous) => (previous === shown ? previous : shown));

      if (ready && next >= 99.6) {
        progressRef.current = 100;
        setPct(100);
        if (fillRef.current) fillRef.current.style.transform = "scaleX(1)";
        setPhase((current) => (current === "load" ? "hold" : current));
        return; // the phase effects carry the sequence from here
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- hold → zoom → done ---------- */
  useEffect(() => {
    if (phase !== "hold") return;
    const hold = window.setTimeout(() => setPhase("zoom"), HOLD_MS);
    return () => window.clearTimeout(hold);
  }, [phase]);

  useEffect(() => {
    if (phase !== "zoom") return;
    const end = window.setTimeout(() => setPhase("done"), RUN_MS);
    return () => window.clearTimeout(end);
  }, [phase]);

  /* ---------- scroll lock, released with the overlay ---------- */
  const finished = phase === "done";
  useEffect(() => {
    if (finished) return;
    const root = document.documentElement;
    root.classList.add("hk-preloader-lock");
    return () => root.classList.remove("hk-preloader-lock");
  }, [finished]);

  /* ---------- fit the word to the viewport, whatever face renders ------- */
  useLayoutEffect(() => {
    if (!fontsReady) return;
    const word = wordRef.current;
    if (!word) return;

    let frame = 0;
    const fit = () => {
      /* Measured at a known size: the word's width is linear in font-size
         (tracking is in em), so one ratio converts any target to px — and it
         stays true for the sans fallback if Bebas Neue never arrives. */
      word.style.fontSize = "100px";
      const ratio = word.getBoundingClientRect().width / 100;
      if (!ratio || !Number.isFinite(ratio)) return;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const size = Math.min((vw * WORD_SPAN) / ratio, vh * WORD_MAX_H);
      word.style.fontSize = `${Math.max(WORD_MIN_PX, size)}px`;
    };

    fit();
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [fontsReady, fontEpoch]);

  /* Unmounted, not just hidden: an invisible overlay must never keep the
     clicks that belong to the hero. */
  if (finished) return null;

  const zooming = phase === "zoom";

  return (
    <div className="hk-preloader" data-phase={phase}>
      {/* Its own layer, so the cream can dissolve without taking the letters
          with it — the zoom reads as the camera passing through the word. */}
      <motion.div
        className="hk-preloader__ground"
        initial={false}
        animate={{ opacity: zooming ? 0 : 1 }}
        transition={{
          duration: reduced ? 0.45 : 0.5,
          ease: "easeInOut",
          delay: zooming && !reduced ? 1.05 : 0,
        }}
      />

      <div className="hk-preloader__inner">
        <motion.span
          ref={wordRef}
          className="hk-preloader__word"
          /* The hero owns the real heading; this word is the curtain. */
          aria-hidden="true"
          initial={false}
          animate={{
            opacity: zooming ? 0 : fontsReady ? 1 : 0,
            scale: zooming && !reduced ? ZOOM_SCALE : 1,
          }}
          transition={
            zooming
              ? {
                  scale: {
                    duration: reduced ? 0.3 : ZOOM_S,
                    ease: EASE_ZOOM,
                    delay: reduced ? 0 : ZOOM_DELAY_MS / 1000,
                  },
                  opacity: {
                    duration: 0.45,
                    ease: "easeIn",
                    delay: reduced ? 0 : 1,
                  },
                }
              : { duration: 0.3, ease: "easeOut" }
          }
        >
          HIREN
        </motion.span>

        <motion.div
          className="hk-preloader__progress"
          initial={false}
          animate={{ opacity: zooming ? 0 : 1 }}
          transition={{
            duration: reduced ? 0.25 : BAR_FADE_S,
            ease: "easeOut",
          }}
        >
          <div
            className="hk-preloader__track"
            role="progressbar"
            aria-label="Loading the portfolio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <span ref={fillRef} className="hk-preloader__fill" />
          </div>
          <p className="hk-preloader__pct">{String(pct).padStart(2, "0")}%</p>
        </motion.div>
      </div>
    </div>
  );
}
