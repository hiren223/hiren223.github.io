/**
 * Cover-image URL helper for the browser bundle.
 *
 * The project data lives in a module that Convex also imports, so it stores
 * plain root-relative paths ("/projects/krushi-manch.svg") rather than Vite
 * asset imports. On GitHub Pages a project site is served from a sub-path
 * ("/repo/"), so those paths are resolved against import.meta.env.BASE_URL
 * here — in the browser only — and left untouched for absolute URLs.
 */
export function coverSrc(path: string): string {
  if (!path.startsWith("/")) return path;

  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;

  return `${prefix}${path.replace(/^\/+/, "")}`;
}
