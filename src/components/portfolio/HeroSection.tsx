import { HeroSignalGraph } from "@/components/portfolio/HeroSignalGraph";
import TechText from "@/components/portfolio/TechText";
import { Mascot } from "page-mascot";
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { type MouseEvent } from "react";
import "./HeroSection.css";

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
          {/* Layer 0 — the interactive name sits behind the portrait; the
              real <h1> further down is what screen readers get. */}
          <motion.div
            className="hk-hero__name"
            aria-hidden="true"
            initial={{ opacity: 0, x: -70 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
            style={{ x: wordX, y: wordY }}
          >
            <TechText
              text="HIREN"
              fontFamily="'Bebas Neue', sans-serif"
              fontWeight={400}
              fontSize={320}
              letterSpacing={0.12}
              color="rgba(29, 27, 24, 0.4)"
              accentColor="#B86543"
              reveal="letter"
              specks={15}
              sweep
              clickKick
              className="hk-hero__tech-text"
            />
          </motion.div>

          {/* Layer 1 — cursor-tracking Hiren mascot, primary focus */}
          <motion.div
            className="hk-hero__portrait"
            initial={{ opacity: 0, y: 42 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.35 }}
          >
            <motion.div style={{ x: photoX, y: photoY }}>
              <div className="hk-hero__portrait-wrap">
                <Mascot
                  directions="/mascots/hiren-directions.webp"
                  reactions="/mascots/hiren-reactions.webp"
                  size={500}
                  label="Illustrated portrait of Hiren"
                  className="hk-hero__mascot"
                />
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
              I find useful insights in data, build machine learning tools, and
              create web experiences that solve real problems.
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
