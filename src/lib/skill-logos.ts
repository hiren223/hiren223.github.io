/**
 * Skill marks for the circular gallery.
 *
 * One entry per skill already listed in the portfolio's skill groups, in the
 * same order, so the gallery and the copy can never disagree about what the
 * toolkit is.
 *
 * Two sources, both transparent-background SVG:
 *  - `slug`  -> cdn.simpleicons.org (CC0-1.0), brand colour baked into the
 *               fill, for the tools that ship an official mark.
 *  - `local` -> a file in /public/skills, for the handful that Simple Icons
 *               does not carry (Matplotlib, Seaborn, Power BI, VS Code,
 *               Tableau — whose slug now 404s on the CDN).
 */
export type SkillMark = {
  /** Skill name — also the label drawn under each card. */
  name: string;
  /** Simple Icons slug, when the tool has an official mark. */
  slug?: string;
  /** Path under /public, when it does not. */
  local?: string;
  /** Brand hex, without the leading '#'. Used by the CDN URL. */
  color?: string;
};

export const SKILL_MARKS: SkillMark[] = [
  /* Languages & ML */
  { name: "Python", slug: "python", color: "3776AB" },
  { name: "SQL", slug: "postgresql", color: "4169E1" },
  { name: "Pandas", slug: "pandas", color: "150458" },
  { name: "Scikit-learn", slug: "scikitlearn", color: "F7931E" },
  { name: "NumPy", slug: "numpy", color: "013243" },

  /* Visualization */
  { name: "Matplotlib", local: "/skills/matplotlib.svg" },
  { name: "Seaborn", local: "/skills/seaborn.svg" },
  { name: "Power BI", local: "/skills/power-bi.svg" },
  { name: "Tableau", local: "/skills/tableau.svg" },

  /* Web development */
  { name: "HTML", slug: "html5", color: "E34F26" },
  { name: "CSS", slug: "css", color: "1572B6" },
  { name: "PHP", slug: "php", color: "777BB4" },
  { name: "Bootstrap", slug: "bootstrap", color: "7952B3" },
  { name: "JavaScript", slug: "javascript", color: "F7DF1E" },

  /* Tools */
  { name: "Jupyter", slug: "jupyter", color: "F37726" },
  { name: "VS Code", local: "/skills/vs-code.svg" },
  { name: "Git", slug: "git", color: "F05032" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "MySQL", slug: "mysql", color: "4479A1" },
];

/** A single mark's URL, ready for an <img src>. */
export function skillMarkUrl(mark: SkillMark): string {
  if (mark.local) return mark.local;
  return `https://cdn.simpleicons.org/${mark.slug}/${mark.color}`;
}