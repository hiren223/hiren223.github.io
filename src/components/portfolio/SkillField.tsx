/**
 * SkillField — the interactive technology field.
 *
 * The marks are individual objects placed by hand on a wide canvas: no cards,
 * no boxes, no meters. Four layers of motion, each on its own element so they
 * never fight over `transform`:
 *
 *   .hk-field__item    absolute placement + the staggered scroll reveal
 *   float              the very slow, independent vertical drift
 *   .hk-field__depth   pointer parallax, spring-smoothed
 *   .hk-field__body    the hover scale (plain CSS)
 *
 * Pointer travel goes through Framer MotionValues and a spring — there is no
 * setState in the pointer handler. Below 64rem the component renders a separate
 * vertical edition instead of squeezing the canvas, and on touch devices the
 * parallax is never wired up at all.
 */
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CATEGORY_LABEL,
  SKILL_CATEGORIES,
  SKILL_FLOW,
  SKILL_LINKS,
  SKILLS,
  skillsByCategory,
  type Skill,
} from "@/lib/skill-field";
import "./skill-field.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Never let the stagger run past a second — the field should not feel slow. */
const capped = (index: number, step = 0.045, max = 0.52) =>
  Math.min(index * step, max);

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
    : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Desktop is the free-form canvas; anything narrower gets the vertical edition. */
function useWideCanvas() {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return wide;
}

/** Pointer parallax only exists where there is a pointer to move. */
function usePointerParallax() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return enabled;
}

/* ------------------------------------------------------------------ item */

type SkillItemProps = {
  skill: Skill;
  index: number;
  /** Canvas placement, as a style — only used by the free-form edition. */
  at?: CSSProperties;
  active: boolean;
  /** Global pointer field, normalised to -1…1 around the canvas centre. */
  px: MotionValue<number>;
  py: MotionValue<number>;
  still: boolean;
  parallax: boolean;
  onHoverChange?: (id: string | null) => void;
};

