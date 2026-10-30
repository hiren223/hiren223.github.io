import { coverSrc } from "@/lib/project-media";
import type { PortfolioProject } from "@/lib/sample-projects";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Github, Sparkles } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import "./project-index.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pad = (n: number) => String(n).padStart(2, "0");

const CATEGORIES = [
  "All",
  "Machine Learning",
  "Data Analytics",
  "Full Stack",
] as const;

function matchCategory(project: PortfolioProject, category: string): boolean {
  if (category === "All") return true;
  if (category === "Machine Learning") {
    return project.tags.some((t) =>
      ["Classification", "Regression", "XGBoost", "Scikit-learn", "SMOTE"].includes(t)
    );
  }
  if (category === "Data Analytics") {
    return (
      project.tags.some((t) =>
        ["Power BI", "SQL", "Time Series", "EDA", "Data Cleaning"].includes(t)
      ) || project.title.includes("Dashboard") || project.title.includes("Forecasting")
    );
  }
  if (category === "Full Stack") {
    return project.tags.some((t) =>
      ["PHP", "MySQL", "JavaScript", "HTML", "CSS", "Bootstrap"].includes(t)
    );
  }
  return true;
}

/* ------------------------------------------------------------------- Project Card */

type CardProps = {
  project: PortfolioProject;
  index: number;
  active: boolean;
  onOpen: () => void;
  onSpotlight: (id: string | null) => void;
  eager: boolean;
  still: boolean;
};

function ProjectCard({
  project,
  index,
  active,
  onOpen,
  onSpotlight,
  eager,
  still,
}: CardProps) {
  const number = pad(index + 1);
  const cardId = `project-${number}`;
  const isFullWidth = project.id.includes("smart-agriculture");

  return (
    <motion.article
      className={`pj-card ${isFullWidth ? "pj-card--full" : ""}`}
      id={cardId}
      data-active={active}
      tabIndex={0}
      role="article"
      aria-labelledby={`${cardId}-title`}
      onPointerEnter={() => onSpotlight(project.id)}
      onPointerLeave={() => onSpotlight(null)}
      onFocus={() => onSpotlight(project.id)}
      onBlur={() => onSpotlight(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if ((e.target as HTMLElement).tagName !== "A" && (e.target as HTMLElement).tagName !== "BUTTON") {
            e.preventDefault();
            onOpen();
          }
        }
      }}
      initial={still ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: still ? 0.35 : 0.55,
        ease: EASE,
        delay: Math.min(index * 0.08, 0.32),
      }}
    >
      {/* Visual stage / image container */}
      <div
        className="pj-card__media-stage"
        onClick={onOpen}
        role="button"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={coverSrc(project.image)}
          alt={`${project.title} overview preview`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="pj-card__image"
        />

        {/* Scrim gradient overlay with hover prompt */}
        <div className="pj-card__scrim" />

        {/* Top badges floating over image */}
        <div className="pj-card__media-header">
          <span className="pj-card__index-badge">
            <span className="pj-card__index-dot" />
            {number} / {project.year}
          </span>
          <span className="pj-card__client-badge">{project.client}</span>
        </div>

        {/* Interactive hover pill */}
        <div className="pj-card__hover-indicator">
          <span>Explore case study</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </div>
      </div>

      {/* Structured Card Content */}
      <div className="pj-card__body">
        {/* Eyebrow & Role */}
        <div className="pj-card__eyebrow-row">
          <span className="pj-card__role">{project.role}</span>
          {isFullWidth ? (
            <span className="pj-card__personal-tag">
              <Sparkles className="size-3" aria-hidden="true" />
              Personal Project · Flagship
            </span>
          ) : project.featured ? (
            <span className="pj-card__featured-tag">
              <Sparkles className="size-3" aria-hidden="true" />
              Featured
            </span>
          ) : null}
        </div>

        {/* Project Title */}
        <h3 id={`${cardId}-title`} className="pj-card__title">
          <button
            type="button"
            className="pj-card__title-btn"
            onClick={onOpen}
            aria-label={`View ${project.title} case study`}
          >
            {project.title}
          </button>
        </h3>

        {/* Concise Project Summary */}
        <p className="pj-card__summary">{project.summary}</p>

        {/* Data Highlights Metrics Grid (Real metrics from the project) */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="pj-card__stats-grid">
            {project.highlights.slice(0, 3).map((highlight) => (
              <div key={highlight.label} className="pj-card__stat-item">
                <span className="pj-card__stat-val">{highlight.value}</span>
                <span className="pj-card__stat-label">{highlight.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Technology Pills */}
        <div className="pj-card__tags-wrap" aria-label="Technologies used">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="pj-card__tag">
              {tag}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="pj-card__tag pj-card__tag--more">
              +{project.tags.length - 4}
            </span>
          )}
        </div>

        {/* Action Button Bar */}
        <div className="pj-card__actions">
          <button
            type="button"
            className="pj-btn pj-btn--primary"
            onClick={onOpen}
            aria-label={`Open case study for ${project.title}`}
          >
            <span>Case Study</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </button>

          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pj-btn pj-btn--secondary"
              aria-label={`View GitHub repository for ${project.title} (opens in new tab)`}
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="size-3.5" aria-hidden="true" />
              <span>GitHub</span>
            </a>
          )}

          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pj-btn pj-btn--secondary"
              aria-label={`Visit live site for ${project.title} (opens in new tab)`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span>Live Site</span>
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------- Main Project Index */

export function ProjectIndex({
  projects,
  eagerCount = 0,
  onOpen,
  activeId,
  onActiveIdChange,
  showFilters = false,
}: {
  projects: PortfolioProject[];
  eagerCount?: number;
  onOpen: (project: PortfolioProject) => void;
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
  showFilters?: boolean;
}) {
  const still = Boolean(useReducedMotion());
  const [internalActive, setInternalActive] = useState<string | null>(null);
  const active = activeId === undefined ? internalActive : activeId;
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const filterListId = useId();

  const spotlight = useCallback(
    (id: string | null) => {
      if (activeId === undefined) setInternalActive(id);
      onActiveIdChange?.(id);
    },
    [activeId, onActiveIdChange],
  );

  /* Filter projects by category */
  const visibleProjects = useMemo(() => {
    return projects.filter((p) => matchCategory(p, activeCategory));
  }, [projects, activeCategory]);

  /* Determine if filters should be shown (always on full projects page, or when requested) */
  const shouldRenderFilters = showFilters || projects.length > 3;

  return (
    <section className="pj-section" aria-label="Projects showcase">
      {/* Category Filter Pills (displayed when multiple project disciplines are present) */}
      {shouldRenderFilters && (
        <nav
          className="pj-filters"
          aria-label="Filter projects by discipline"
          role="tablist"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            const count =
              cat === "All"
                ? projects.length
                : projects.filter((p) => matchCategory(p, cat)).length;

            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={filterListId}
                className={`pj-filter-btn ${isSelected ? "pj-filter-btn--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
                <span className="pj-filter-count">{count}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Responsive Gallery Grid */}
      <div
        id={filterListId}
        className={`pj-grid ${projects.length <= 2 ? "pj-grid--featured" : ""}`}
        role="region"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {visibleProjects.map((project, index) => (
            <ProjectCard
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
        </AnimatePresence>

        {visibleProjects.length === 0 && (
          <div className="pj-empty-state">
            <p>No projects found in this category.</p>
            <button
              type="button"
              className="pj-btn pj-btn--secondary"
              onClick={() => setActiveCategory("All")}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
