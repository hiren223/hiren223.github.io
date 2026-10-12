import { AboutSection } from "@/components/portfolio/AboutSection";
import { CertificationsSection } from "@/components/portfolio/CertificationsSection";
import { ContactSection } from "@/components/portfolio/ContactSection";
import { ExperienceSection } from "@/components/portfolio/ExperienceSection";
import { HeroSection } from "@/components/portfolio/HeroSection";
import { ProjectDialog } from "@/components/portfolio/ProjectDialog";
import { ProjectIndex } from "@/components/portfolio/ProjectIndex";
import { SiteHeader } from "@/components/portfolio/SiteHeader";
import { SkillField } from "@/components/portfolio/SkillField";
import {
  featuredProjects,
  publicProjects,
  type PortfolioProject,
} from "@/lib/sample-projects";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Github,
  Linkedin,
  Mail,
  Phone,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Projects", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

/**
 * Section ids in DOCUMENT order — drives the active-link highlight. Kept
 * separate from NAV_LINKS because the scroll spy must walk the page top to
 * bottom regardless of the editorial nav order.
 */
const SECTION_IDS = ["top", "work", "about", "experience", "contact"] as const;

const EMAIL = "hirenkeraliya99@gmail.com";

/**
 * The CV is a plain static file: it lives in `public/` and the browser's
 * own download affordance does the rest. `download` keeps it a file
 * instead of a navigation, so a visitor never leaves the page.
 */
const CV_HREF = "/hiren-keraliya-cv.pdf";

/**
 * CONTACTS stays the single source of truth for the footer's icon row:
 * this only says which of those entries deserve a glyph. Nothing about
 * a link — label, href, or whether it is external — is restated here.
 */
const SOCIAL_ICONS = {
  LinkedIn: Linkedin,
  GitHub: Github,
  Email: Mail,
  Phone: Phone,
} as const;

type SocialLabel = keyof typeof SOCIAL_ICONS;

