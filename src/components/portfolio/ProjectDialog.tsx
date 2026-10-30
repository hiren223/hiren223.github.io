/**
 * ProjectDialog — the case-study detail view.
 *
 * Extracted from the old ProjectShowcase so the dialog outlives the card
 * grid: the index rows open it, and the project content it renders is
 * exactly what the previous cards showed.
 */
import { coverSrc } from "@/lib/project-media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PortfolioProject } from "@/lib/sample-projects";
import { ArrowUpRight, Github, ExternalLink } from "lucide-react";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border pt-3">
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ProjectDialog({
  project,
  onClose,
}: {
  project: PortfolioProject | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-border bg-background p-0 sm:max-w-2xl shadow-2xl rounded-2xl">
        {project && (
          <div className="flex flex-col">
            {/* Project Hero Visual Banner */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[2.2/1] overflow-hidden bg-card border-b border-border">
              <img
                src={coverSrc(project.image)}
                alt={`${project.title} cover`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
            </div>

            <div className="flex flex-col gap-4 border-b border-border p-6 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-clay">
                {project.year} · {project.client}
              </span>
              <DialogTitle className="font-display text-3xl sm:text-4xl leading-tight text-foreground">
                {project.title}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {project.summary}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-8 pb-4 sm:grid-cols-3">
              <MetaRow label="Role" value={project.role} />
              <MetaRow label="Client" value={project.client} />
              <MetaRow label="Year" value={project.year} />
            </div>

            <div className="grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-3">
              {project.highlights.map((h) => (
                <div
                  key={h.label}
                  className="flex flex-col gap-2 bg-background p-8"
                >
                  <span className="font-display text-3xl text-foreground">
                    {h.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {h.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 p-8">
              <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                The work
              </span>
              <p className="text-sm leading-7 text-foreground/90">
                {project.description}
              </p>
              {(project.url || project.repoUrl) && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border-b border-clay pb-1 text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:text-clay"
                    >
                      Live project
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border-b border-clay pb-1 text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:text-clay"
                    >
                      Repository
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
