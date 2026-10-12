/**
 * ProjectsPage — the complete project archive at /projects.
 *
 * Reads the curated local project data shared with the homepage, so there
 * is exactly one source of truth
 * and no project information is duplicated here. The layout is the same
 * editorial index the homepage uses: seven rows of type and hairlines,
 * not a grid of cards. The homepage links here with a router <Link>, so
 * navigation stays in the same tab.
 */
import { ProjectDialog } from "@/components/portfolio/ProjectDialog";
import { ProjectIndex } from "@/components/portfolio/ProjectIndex";
import { SiteHeader, type HeaderLink } from "@/components/portfolio/SiteHeader";
import {
  publicProjects,
  type PortfolioProject,
} from "@/lib/sample-projects";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import "./projects.css";

/** Same four destinations as the homepage navbar, expressed as routes. */
const HEADER_LINKS: HeaderLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/#contact" },
];

const PROJECTS_INDEX = HEADER_LINKS.findIndex(
  (link) => link.href === "/projects",
);

const CONTACT_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hiren-keraliya-440700259/" },
  { label: "GitHub", href: "https://github.com/hiren223" },
  { label: "Email", href: "mailto:hirenkeraliya99@gmail.com" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function ProjectsPage() {
  const [active, setActive] = useState<PortfolioProject | null>(null);
  /* Which row the folio is pointing at — drives the row highlight and the
     preview from either the folio or the row itself. */
  const [spotlight, setSpotlight] = useState<string | null>(null);

  /* One list, sorted once, shared with the homepage. */
  const projects = useMemo<PortfolioProject[]>(() => publicProjects(undefined), []);

  return (
    <div className="projects-page">
      {/* No hero on this page — and the navbar no longer needs one: it is
          the same transparent, scroll-invariant look as the landing page. */}
      <SiteHeader links={HEADER_LINKS} activeIndex={PROJECTS_INDEX} />

      <main className="projects-page__inner">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="projects-page__label">
            Archive / {pad(projects.length)}
          </span>
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__lede">
            Selected work across data science, machine learning, analytics
            and web development.
          </p>
        </motion.header>

        {/* Folio: each number jumps to its row, names it on hover, and
            spotlights it so the row highlights and the preview appears. */}
        <nav className="projects-page__folio" aria-label="Project index">
          {projects.map((project, index) => (
            <a
              key={project.id}
              href={`#project-${pad(index + 1)}`}
              className="projects-page__folio-link"
              onPointerEnter={() => setSpotlight(project.id)}
              onPointerLeave={() => setSpotlight(null)}
              onFocus={() => setSpotlight(project.id)}
              onBlur={() => setSpotlight(null)}
            >
              <span className="projects-page__folio-no">{pad(index + 1)}</span>
              <span className="projects-page__folio-title">
                {project.title}
              </span>
            </a>
          ))}
          <span className="projects-page__count">
            {pad(projects.length)} projects
          </span>
        </nav>

        <div className="projects-page__index">
          <ProjectIndex
            projects={projects}
            eagerCount={1}
            onOpen={setActive}
            activeId={spotlight}
            onActiveIdChange={setSpotlight}
          />
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <span className="site-footer__brand">HIREN KERALIYA</span>
          <nav className="site-footer__links" aria-label="Footer">
            {CONTACT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}
            <Link to="/">Home</Link>
          </nav>
        </div>
        <p className="site-footer__bottom">
          © 2026 Hiren Keraliya. All rights reserved.
        </p>
      </footer>

      <ProjectDialog project={active} onClose={() => setActive(null)} />
    </div>
  );
}
