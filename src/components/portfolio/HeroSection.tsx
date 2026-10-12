import DitherVeil from "@/components/portfolio/DitherVeil";
import { HeroSignalGraph } from "@/components/portfolio/HeroSignalGraph";
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useState, type CSSProperties, type MouseEvent } from "react";
import "./HeroSection.css";

/**
 * Portrait sources — the owner's uploaded background-removed cutout lives in
 * `public/assets/`. Common `public/hiren.*` fallbacks are tried next before
 * the monogram placeholder is shown.
 */
const PORTRAIT_SOURCES = [
  "/assets/photo-2-removebg-preview.png",
  "/hiren.png",
  "/hiren.jpg",
  "/hiren.jpeg",
  "/hiren.webp",
];

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const sideContent: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: 0.75 },
  },
};

/**
 * Home hero — layered editorial composition:
 * bg → giant "HIREN" → central portrait, flanked by the introduction on the
 * left and the signal plate on the right.
 *
 * One three-column grid (HeroSection.css) places all three columns; only the
 * word and the portrait share the centre track, so the word can never drift
 * off the portrait's centre line. Plain CSS, Framer Motion entrance + mouse
 * parallax.
 */
export function HeroSection() {
  const reduced = useReducedMotion();
  const [portraitIndex, setPortraitIndex] = useState(0);
  const portraitFailed = portraitIndex >= PORTRAIT_SOURCES.length;
  /* The veil discards the cutout's transparent pixels, so once it is drawing
     the <img> underneath must fade out or the subject shows through at full
     opacity and the dither is invisible. Until then it is the fallback. */
  const [veilReady, setVeilReady] = useState(false);

  /* Subtle parallax: the word drifts one way, the portrait the other. */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, {
    stiffness: 50,
    damping: 16,
    mass: 0.7,
  });
  const smoothY = useSpring(pointerY, {
    stiffness: 50,
    damping: 16,
    mass: 0.7,
  });
  const wordX = useTransform(smoothX, [-1, 1], [18, -18]);
  const wordY = useTransform(smoothY, [-1, 1], [10, -10]);
  const photoX = useTransform(smoothX, [-1, 1], [-9, 9]);
  const photoY = useTransform(smoothY, [-1, 1], [-6, 6]);

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="hk-hero"
        aria-labelledby="hk-hero-heading"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      >
        <div className="hk-hero__bg" aria-hidden="true" />

        <div className="hk-hero__stage">
          {/* Layer 0 — the giant name, behind the portrait. Static type with
              a slow parallax drift; the real <h1> further down is what
              screen readers get. */}
          <motion.div
            className="hk-hero__name"
            aria-hidden="true"
            initial={{ opacity: 0, x: -70 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
            style={{ x: wordX, y: wordY }}
          >
            <span>HIREN</span>
          </motion.div>

          {/* Layer 1 — the portrait, primary focus (studio-treated) */}
          <motion.div
            className="hk-hero__portrait"
            initial={{ opacity: 0, y: 42 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.35 }}
          >
            <motion.div style={{ x: photoX, y: photoY }}>
              <div className="hk-hero__portrait-wrap">
                {portraitFailed ? (
                  <div className="hk-hero__fallback">HK</div>
                ) : (
                  <>
                    {/* Kept underneath as the no-WebGL fallback. It fades out
                        once the veil reports its first painted frame. */}
                    <img
                      className="hk-hero__portrait-img"
                      style={
                        {
                          opacity: veilReady ? 0 : 1,
                          transition: "opacity 420ms ease-out",
                        } as CSSProperties
                      }
                      src={PORTRAIT_SOURCES[portraitIndex]}
                      alt="Hiren Keraliya — Data Scientist and Full Stack Developer"
                      width={500}
                      height={500}
                      onError={() => {
                        // A new source is a new image: show the <img> again
                        // until this source's veil paints its first frame,
                        // or a failed veil would leave no portrait at all.
                        setVeilReady(false);
                        setPortraitIndex((i) => i + 1);
                      }}
                    />
                    <div className="hk-hero__veil">
                      <DitherVeil
                        src={PORTRAIT_SOURCES[portraitIndex]}
                        fit="contain"
                        pattern="floyd"
                        levels={3}
                        /* ink/paper are the two ends of the duotone, mapped
                           by source luminance: ink takes the shadows, paper
                           takes the highlights. On the dark hero they were
                           near-black and cream; on the paper hero cream
                           highlights would dissolve into the page, so both
                           ends now sit dark — the portrait reads as one dark
                           plate against the ground, using the theme's own
                           --foreground and --muted-foreground. */
                        inkColor="#1d1b18"
                        paperColor="#6f6a63"
                        contrast={1.22}
                        revealRadius={190}
                        softness={0.62}
                        linger={1.1}
                        rim={0.14}
                        rimColor="#B86543"
                        cutout
                        onReady={() => setVeilReady(true)}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Layer 2 — the introduction and its CTA pair, in the left column
              of the lower band. */}
          <motion.div
            className="hk-hero__content-left"
            variants={sideContent}
            initial="hidden"
            animate="show"
          >
            <hr className="hk-hero__rule" />
            <p className="hk-hero__desc">
              Building data-driven solutions through machine learning,
              analytics, visualization, and modern web development.
            </p>
            <div className="hk-hero__actions">
              <a className="hk-hero__btn hk-hero__btn--solid" href="#work">
                View My Work
              </a>
              <a className="hk-hero__btn hk-hero__btn--ghost" href="#contact">
                Let&apos;s Connect
              </a>
            </div>
          </motion.div>

          {/* Layer 3 — the signal plate, in the right column of the lower band,
              balancing the introduction across the portrait. Decorative: the
              chart is aria-hidden and the hero copy carries the meaning, so it
              stays out of the reading order. */}
          <motion.div
            className="hk-hero__plate-slot"
            variants={sideContent}
            initial="hidden"
            animate="show"
          >
            <HeroSignalGraph />
          </motion.div>

          {/* Page heading — kept for screen readers and document outline;
              the visual role line that used to sit here was removed. */}
          <h1 id="hk-hero-heading" className="sr-only">
            Hiren Keraliya — Data Scientist &amp; Full Stack Developer
          </h1>
        </div>
      </section>
    </MotionConfig>
  );
}
