/**
 * The technology field — one data source for the interactive skills canvas.
 *
 * Every mark is an independent object on the page: no cards, no boxes, no
 * percentages — and every one is real brand artwork. Two sources, both SVG:
 *  - `mark(slug, hex)` -> cdn.simpleicons.org, the hex baked into the fill so
 *               a single request serves both the muted default state (the
 *               component desaturates it with a CSS filter) and the hover
 *               state (the filter is removed and the brand colour shows).
 *  - `/skills/*.svg` -> the official artwork, copied in for the handful Simple
 *               Icons does not carry: Matplotlib, Seaborn, Power BI, VS Code
 *               and Tableau (whose slug now 404s on the CDN).
 *
 * A few brands ship a near-black mark (Pandas #150458, NumPy #013243, GitHub
 * #181717). Those hexes disappear on the charcoal section, so the CDN request
 * is tinted to a lighter member of the same hue instead — the silhouette is
 * identical, and the brand still reads as itself on hover.
 *
 * The marks are decorative and the technology name sits directly beneath each
 * one, so a failed CDN request must never leave a broken-image glyph sitting
 * in the field. SkillField hides an <img> that errors; the name carries it.
 */

export type SkillCategoryId =
  | "programming"
  | "data-science"
  | "analytics"
  | "web"
  | "database"
  | "tools";

/** Typographic weight of the name, not a level indicator. */
export type SkillSize = "large" | "medium" | "small";

export type SkillCategory = {
  id: SkillCategoryId;
  /** Two-digit editorial index, e.g. "01". */
  index: string;
  label: string;
  /** Anchor of the small category label on the desktop canvas, in percent. */
  at: { x: number; y: number };
};

export type Skill = {
  /** Stable key — the connection lines address skills by id. */
  id: string;
  name: string;
  category: SkillCategoryId;
  logo: string;
  size: SkillSize;
  /** Pointer-parallax travel in px, 6–15. */
  depth: number;
  /**
   * "black" for the brands whose mark is genuinely black. On a dark
   * ground the stylesheet inverts it rather than recolouring the asset,
   * so the artwork stays the real thing.
   */
  tone?: "black";
  /** Centre of the mark on the desktop canvas, in percent of the canvas box. */
  x: number;
  y: number;
};

const mark = (slug: string, hex: string) =>
  `https://cdn.simpleicons.org/${slug}/${hex}`;

export const SKILL_CATEGORIES: SkillCategory[] = [
  { id: "programming", index: "01", label: "Programming", at: { x: 6, y: 3 } },
  { id: "data-science", index: "02", label: "Data Science", at: { x: 42, y: 3 } },
  { id: "analytics", index: "03", label: "Analytics", at: { x: 78, y: 3 } },
  { id: "web", index: "04", label: "Web", at: { x: 6, y: 48 } },
  { id: "database", index: "05", label: "Database", at: { x: 46, y: 48 } },
  { id: "tools", index: "06", label: "Tools", at: { x: 68, y: 48 } },
];

export const CATEGORY_LABEL: Record<SkillCategoryId, string> =
  Object.fromEntries(
    SKILL_CATEGORIES.map((c) => [c.id, `${c.index} / ${c.label}`]),
  ) as Record<SkillCategoryId, string>;

/**
 * The composition is hand-placed, not scattered: each cluster sits inside the
 * region its category label heads, and the sizes carry the visual rhythm.
 */
