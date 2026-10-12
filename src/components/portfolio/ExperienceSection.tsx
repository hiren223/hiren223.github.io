/* ExperienceSection — the editorial vertical career timeline.

ONE timeline, one layout, at every width. Each milestone is a row of
the same three-column grid:

    metadata | rail column | content

The rail column owns the marker, and the single rail above the list is
centred in that same column, which is why the markers and the rail
cannot drift apart. Nothing alternates left/right and nothing is
positioned with percentages.

The content comes from src/lib/experience-data.ts — the degree, the
certification and the role — so the three milestones keep a single
source of truth. No new copy, colour or font is introduced here.
*/

import { education, timeline } from "@/lib/experience-data";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Award,
  Briefcase,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import "./experience.css";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The only entrance in the section: a fade and a small rise, applied to
 * the content blocks. The rail and the markers are never animated, so
 * the geometry of the timeline is identical before, during and after a
 * reveal. When the visitor asks for reduced motion the fade is kept and
 * the movement is dropped.
 */
function rise(delay: number, still: boolean, distance = 16) {
  return {
    initial: still ? { opacity: 0 } : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: {
      duration: still ? 0.3 : 0.7,
      ease: EASE,
      delay: still ? 0 : delay,
    },
  };
}

/** Milestone 02 — the two credentials named in the portfolio. */
const certificationMilestone = {
  id: "certification" as const,
  category: "Certification" as const,
  year: "Jun 2026" as const,
  headline: "Certified Data Scientist\n& Data Science Foundation" as const,
  org: "NASSCOM FutureSkills Prime (Gold, 95%) · IABAC" as const,
  description:
    "Created a Government of India-aligned Data Scientist assessment with a Gold score, and earned the IABAC Data Science Foundation certification — formalising skills built during the Rubixe internship." as const,
};

type MilestoneEntry = {
  id: string;
  category: string;
  year: string;
  headline: string;
  org: string;
  description: string;
  meta?: string;
  link?: { label: string; to: string };
  points?: string[];
};

type MilestoneRow = {
  n: string;
  date: string;
  category: string;
  /** The marker glyph — one per milestone, in the rail column. */
  icon: LucideIcon;
  entry: MilestoneEntry;
};

const MILESTONES: MilestoneRow[] = [
  {
    n: "01",
    date: education.year,
    category: "Education",
    icon: GraduationCap,
    entry: education as MilestoneEntry,
  },
  {
    n: "02",
    date: certificationMilestone.year,
    category: "Certification",
    icon: Award,
    entry: certificationMilestone as MilestoneEntry,
  },
  {
    n: "03",
    date: timeline[1].year,
    category: "Experience",
    icon: Briefcase,
    entry: timeline[1] as MilestoneEntry,
  },
];

const HEADLINE_LINES = ["Experience that shaped", "how I work with data."];

/* ------------------------------------------------------------- content */

function MilestoneContent({
  entry,
  expanded,
  onToggle,
  still,
}: {
  entry: MilestoneEntry;
  expanded: boolean;
  onToggle: () => void;
  still: boolean;
}) {
  return (
    <motion.div
      className="experience-timeline__content"
      {...rise(0.12, still, 20)}
    >
      <h3 className="experience-timeline__title">
        {entry.headline.split("\n").map((line, j) => (
          <span key={j} className="experience-timeline__line">
            {line}
          </span>
        ))}
      </h3>

      <p className="experience-timeline__org">{entry.org}</p>

      {entry.meta && (
        <p className="experience-timeline__period">{entry.meta}</p>
      )}

      <p className="experience-timeline__desc">{entry.description}</p>

      {entry.link && (
        <a href={entry.link.to} className="experience-timeline__link">
          <span className="experience-timeline__link-label">
            FINAL-YEAR PROJECT
          </span>
          <span className="experience-timeline__link-name">
            {entry.link.label}
          </span>
        </a>
      )}

      {entry.points && (
        <>
          <button
            type="button"
            className="experience-timeline__link experience-timeline__toggle"
            aria-expanded={expanded}
            aria-controls={expanded ? `${entry.id}-points` : undefined}
            onClick={onToggle}
          >
            <span className="experience-timeline__link-label">
              VIEW RESPONSIBILITIES
            </span>
            <span className="experience-timeline__link-name">
              {expanded ? "−" : "+"}
            </span>
          </button>

          {expanded && (
            <ul
              id={`${entry.id}-points`}
              className="experience-timeline__points"
            >
              {entry.points.map((point) => (
                <li key={point} className="experience-timeline__point">
                  {point}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------- section */

export function ExperienceSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const still = Boolean(useReducedMotion());
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  /* The rail animates with the scroll, not with time: it starts drawing
     as the timeline's top edge enters the viewport and is complete once
     its last milestone has reached the middle of the screen. */
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end center"],
  });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      className="experience-section"
      aria-labelledby="experience-heading"
    >
      {/* page-container: the header sits on the page's left edge, with
          About, Certifications and Contact. */}
      <header className="page-container experience-header">
        <motion.div className="experience-marker" {...rise(0, still)}>
          <span className="experience-marker__index">04</span>
          <span className="experience-marker__rule" />
          <span className="experience-label">Experience</span>
        </motion.div>

        <motion.h2
          id="experience-heading"
          className="experience-headline"
          {...rise(0.06, still, 22)}
        >
          {HEADLINE_LINES.map((line, i) => (
            <span key={i} className="experience-headline__line">
              {i === 1 ? (
                <span className="experience-headline__accent">{line}</span>
              ) : (
                line
              )}
            </span>
          ))}
        </motion.h2>
      </header>

      <div className="experience-timeline" ref={timelineRef}>
        {/* One rail for the whole timeline. It is centred in the same
            grid column that holds the markers, so its centre and their
            centres are a single coordinate at all three milestones. */}
        <span className="experience-timeline__rail" aria-hidden="true" />

        {/* The same line, drawn in the accent colour as the section
            scrolls. Static and complete when motion is reduced. */}
        <motion.span
          className="experience-timeline__fill"
          aria-hidden="true"
          style={still ? undefined : { scaleY: railScale }}
        />

        <ol className="experience-timeline__list">
          {MILESTONES.map((milestone) => (
            <li key={milestone.entry.id} className="experience-timeline__row">
              {/* The metadata fades in place: no rise, so the date is
                  never visually offset from its marker. */}
              <motion.div
                className="experience-timeline__meta"
                {...rise(0.04, still, 0)}
              >
                <span className="experience-timeline__date">
                  {milestone.date}
                </span>
                <span className="experience-timeline__category">
                  {milestone.n} / {milestone.category}
                </span>
              </motion.div>

              {/* The real marker: one per milestone, in the rail column,
                  never a pseudo-element and never absolutely placed. */}
              <div className="experience-timeline__marker" aria-hidden="true">
                <span className="experience-timeline__icon">
                  {/* Sized from --tl-icon in CSS; this is the
                      no-stylesheet fallback. */}
                  <milestone.icon size={16} strokeWidth={1.5} />
                </span>
              </div>

              <MilestoneContent
                entry={milestone.entry}
                expanded={expandedId === milestone.entry.id}
                onToggle={() => toggle(milestone.entry.id)}
                still={still}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
