export type ProjectHighlight = {
  label: string;
  value: string;
};

export type PortfolioProject = {
  id: string;
  title: string;
  role: string;
  client: string;
  year: string;
  summary: string;
  description: string;
  tags: string[];
  highlights: ProjectHighlight[];
  /** Cover art in /public/projects — swap for a real screenshot any time. */
  image: string;
  url?: string;
  repoUrl?: string;
  featured: boolean;
  order: number;
};

/**
 * Cover art per project. Keyed by title so a project created in the studio
 * (which has no image field yet) still resolves to the right artwork.
 */
const IMAGE_BY_TITLE: Record<string, string> = {
  "Krushi Manch": "/projects/krushi-manch.svg",
  "Customer Churn Prediction": "/projects/customer-churn.svg",
  "Home Loan Default Prediction": "/projects/home-loan-default.svg",
  "Insurance Claim Prediction": "/projects/insurance-claim.svg",
  "Vaccine Prediction": "/projects/vaccine-prediction.svg",
  "COVID-19 Forecasting": "/projects/covid-forecasting.svg",
  "Smart Agriculture Analytics Dashboard": "/projects/smart-agriculture.svg",
};

const FALLBACK_IMAGE = "/projects/cover-fallback.svg";

/** Single source of truth for a project's cover image. */
export function imageForProject(project: {
  title: string;
  image?: string;
}): string {
  return project.image || IMAGE_BY_TITLE[project.title] || FALLBACK_IMAGE;
}

/**
 * The two projects the homepage previews, in display order. Keyed by title
 * so the pair is stable whether the list came from the studio or the seed.
 */
export const FEATURED_TITLES = [
  "Krushi Manch",
  "Customer Churn Prediction",
] as const;

/** Order by the curated sequence, then by any project added in the studio. */
export function sortProjects(list: PortfolioProject[]): PortfolioProject[] {
  const rank = new Map(SAMPLE_PROJECTS.map((p, i) => [p.title, i]));
  return [...list].sort((a, b) => {
    const ra = rank.get(a.title);
    const rb = rank.get(b.title);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.order - b.order;
  });
}

/** Just the homepage pair. */
export function featuredProjects(
  list: PortfolioProject[],
): PortfolioProject[] {
  return FEATURED_TITLES.map(
    (title) => list.find((project) => project.title === title),
  ).filter((project): project is PortfolioProject => project !== undefined);
}

/**
 * Public gallery list: studio projects plus any curated project the studio
 * has not published yet, so /projects always shows the full portfolio.
 */
export function publicProjects(
  fromStudio: PortfolioProject[] | undefined,
): PortfolioProject[] {
  if (!fromStudio || fromStudio.length === 0) return sortProjects(SAMPLE_PROJECTS);

  const titles = new Set(fromStudio.map((project) => project.title));
  return sortProjects([
    ...fromStudio,
    ...SAMPLE_PROJECTS.filter((project) => !titles.has(project.title)),
  ]);
}

/**
 * Hiren Keraliya's showcase. Used to seed the studio and as the public
 * fallback so the portfolio always reads as a finished gallery, even before
 * a project is published from the studio.
 */
