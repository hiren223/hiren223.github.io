
# Hiren Keraliya — Data Scientist & Full Stack Developer

A personal portfolio showcasing my work in Data Science, Machine Learning, Data Analytics, and Full Stack Development. Explore real-world projects, technical skills, professional experience, and certifications.

**Live Portfolio:** [hiren223.github.io](https://hiren223.github.io/)

---

## Overview

This portfolio is a static, responsive web application built with React and Vite. It features an editorial design, interactive project archive, animated interfaces, and dedicated project case studies.

- **Data Science:** Predictive modeling, exploratory data analysis, and machine learning.
- **Data Analytics:** Python, SQL, Power BI, data visualization, and business insights.
- **Full Stack Development:** Responsive web applications and database-driven projects.
- **Professional Profile:** Experience, education, certifications, and contact links.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS, Tailwind CSS, responsive layouts |
| Animation | Framer Motion |
| Icons | Lucide React |
| Routing | React Router |
| Data Science | Python, Pandas, NumPy, Scikit-learn |
| Analytics | SQL, Power BI, Tableau |
| Deployment | GitHub Pages, GitHub Actions |

## Portfolio Features

- Responsive design for desktop, tablet, and mobile.
- Animated homepage sections and editorial typography.
- Dedicated projects archive at `/projects`.
- Project case-study dialogs with descriptions, technologies, highlights, and repository links.
- Centralized project data shared between the homepage and project archive.
- Direct links to GitHub, LinkedIn, email, and other relevant resources.
- Static deployment with no backend or environment variables required.

## Featured Projects

Explore projects covering machine learning, analytics, and web development, including:

- **Customer Churn Prediction** — Customer behavior analysis and classification.
- **Krushi-Manch** — A digital agriculture platform.
- **Home Loan Default Prediction** — Predictive modeling for loan risk.
- **Insurance Claim Prediction** — Data-driven claim prediction.
- **Vaccine Prediction** — Machine learning for vaccination prediction.
- **COVID-19 Forecasting** — Analysis and forecasting using COVID-19 data.
- **Smart Agriculture Analytics Dashboard** — Agricultural insights using Power BI.

See the [complete project archive](https://hiren223.github.io/projects/).

## Run Locally

### Prerequisites

- Node.js and npm
- Git

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/hiren223/hiren223.github.io.git
cd hiren223.github.io
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal.

## Production Build

Build the static site:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The generated website is available in the `dist/` directory.

## Deployment — GitHub Pages

This portfolio is designed for static hosting on GitHub Pages.

1. Push your changes to the repository.
2. Open **Settings → Pages** in GitHub.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Ensure `.github/workflows/deploy.yml` builds the project and publishes the `dist/` directory.
5. Check the **Actions** tab to confirm the workflow succeeds.

The Vite configuration uses a relative base path so generated assets can work on GitHub Pages project paths and custom domains. Verify the `base` setting if you change the deployment URL.

**Live website:** https://hiren223.github.io/

## Project Structure

```text
.
├── public/                     # Public assets and resume
├── src/
│   ├── components/
│   │   ├── portfolio/          # Portfolio sections and components
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   └── sample-projects.ts  # Centralized project data
│   ├── pages/
│   │   ├── Landing.tsx         # Homepage
│   │   └── ProjectsPage.tsx    # Project archive
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

*The structure above describes the intended key files; exact filenames may vary in your repository.*

## Contact

- **Portfolio:** [hiren223.github.io](https://hiren223.github.io/)
- **GitHub:** [github.com/hiren223](https://github.com/hiren223)
- **LinkedIn:** [Connect with me](https://www.linkedin.com/in/hiren-keraliya-440700259/)
- **Email:** [hirenkeraliya99@gmail.com](mailto:hirenkeraliya99@gmail.com)
- **Location:** Ahmedabad, India

I'm interested in opportunities to apply data science, machine learning, analytics, and software development to meaningful real-world problems.

**Let's connect and build something meaningful together.**

---

© Hiren Keraliya. All rights reserved.