function SkillItem({
  skill,
  index,
  at,
  active,
  px,
  py,
  still,
  parallax,
  onHoverChange,
}: SkillItemProps) {
  /* Each mark drifts on its own clock; the amplitude is under 4px. */
  const drift = still
    ? undefined
    : {
        y: [0, -3.5, 0, 3.5, 0],
        transition: {
          duration: 4.4 + (index % 4) * 0.85,
          repeat: Infinity,
          ease: "easeInOut" as const,
          delay: (index % 6) * 0.7,
        },
      };

  /* The reveal slides in from a few different directions, gently. */
  const from =
    index % 3 === 0
      ? { opacity: 0, y: 20, x: 0 }
      : index % 3 === 1
        ? { opacity: 0, y: 14, x: -16 }
        : { opacity: 0, y: 14, x: 16 };

  const depthX = useTransform(px, (v) => v * skill.depth);
  const depthY = useTransform(py, (v) => v * skill.depth);

  return (
    <motion.div
      className="hk-field__item"
      style={at}
      data-size={skill.size}
      data-active={active}
      onPointerEnter={() => onHoverChange?.(skill.id)}
      onPointerLeave={() => onHoverChange?.(null)}
      initial={still ? { opacity: 0 } : from}
      whileInView={still ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={
        still
          ? { duration: 0.4, delay: capped(index, 0.02, 0.16) }
          : { duration: 0.8, ease: EASE, delay: capped(index) }
      }
    >
      <motion.div className="hk-field__float" animate={drift}>
        <motion.div
          className="hk-field__depth"
          style={parallax ? { x: depthX, y: depthY } : undefined}
        >
          <div className="hk-field__body">
            <img
              className="hk-field__logo"
              src={skill.logo}
              alt=""
              aria-hidden="true"
              data-tone={skill.tone}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              /* The CDN can miss. A broken-image glyph in a loose
                 typographic field is worse than no mark at all, and the
                 name underneath already carries the technology. */
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
            <span className="hk-field__name">{skill.name}</span>
            <span className="hk-field__tip" aria-hidden="true">
              <span className="hk-field__tip-name">{skill.name}</span>
              <span className="hk-field__tip-cat">
                {CATEGORY_LABEL[skill.category]}
              </span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- network */

type Point = { x: number; y: number };

function NetworkLine({
  from,
  to,
  px,
  py,
}: {
  from: Point;
  to: Point;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  /* Lines the cursor is near lift very slightly out of the background. */
  const opacity = useTransform<number, number>([px, py], ([cx, cy]) => {
    const d = distanceToSegment(cx, cy, from.x, from.y, to.x, to.y);
    return 0.55 + 0.45 * Math.max(0, 1 - d / 240);
  });

  return (
    <motion.line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="currentColor"
      strokeWidth={1}
      style={{ opacity }}
    />
  );
}

type SkillNetworkProps = {
  /** Canvas size in CSS pixels — the SVG maps 1:1 onto it. */
  box: { w: number; h: number };
  px: MotionValue<number>;
  py: MotionValue<number>;
};

function SkillNetwork({ box, px, py }: SkillNetworkProps) {
  const byId = useMemo(
    () => new Map(SKILLS.map((skill) => [skill.id, skill])),
    [],
  );

  const at = (id: string): Point | null => {
    const skill = byId.get(id);
    return skill ? { x: (skill.x / 100) * box.w, y: (skill.y / 100) * box.h } : null;
  };

  const lines = useMemo(
    () =>
      SKILL_LINKS.map(([a, b]) => ({ from: at(a), to: at(b) })).filter(
        (line): line is { from: Point; to: Point } =>
          line.from !== null && line.to !== null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [box.w, box.h],
  );

  if (!box.w || !box.h) return null;

  return (
    <svg
      viewBox={`0 0 ${box.w} ${box.h}`}
      width={box.w}
      height={box.h}
      aria-hidden="true"
    >
      {lines.map((line, i) => (
        <NetworkLine
          key={`${i}-${line.from.x}-${line.to.x}`}
          from={line.from}
          to={line.to}
          px={px}
          py={py}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ root */

export function SkillField() {
  const wide = useWideCanvas();
  const parallax = usePointerParallax();
  const reduce = useReducedMotion();
  const still = Boolean(reduce);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<string | null>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  /* One spring for the whole field: the cursor is a single object. */
  const sx = useSpring(px, { stiffness: 55, damping: 18, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 55, damping: 18, mass: 0.7 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !wide) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((prev) =>
        Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5
          ? prev
          : { w: width, h: height },
      );
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [wide]);

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!parallax || still) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    py.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const rest = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      className="hk-field"
      data-quiet={active ? "on" : undefined}
      onPointerLeave={rest}
    >
      {/* The field is decorative markup; the list below is the real content. */}
      <p className="sr-only">
        Skills — {SKILL_CATEGORIES.map((c) => `${c.label}: `).join("")}
        {SKILLS.map((s) => s.name).join(", ")}.
      </p>

      {wide ? (
        <div
          ref={canvasRef}
          className="hk-field__canvas"
          onPointerMove={move}
        >
          <SkillNetwork box={box} px={sx} py={sy} />

          {SKILL_CATEGORIES.map((category, i) => (
            <motion.p
              key={category.id}
              className="hk-field__tag"
              data-anchor="canvas"
              style={{ left: `${category.at.x}%`, top: `${category.at.y}%` }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.9, delay: capped(i, 0.08, 0.4) }}
            >
              <span className="hk-field__tag-index">{category.index}</span>
              <span>/</span>
              <span>{category.label}</span>
            </motion.p>
          ))}

          {SKILLS.map((skill, i) => (
            <SkillItem
              key={skill.id}
              skill={skill}
              index={i}
              at={{ left: `${skill.x}%`, top: `${skill.y}%` }}
              active={active === skill.id}
              px={sx}
              py={sy}
              still={still}
              parallax={parallax && !still}
              onHoverChange={setActive}
            />
          ))}

          {/* A handful of slow dots riding the same lines the network draws. */}
          {!still &&
            box.w > 0 &&
            SKILL_FLOW.map((flow) => {
              const from = byIdPoint(flow.from, box);
              const to = byIdPoint(flow.to, box);
              if (!from || !to) return null;
              return (
                <span
                  key={`${flow.from}-${flow.to}`}
                  className="hk-field__dot"
                  aria-hidden="true"
                  style={
                    {
                      offsetPath: `path("M ${from.x} ${from.y} L ${to.x} ${to.y}")`,
                      animationDuration: `${flow.duration}s`,
                      animationDelay: `${flow.delay}s`,
                    } as CSSProperties
                  }
                />
              );
            })}
        </div>
      ) : (
        <div className="hk-field__groups">
          {SKILL_CATEGORIES.map((category, ci) => (
            <motion.div
              key={category.id}
              className="hk-field__group"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: EASE, delay: capped(ci, 0.07, 0.35) }}
            >
              <p className="hk-field__tag">
                <span className="hk-field__tag-index">{category.index}</span>
                <span>/</span>
                <span>{category.label}</span>
              </p>
              <div className="hk-field__rows">
                {skillsByCategory(category.id).map((skill, i) => (
                  <SkillItem
                    key={skill.id}
                    skill={skill}
                    index={i}
                    active={active === skill.id}
                    px={sx}
                    py={sy}
                    still={still}
                    parallax={false}
                    onHoverChange={setActive}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Percent placement -> canvas pixels, for the flow dots. */
function byIdPoint(id: string, box: { w: number; h: number }): Point | null {
  const skill = SKILLS.find((s) => s.id === id);
  return skill
    ? { x: (skill.x / 100) * box.w, y: (skill.y / 100) * box.h }
    : null;
}