export const SKILLS: Skill[] = [
  /* 01 · PROGRAMMING */
  {
    id: "python",
    name: "Python",
    category: "programming",
    logo: mark("python", "3776AB"),
    size: "large",
    depth: 14,
    x: 16,
    y: 19,
  },
  {
    id: "sql",
    name: "SQL",
    category: "programming",
    logo: mark("postgresql", "4169E1"),
    size: "medium",
    depth: 7,
    x: 35,
    y: 13,
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "programming",
    logo: mark("javascript", "F7DF1E"),
    size: "large",
    depth: 12,
    x: 14,
    y: 40,
  },

  /* 02 · DATA SCIENCE */
  {
    id: "numpy",
    name: "NumPy",
    category: "data-science",
    logo: mark("numpy", "3E8FA6"),
    size: "medium",
    depth: 9,
    x: 49,
    y: 18,
  },
  {
    id: "pandas",
    name: "Pandas",
    category: "data-science",
    logo: mark("pandas", "6F52C8"),
    size: "medium",
    depth: 12,
    x: 64,
    y: 12,
  },
  {
    id: "scikit-learn",
    name: "Scikit-learn",
    category: "data-science",
    logo: mark("scikitlearn", "F7931E"),
    size: "large",
    depth: 15,
    x: 56,
    y: 32,
  },

  /* 03 · ANALYTICS */
  {
    id: "power-bi",
    name: "Power BI",
    category: "analytics",
    logo: "/skills/power-bi.svg",
    size: "medium",
    depth: 11,
    x: 84,
    y: 16,
  },
  {
    id: "tableau",
    name: "Tableau",
    category: "analytics",
    logo: "/skills/tableau.svg",
    size: "medium",
    depth: 8,
    x: 94,
    y: 25,
  },
  {
    id: "matplotlib",
    name: "Matplotlib",
    category: "analytics",
    logo: "/skills/matplotlib.svg",
    size: "small",
    depth: 6,
    x: 81,
    y: 30,
  },
  {
    id: "seaborn",
    name: "Seaborn",
    category: "analytics",
    logo: "/skills/seaborn.svg",
    size: "small",
    depth: 6,
    x: 93,
    y: 35,
  },

  /* 04 · WEB */
  {
    id: "html",
    name: "HTML",
    category: "web",
    logo: mark("html5", "E34F26"),
    size: "medium",
    depth: 8,
    x: 32,
    y: 54,
  },
  {
    id: "css",
    name: "CSS",
    category: "web",
    logo: mark("css", "1572B6"),
    size: "small",
    depth: 6,
    x: 25,
    y: 66,
  },
  {
    id: "php",
    name: "PHP",
    category: "web",
    logo: mark("php", "8F94D6"),
    size: "medium",
    depth: 9,
    x: 11,
    y: 72,
  },
  {
    id: "bootstrap",
    name: "Bootstrap",
    category: "web",
    logo: mark("bootstrap", "7952B3"),
    size: "small",
    depth: 6,
    x: 13,
    y: 87,
  },

  /* 05 · DATABASE */
  {
    id: "mysql",
    name: "MySQL",
    category: "database",
    logo: mark("mysql", "4479A1"),
    size: "medium",
    depth: 10,
    x: 53,
    y: 60,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "database",
    logo: mark("mongodb", "47A248"),
    size: "medium",
    depth: 9,
    x: 41,
    y: 72,
  },

  /* 06 · TOOLS */
  {
    id: "git",
    name: "Git",
    category: "tools",
    logo: mark("git", "F05032"),
    size: "small",
    depth: 7,
    x: 73,
    y: 60,
  },
  {
    id: "github",
    name: "GitHub",
    category: "tools",
    /* The real GitHub mark, in the real GitHub black. Nothing tinted.
       `tone` tells the stylesheet to invert it on dark grounds, which is
       how GitHub renders its own mark there. */
    logo: mark("github", "181717"),
    tone: "black",
    size: "medium",
    depth: 12,
    x: 87,
    y: 55,
  },
  {
    id: "vscode",
    name: "VS Code",
    category: "tools",
    logo: "/skills/vs-code.svg",
    size: "medium",
    depth: 8,
    x: 70,
    y: 72,
  },
  {
    id: "jupyter",
    name: "Jupyter",
    category: "tools",
    logo: mark("jupyter", "F37726"),
    size: "small",
    depth: 7,
    x: 85,
    y: 68,
  },
  {
    id: "anaconda",
    name: "Anaconda",
    category: "tools",
    logo: mark("anaconda", "44A833"),
    size: "medium",
    depth: 10,
    x: 74,
    y: 85,
  },
];

/** Thin editorial connectors, addressed by skill id. */
export const SKILL_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["python", "javascript"],
  ["python", "pandas"],
  ["pandas", "numpy"],
  ["numpy", "scikit-learn"],
  ["scikit-learn", "matplotlib"],
  ["python", "matplotlib"],
  ["sql", "mysql"],
  ["power-bi", "tableau"],
  ["tableau", "matplotlib"],
  ["tableau", "seaborn"],
  ["html", "css"],
  ["css", "bootstrap"],
  ["mysql", "mongodb"],
  ["git", "github"],
  ["git", "jupyter"],
  ["github", "vscode"],
];

/**
 * A handful of lines carry one slow dot, for the data-flow reading. Kept to
 * seven so the field stays an editorial diagram rather than a particle system.
 */
export const SKILL_FLOW: ReadonlyArray<{
  from: string;
  to: string;
  /** Seconds for one end-to-end pass, and the delay before the first pass. */
  duration: number;
  delay: number;
}> = [
  { from: "python", to: "pandas", duration: 21, delay: 0 },
  { from: "pandas", to: "numpy", duration: 17, delay: -4 },
  { from: "numpy", to: "scikit-learn", duration: 19, delay: -9 },
  { from: "sql", to: "mysql", duration: 16, delay: -11 },
  { from: "power-bi", to: "tableau", duration: 18, delay: -3 },
  { from: "tableau", to: "seaborn", duration: 22, delay: -14 },
  { from: "git", to: "github", duration: 15, delay: -8 },
];

export function skillsByCategory(id: SkillCategoryId): Skill[] {
  return SKILLS.filter((skill) => skill.category === id);
}
