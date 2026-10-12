/**
 * ProjectIndex — the editorial project archive.
 *
 * A project is a row of type, a hairline and a picture. Nothing here
 * draws a border, a background, a radius or a shadow: the structure
 * is numbering, thin dividers, whitespace and the cover art.
 *
 * The reading order is deliberate and fixed — number, title,
 * description, technologies, image, case study — and it is the same
 * on every breakpoint. Nothing floats, nothing follows the pointer,
 * and no row expands on hover. The art sits in a predictable slot
 * and does one small thing: it scales 2.5% and nothing else.
 *
 * Below 48rem each row is a single vertical flow with the art
 * directly under the title; from 48rem the copy and the art sit
 * side by side, roughly 44/56, so the description keeps a readable
 * measure instead of being squeezed into a hairline.
 *
 * All data comes from the caller, which reads the same source the
 * homepage and /projects use — nothing about a project is restated
 * here.
 */
import { coverSrc } from "@/lib/project-media";
import type { PortfolioProject } from "@/lib/sample-projects";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import { useCallback, useState } from "react";
import "./project-index.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pad = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ meta */

/** Technologies as plain text separated by slashes — never chips. */
export function ProjectMeta({ tags }: { tags: string[] }) {
  return (
    <p className="pj-meta">
      {tags.map((tag, i) => (
        <span key={tag}>
          {i > 0 && <span className="pj-meta__sep"> / </span>}
          {tag}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------- row */

type RowProps = {
  project: PortfolioProject;
  index: number;
  active: boolean;
  onOpen: () => void;
  onSpotlight: (id: string | null) => void;
  eager: boolean;
  still: boolean;
};

function ProjectRow({
  project,
  index,
  active,
  onOpen,
  onSpotlight,
  eager,
  still,
}: RowProps) {
  const number = pad(index + 1);

  return (
    <motion.article
      className="pj-row"
      id={`project-${number}`}
      data-active={active}
      /* Focusable so a project can be reached and highlighted from the
         keyboard. The case study is opened by the real button below,
         never by this element. */
      tabIndex={0}
      onPointerEnter={() => onSpotlight(project.id)}
      onPointerLeave={() => onSpotlight(null)}
      onFocus={() => onSpotlight(project.id)}
      onBlur={() => onSpotlight(null)}
      initial={still ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: still ? 0.4 : 0.6,
        ease: EASE,
        delay: Math.min(index * 0.08, 0.4),
      }}
    >
      <span className="pj-row__rule" aria-hidden="true" />

      <div className="pj-row__head">
        <span className="pj-row__number">{number}</span>
        <span className="pj-row__year">{project.year}</span>
      </div>

      <div className="pj-row__main">
        <motion.div
          className="pj-row__content"
          initial={still ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: still ? 0.4 : 0.6,
            ease: EASE,
            delay: Math.min(index * 0.08, 0.4) + 0.06,
          }}
        >
          <h3 className="pj-row__title">{project.title}</h3>
          <p className="pj-row__summary">{project.summary}</p>
          <ProjectMeta tags={project.tags} />
        </motion.div>

        <motion.figure
          className="pj-row__media"
          initial={still ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: still ? 0.4 : 0.65,
            ease: EASE,
            delay: Math.min(index * 0.08, 0.4) + 0.14,
          }}
        >
          <div className="pj-row__frame">
            <img
              src={coverSrc(project.image)}
              alt={project.title}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
          <figcaption className="pj-row__caption">
            {project.title} / {number}
          </figcaption>
        </motion.figure>
      </div>

      <div className="pj-row__footer">
        <button type="button" className="pj-row__cta" onClick={onOpen}>
          Case study
          <ArrowUpRight aria-hidden="true" />
        </button>
        <span className="pj-row__role">{project.role}</span>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ index */

export function ProjectIndex({
  projects,
  /** Cover art in the rows above the fold can load eagerly. */
  eagerCount = 0,
  onOpen,
  /** Optional external control, so a page index can highlight a row. */
  activeId,
  onActiveIdChange,
}: {
  projects: PortfolioProject[];
  eagerCount?: number;
  onOpen: (project: PortfolioProject) => void;
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
}) {
  const still = Boolean(useReducedMotion());
  const [internal, setInternal] = useState<string | null>(null);
  const active = activeId === undefined ? internal : activeId;

  const spotlight = useCallback(
    (id: string | null) => {
      if (activeId === undefined) setInternal(id);
      onActiveIdChange?.(id);
    },
    [activeId, onActiveIdChange],
  );

  return (
    <div className="pj" data-active={active ?? "none"}>
      <div className="pj__list">
        {projects.map((project, index) => (
          <ProjectRow
            key={project.id}
            project={project}
            index={index}
            active={active === project.id}
            onOpen={() => onOpen(project)}
            onSpotlight={spotlight}
            eager={index < eagerCount}
            still={still}
          />
        ))}
      </div>
    </div>
  );
}