export const SAMPLE_PROJECTS: PortfolioProject[] = [
  {
    id: "krushi-manch",
    title: "Krushi Manch",
    role: "Co-developer · 4-person team",
    client: "Silver Oak University",
    year: "2025",
    summary:
      "A website in many languages with crop tips and online tools for farmers.",
    description:
      "My final-year BCA project, co-developed with a team of four. Krushi Manch brings crop guidance, disease information and an equipment rental marketplace together behind role-based access for farmers, buyers and admins. I worked across the full stack — PHP, MySQL, HTML, CSS and JavaScript — and contributed to the multilingual layer and the EMI calculator. It was the project that convinced me I wanted to build data-driven products, not just models.",
    tags: ["PHP", "MySQL", "JavaScript", "HTML", "CSS", "Bootstrap"],
    highlights: [
      { label: "Crop profiles", value: "50+" },
      { label: "Team members", value: "04" },
      { label: "Languages", value: "2+" },
    ],
    image: "/projects/krushi-manch.svg",
    featured: true,
    order: 1,
  },
  {
    id: "customer-churn-prediction",
    title: "Customer Churn Prediction",
    role: "Data Science Intern",
    client: "Rubixe · Client PRCL-0017",
    year: "2025",
    summary:
      "This project predicts which telecom customers may leave. I used customer history, contract type, and billing data, and led the work from start to finish.",
    description:
      "The first project I took from raw client data to a working deliverable. I cleaned the dataset, engineered features (including deriving tenure from signup date), and compared Logistic Regression, Decision Tree and Random Forest. SMOTE was applied to counter the heavy class imbalance. The headline accuracy landed at 79%, but minority-class recall stayed close to zero — an honest reminder that accuracy alone can hide a model that fails exactly where it matters.",
    tags: [
      "Python",
      "Pandas",
      "Scikit-learn",
      "SMOTE",
      "Seaborn",
      "Classification",
    ],
    highlights: [
      { label: "Accuracy", value: "79%" },
      { label: "Models evaluated", value: "03" },
      { label: "Imbalance handling", value: "SMOTE" },
    ],
    image: "/projects/customer-churn.svg",
    repoUrl:
      "https://github.com/hiren223/ML_Projects/blob/main/PRCL-0017%20Customer%20Churn%20Business%20case/PRCL-0017%20Customer%20Churn.ipynb",
    featured: true,
    order: 2,
  },
  {
    id: "home-loan-default-prediction",
    title: "Home Loan Default Prediction",
    role: "Data Science Intern",
    client: "Rubixe · Capstone PRCP-1006",
    year: "2025",
    summary:
      "Scoring loan default risk from applicant and credit history data — the strongest-performing model of my capstone set.",
    description:
      "A structured risk problem with a clear business question: who should we lend to? I compared Logistic Regression, Decision Tree, Random Forest and XGBoost, tuning the winners with GridSearchCV and evaluating on both accuracy and ROC-AUC rather than accuracy alone. XGBoost won with 91.98% accuracy and a 0.761 ROC-AUC, showing that the model learned real separation rather than a class-frequency shortcut.",
    tags: [
      "Python",
      "XGBoost",
      "Scikit-learn",
      "GridSearchCV",
      "Pandas",
      "Seaborn",
    ],
    highlights: [
      { label: "Accuracy", value: "91.98%" },
      { label: "ROC-AUC", value: "0.761" },
      { label: "Best model", value: "XGBoost" },
    ],
    image: "/projects/home-loan-default.svg",
    repoUrl:
      "https://github.com/hiren223/ML_Projects/blob/main/PRCP-1006-HomeLoanDef.ipynb",
    featured: false,
    order: 3,
  },
  {
    id: "insurance-claim-prediction",
    title: "Insurance Claim Prediction",
    role: "Data Science Intern",
    client: "Rubixe · Capstone PRCP-1010",
    year: "2026",
    summary:
      "Classifying likely insurance claims from a privacy-masked feature set, and reading past the accuracy score.",
    description:
      "A deliberately constrained feature set: privacy-masked inputs where signal is thin. I compared Logistic Regression, Decision Tree, Random Forest and Gradient Boosting, using SMOTE to rebalance the target. Logistic Regression reached 84.7% accuracy — yet ROC-AUC sat around 0.50. The gap between a high accuracy and near-random ranking was the most useful thing this project taught me: always interrogate what the metric is actually buying you.",
    tags: [
      "Python",
      "Scikit-learn",
      "SMOTE",
      "Pandas",
      "Classification",
      "Evaluation",
    ],
    highlights: [
      { label: "Accuracy", value: "84.7%" },
      { label: "ROC-AUC", value: "≈0.50" },
      { label: "Best model", value: "Logistic Reg." },
    ],
    image: "/projects/insurance-claim.svg",
    repoUrl:
      "https://github.com/hiren223/ML_Projects/blob/main/PRCP-1010-InsClaimPred.ipynb",
    featured: false,
    order: 4,
  },
  {
    id: "vaccine-prediction",
    title: "Vaccine Prediction",
    role: "Data Science Intern",
    client: "Rubixe · Capstone PRCP-1014",
    year: "2026",
    summary:
      "Regression forecasting vaccination-related figures from public health data with gaps from inconsistent regional reporting.",
    description:
      "Public health data rarely arrives tidy. Missing values from uneven regional reporting had to be handled before modelling. I built Linear Regression, Random Forest and Gradient Boosting regressors and evaluated them with MAE, RMSE and R². Random Forest delivered an MAE of 0.77 with an R² close to 1.0 — a strong fit, and a good exercise in taking a regression task through a full evaluation loop.",
    tags: ["Python", "Scikit-learn", "Regression", "Pandas", "Seaborn", "EDA"],
    highlights: [
      { label: "MAE", value: "0.77" },
      { label: "R²", value: "≈1.00" },
      { label: "Best model", value: "Random Forest" },
    ],
    image: "/projects/vaccine-prediction.svg",
    repoUrl:
      "https://github.com/hiren223/ML_Projects/blob/main/PRCP-1014-VaccinePred.ipynb",
    featured: false,
    order: 5,
  },
  {
    id: "covid-19-forecasting",
    title: "COVID-19 Forecasting",
    role: "Data Science Intern",
    client: "Rubixe · Capstone PRCP-1023",
    year: "2026",
    summary:
      "Converting wide, country-level case data into global daily totals and forecasting the curve that followed.",
    description:
      "The hardest capstone I attempted. I reshaped wide time-series country-level data into global daily totals, then benchmarked Linear Regression, Ridge, Lasso and a tuned Random Forest. Ridge proved the strongest baseline with the lowest RMSE; the tuned model actually scored R² below zero. Forecasting cumulative counts is a different animal to the classification problems I had done before, and this project taught me to respect the shape of the data before reaching for a model.",
    tags: [
      "Python",
      "Pandas",
      "Scikit-learn",
      "Matplotlib",
      "Time Series",
      "Ridge",
    ],
    highlights: [
      { label: "Best baseline", value: "Ridge" },
      { label: "Tuned R²", value: "≤ 0" },
      { label: "Evaluation", value: "RMSE" },
    ],
    image: "/projects/covid-forecasting.svg",
    repoUrl:
      "https://github.com/hiren223/ML_Projects/blob/main/PRCP-1023-JohnsHopkinsCovid19.ipynb",
    featured: false,
    order: 6,
  },
  {
    id: "smart-agriculture-dashboard",
    title: "Smart Agriculture Analytics Dashboard",
    role: "Data Science Project",
    client: "Silver Oak University",
    year: "2026",
    summary:
      "An agriculture analytics dashboard that turns crop and farm data into readable charts for non-technical users.",
    description:
      "The analytics counterpart to Krushi Manch: instead of serving crop information page by page, the same domain is presented as a dashboard of charts. Built with Python for the cleaning and aggregation, Power BI for the interactive reporting layer, and SQL for the queries behind each visual. It is the piece that showed me how much a decision-maker gets from a well-shaped chart compared with the same numbers in a notebook.",
    tags: ["Python", "Pandas", "Power BI", "SQL", "Data Cleaning", "EDA"],
    highlights: [
      { label: "Visuals", value: "12" },
      { label: "Data source", value: "SQL" },
      { label: "Reporting", value: "Power BI" },
    ],
    image: "/projects/smart-agriculture.svg",
    featured: false,
    order: 7,
  },
];

export function toPortfolioProject(project: {
  _id: string;
  title: string;
  role: string;
  client: string;
  year: string;
  summary: string;
  description: string;
  tags: string[];
  highlights: ProjectHighlight[];
  url?: string;
  repoUrl?: string;
  featured: boolean;
  order: number;
}): PortfolioProject {
  return {
    id: project._id,
    title: project.title,
    role: project.role,
    client: project.client,
    year: project.year,
    summary: project.summary,
    description: project.description,
    tags: project.tags,
    highlights: project.highlights,
    image: imageForProject(project),
    url: project.url,
    repoUrl: project.repoUrl,
    featured: project.featured,
    order: project.order,
  };
}
