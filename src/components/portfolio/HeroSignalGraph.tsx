import { motion, useReducedMotion } from "framer-motion";

/**
 * Right-hand hero plate — a small instrument panel on glass: one line
 * series drawn in, with two readouts underneath. Purely decorative, so it is
 * hidden from assistive tech (the hero copy already carries the meaning).
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* Chart geometry, in the SVG's own 220×92 user units. PAD_BOTTOM is only the
   descender breathing room now — there are no x-axis labels. */
const W = 220;
const H = 92;
const PAD_X = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;
const INNER_W = W - PAD_X * 2;
const INNER_H = H - PAD_TOP - PAD_BOTTOM;

/* A rising, slightly noisy series — reads as "a metric improving". */
const SERIES = [
  0.26, 0.33, 0.3, 0.41, 0.46, 0.43, 0.55, 0.61, 0.58, 0.7, 0.79, 0.88,
];

const xAt = (i: number) => PAD_X + (i / (SERIES.length - 1)) * INNER_W;
const yAt = (v: number) => PAD_TOP + (1 - v) * INNER_H;
const BASE_Y = PAD_TOP + INNER_H;

const LINE_PATH = SERIES.map(
  (v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`,
).join(" ");

const AREA_PATH = `${LINE_PATH} L${xAt(SERIES.length - 1).toFixed(2)} ${BASE_Y} L${PAD_X} ${BASE_Y} Z`;

/* Faint horizontal guides, drawn edge to edge. */
const GUIDES = [0, 0.5, 1];

const READOUTS = [
  { label: "Accuracy", value: "91.98" },
  { label: "ROC-AUC", value: "0.761" },
];

export function HeroSignalGraph() {
  const reduced = useReducedMotion();

  return (
    <div className="hk-plate" aria-hidden="true">
      <div className="hk-plate__head">
        <span className="hk-plate__fig">Fig. 02</span>
        <span className="hk-plate__title">Signal, resolved</span>
      </div>

      {/* meet, not none: the plot keeps its own proportions instead of being
          stretched flat by a wide fixed-width plate */}
      <svg
        className="hk-plate__chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
      >
        {GUIDES.map((g) => (
          <line
            key={g}
            className="hk-plate__grid"
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yAt(g)}
            y2={yAt(g)}
          />
        ))}

        <defs>
          <linearGradient id="hkPlateFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--clay)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path className="hk-plate__area" d={AREA_PATH} fill="url(#hkPlateFill)" />

        {/* Framer draws the line; reduced motion gets it fully drawn at once. */}
        <motion.path
          className="hk-plate__line"
          d={LINE_PATH}
          pathLength={1}
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 1.5, ease: EASE, delay: 0.9 }
          }
        />

        <motion.circle
          className="hk-plate__dot"
          cx={xAt(SERIES.length - 1)}
          cy={yAt(SERIES[SERIES.length - 1])}
          r={2.6}
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: reduced ? 0 : 2.25 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      </svg>

      <dl className="hk-plate__readouts">
        {READOUTS.map((row) => (
          <div className="hk-plate__row" key={row.label}>
            <dt className="hk-plate__key">{row.label}</dt>
            <dd className="hk-plate__val">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
