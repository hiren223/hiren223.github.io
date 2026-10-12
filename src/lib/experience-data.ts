/**
 * Career facts — the single source for the About copy, the
 * Education block and the Experience timeline.
 *
 * Nothing here is invented. Every role, company, date, degree and
 * credential is content that already ships in the portfolio; the
 * `description` only restates facts that appear elsewhere in this
 * same file.
 *
 * `experiences` is PROFESSIONAL experience only. `timeline` is the
 * journey the Experience section renders: the degree first, then
 * the role. Both share one centre line, and which side an entry
 * lands on is not stored — the timeline alternates by index, so
 * adding a future role needs no change anywhere else.
 */

export type TimelineEntry = {
  id: string;
  /** Milestone label, numbered from the entry's position. */
  category: "Education" | "Experience";
  /** Left of the centre line. */
  year: string;
  /** The headline: a degree, or a job title. */
  headline: string;
  /** University, or company. */
  org: string;
  /** Exact dates and length, on a role. */
  meta?: string;
  description: string;
  /** Bullets, on a role. */
  points?: string[];
  /** A link, on the degree's final-year project. */
  link?: { label: string; to: string };
};

/** Professional experience only. */
export const experiences: TimelineEntry[] = [
  {
    id: "rubixe",
    category: "Experience",
    year: "2025 — 2026",
    headline: "Data Science Consultant Intern",
    org: "Rubixe",
    meta: "Aug 2025 — Feb 2026 · 6 months",
    description:
      "Six months across proof-of-concept and client engagements, covering data preparation, feature engineering, model building and evaluation.",
    points: [
      "Worked across proof-of-concept and client engagements.",
      "Cleaned data and engineered features.",
      "Built and evaluated classification and regression models.",
      "Delivered the Customer Churn client project.",
      "Completed capstones on loan default, insurance claims, vaccine prediction and COVID-19 forecasting.",
    ],
  },
];

/** Milestone 01 — the academic foundation. */
export const education: TimelineEntry = {
  id: "bca",
  category: "Education",
  year: "2022 — 2025",
  headline: "BCA — Bachelor of Computer Applications",
  org: "Silver Oak University, Ahmedabad",
  description:
    "A foundation in web development — HTML, CSS, JavaScript, PHP, MySQL and Bootstrap — finished with a four-person final-year project: Krushi Manch.",
  link: { label: "Krushi Manch", to: "/projects" },
};

/**
 * The journey timeline: academic foundations first, then the
 * professional work that followed. Both share one centre line, and
 * the side of each entry is decided by its index — 01 left,
 * 02 right, 03 left — so a future role needs no other change.
 */
export const timeline: TimelineEntry[] = [education, ...experiences];

/**
 * The credentials. `issuer` is the short label the Certifications ledger
 * sets in uppercase — it is required because `org` is sometimes the full
 * legal name ("IABAC — International Association of Business Analytics
 * Certification"), which is far too long to track at 11px. `org` keeps the
 * full descriptor; nothing here is new information, only the short form of
 * the name the issuer already appears under.
 */
export const certifications = [
  {
    name: "Certified Data Scientist",
    org: "NASSCOM FutureSkills Prime",
    issuer: "NASSCOM FutureSkills Prime",
    detail: "Ministry of Electronics & IT, Government of India",
    result: "Gold · 95%",
    score: "95%",
    award: "NASSCOM Gold",
    meta: "14 June 2026 · FSP/2026/6/10294219",
    featured: true,
  },
  {
    name: "Data Science Foundation",
    org: "IABAC — International Association of Business Analytics Certification",
    issuer: "IABAC",
    detail: "Foundation credential in business analytics",
    result: "Certified",
    score: "",
    award: "",
    meta: "04 June 2026 · IAB1120179119",
    featured: false,
  },
  {
    name: "Data Analytics",
    org: "Deloitte Data Analytics Job Simulation",
    issuer: "Deloitte",
    detail: "Applied analytics job simulation",
    result: "Completed",
    score: "",
    award: "",
    meta: "09 July 2026",
    featured: false,
  },
];

/** Small editorial keyword row under the About copy. */
export const keywords = [
  "Data Analysis",
  "Machine Learning",
  "Feature Engineering",
  "Model Building",
  "Data Visualization",
];