const CONTACTS = [
  {
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  { label: "Phone", value: "+91 63531 93330", href: "tel:+916353193330" },
  {
    label: "LinkedIn",
    value: "hirenkeraliya",
    href: "https://www.linkedin.com/in/hirenkeraliya/",
  },
  { label: "GitHub", value: "hiren223", href: "https://github.com/hiren223" },
  { label: "Location", value: "Ahmedabad, India", href: null },
  { label: "Status", value: "Open to opportunities", href: null },
];

/** Which of the above earn a glyph in the footer's icon row. */
const footerSocials = CONTACTS.flatMap((contact) =>
  contact.href && contact.label in SOCIAL_ICONS
    ? [{ label: contact.label as SocialLabel, href: contact.href }]
    : [],
);

/** Scroll-triggered entrance used across every section. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-display text-sm text-clay">{index}</span>
      <span className="h-px w-10 bg-border" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function Landing() {
  /* Scroll-spy target — the navbar itself now lives in SiteHeader. */
  const [active, setActive] = useState<string>(SECTION_IDS[0]);

  /* Which case study the editorial index has open. */
  const [caseStudy, setCaseStudy] = useState<PortfolioProject | null>(null);

  /* Footer: the copy button flips to a check for two seconds. If the
     Clipboard API is unavailable (non-secure context), fall back to
     opening the mail composer rather than failing silently. */
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let frame = 0;

    /* Active section only. The transparent/cream navbar state is driven by
       the hero observer below, so this handler never measures the hero. */
    const update = () => {
      frame = 0;

      /* Active = the section whose top has passed just below the fixed
         header and is the lowest one to do so; pinned to the last section
         at the page bottom. */
      const line = window.scrollY + 140;
      let current: string = SECTION_IDS[0];
      let lowest = -Infinity;
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line && top > lowest) {
          lowest = top;
          current = id;
        }
      }
      if (
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight - 2
      ) {
        current = SECTION_IDS[SECTION_IDS.length - 1];
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Scroll-spy section id -> index in the nav, for the pill nav. */
  const activeIndex = Math.max(
    0,
    NAV_LINKS.findIndex((link) => link.href.slice(1) === active),
  );

  const projects = useMemo(() => publicProjects(undefined), []);

  /* Homepage shows only the two featured projects; /projects has the rest. */
  const featured = useMemo(() => featuredProjects(projects), [projects]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar — shared with /projects so the two can never drift. One
          transparent, scroll-invariant look on both routes: no fill, no
          variant. */}
      <SiteHeader links={NAV_LINKS} activeIndex={activeIndex} />

      <main id="top">
        <HeroSection />

        {/* Selected work — two featured projects; the full set lives at
            /projects, reached with the router link below. */}
        <section id="work" className="page-container section-pad scroll-mt-20">
          <Reveal className="flex flex-col gap-6 pb-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-6">
              <SectionLabel index="01" label="Selected work" />
              <h2 className="max-w-5xl text-balance font-display text-[clamp(40px,5vw,68px)] leading-[1.02]">
                Two featured projects, each with the numbers behind it.
              </h2>
            </div>
          </Reveal>

          <ProjectIndex
            projects={featured}
            eagerCount={2}
            onOpen={setCaseStudy}
          />

          <div className="relative z-10 flex justify-center pt-14">
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 text-xs tracking-[0.12em] text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
            >
              View all projects
              <ArrowUpRight className="size-3.5 text-clay transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>

        {/* Skills — the networked technology field on the sand band. */}
        <section
          id="skills"
          className="scroll-mt-20 border-y border-border bg-sand"
        >
          <div className="page-container section-pad">
            <Reveal className="flex flex-col gap-8 pb-14 sm:pb-20">
              <div className="flex flex-col gap-5">
                <SectionLabel index="02" label="Skills" />
                <h2 className="max-w-5xl text-balance font-display text-[clamp(40px,5vw,68px)] leading-[1.02]">
                  Technologies I use to build, analyze and ship data-driven
                  solutions.
                </h2>
              </div>
            </Reveal>

            <SkillField />
          </div>
        </section>

        {/* About — who he is and what he studies. No work experience. */}
        <section
          id="about"
          className="page-container section-pad scroll-mt-20"
        >
          <AboutSection />
        </section>

        {/* Experience — its own band, well clear of About. Wider than
            the other sections so the centre line has room. */}
        <section
          id="experience"
          className="scroll-mt-20"
        >
          <ExperienceSection />
        </section>

        {/* Certifications — separate again, never inside the timeline. */}
        <section
          id="certifications"
          className="scroll-mt-20 border-y border-border bg-sand"
        >
          <div className="page-container section-pad">
            <CertificationsSection />
          </div>
        </section>

        {/* Contact — the closing statement. The composition itself now
            lives in ContactSection (contact.css): the invitation in the
            left column, the directory in the right. CONTACTS stays the
            single source of truth — it is the same array the footer's icon
            row is derived from, so the two can never disagree. */}
        <section id="contact" className="scroll-mt-20">
          <div className="page-container section-pad">
            <ContactSection contacts={CONTACTS} email={EMAIL} />
          </div>

          <footer className="border-t border-border">
            <div className="page-container">
              {/* Row 1 — the sign-off. Identity and status on the left;
                  the three things a visitor can actually do on the right. */}
              <Reveal className="flex flex-col gap-10 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-16">
                <div>
                  <p className="font-display text-[clamp(28px,3.2vw,40px)] leading-none tracking-[-0.015em]">
                    Hiren Keraliya
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Data Scientist &amp; Full Stack Developer
                  </p>

                  {/* Availability. The outer ring breathes so the footer
                      reads as a live endpoint rather than a dead end. */}
                  <p className="mt-5 inline-flex items-center gap-2.5 border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="relative flex size-2" aria-hidden="true">
                      <span className="absolute size-full animate-ping rounded-full bg-clay opacity-70" />
                      <span className="relative size-2 rounded-full bg-clay" />
                    </span>
                    Open to opportunities
                  </p>
                </div>

                <div className="flex flex-col items-start gap-7 sm:items-end">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={CV_HREF}
                      download
                      aria-label="Download Hiren Keraliya's CV (PDF)"
                      className="group inline-flex items-center gap-2.5 bg-foreground px-6 py-3.5 text-xs tracking-[0.06em] text-background transition-colors duration-300 hover:bg-clay-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      Download CV
                      <Download
                        aria-hidden="true"
                        className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                      />
                    </a>

                    <button
                      type="button"
                      onClick={copyEmail}
                      className="group inline-flex items-center gap-2.5 border border-border px-6 py-3.5 text-xs tracking-[0.06em] transition-colors duration-300 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      {copied ? (
                        <Check
                          aria-hidden="true"
                          className="size-4 text-clay"
                        />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                      {copied ? "Copied" : "Copy email"}
                    </button>
                  </div>

                  {/* Icon links. The glyph never works alone: each anchor
                      carries the label as its accessible name and repeats
                      it as a tooltip on hover and on keyboard focus. */}
                  <ul className="flex flex-wrap items-center gap-2.5">
                    {footerSocials.map(({ label, href }) => {
                      const Icon = SOCIAL_ICONS[label];
                      const external = href.startsWith("http");
                      return (
                        <li key={label}>
                          <a
                            href={href}
                            aria-label={label}
                            target={external ? "_blank" : undefined}
                            rel={
                              external ? "noopener noreferrer" : undefined
                            }
                            className="group relative inline-flex size-11 items-center justify-center border border-border text-muted-foreground transition duration-300 hover:-translate-y-1 hover:border-clay hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                          >
                            <Icon aria-hidden="true" className="size-4" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-foreground px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
                              {label}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>

              {/* Row 2 — the utility strip. */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-5 text-xs tracking-[0.08em] text-muted-foreground">
                <span>© 2026 Hiren Keraliya</span>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={backToTop}
                    className="group inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  >
                    <ArrowUp
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                    />
                    Back to top
                  </button>
                  <Link
                    to="/auth"
                    className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  >
                    Studio
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </section>
      </main>

      {/* Case study, opened from any row in the index above. */}
      <ProjectDialog project={caseStudy} onClose={() => setCaseStudy(null)} />
    </div>
  );
}
