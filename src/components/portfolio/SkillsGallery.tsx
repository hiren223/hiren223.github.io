/**
 * SkillsGallery — the WebGL circular gallery for the skills section.
 *
 * Wraps CircularGallery with the portfolio's own skill list: transparent
 * brand marks as the cards, the skill name drawn beneath each one.
 *
 * The item array is built once at module scope because CircularGallery's
 * effect depends on its identity — rebuilding it during render would tear
 * down and recreate the whole ogl renderer on every parent re-render.
 */
import {
  CircularGallery,
  type CircularGalleryItem,
} from "@/components/portfolio/CircularGallery";
import { SKILL_MARKS, skillMarkUrl } from "@/lib/skill-logos";

/* Stable identity — see the note above. */
const GALLERY_ITEMS: CircularGalleryItem[] = SKILL_MARKS.map((mark) => ({
  image: skillMarkUrl(mark),
  text: mark.name,
}));

export function SkillsGallery() {
  return (
    <div className="hk-skills-gallery">
      {/* The list is also exposed to screen readers, since a WebGL canvas
          carries no accessible text of its own. */}
      <p className="sr-only">
        Skills: {SKILL_MARKS.map((mark) => mark.name).join(", ")}.
      </p>
      <CircularGallery
        items={GALLERY_ITEMS}
        /* slight upward curve, matching the editorial page */
        bend={-2.4}
        textColor="#3a352f"
        borderRadius={0.12}
        font="600 26px Inter"
        scrollSpeed={2.4}
        scrollEase={0.06}
      />
    </div>
  );
}