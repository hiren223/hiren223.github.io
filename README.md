# Hiren Keraliya — Portfolio

Static React + Vite portfolio for GitHub Pages. Public project details are stored locally in `src/lib/sample-projects.ts`; no backend or environment variables are required for the portfolio pages.

## Run locally

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Vite uses a relative base path so generated assets work on a GitHub Pages repository path as well as on a custom domain. The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and publishes `dist/`. In the repository settings, set **Pages → Build and deployment → GitHub Actions**.

## Content

- Homepage sections: `src/components/portfolio/` and `src/pages/Landing.tsx`
- Projects archive: `src/pages/ProjectsPage.tsx`
- Static project data: `src/lib/sample-projects.ts`
- Resume and public assets: `public/`

This site is static. Contact links use email/phone/external URLs; they do not submit to a backend.
