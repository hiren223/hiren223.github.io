/**
 * SkillsSpiral — the brand-mark helix that replaced the text marquee.
 *
 * Wraps InfiniteSpiral with the portfolio's own skill list. The item array is
 * built once at module scope: InfiniteSpiral's animation effect depends on
 * its identity, so building it during render would restart the rAF loop on
 * every parent re-render.
 *
 * The band element is handed to the spiral as its root, so the cards sit
 * directly inside it — no extra wrapper between the two.
 */
import { InfiniteSpiral, type InfiniteSpiralItem } from "@/components/portfolio/InfiniteSpiral";
import { SKILL_MARKS, skillMarkUrl } from "@/lib/skill-logos";
import { useRef } from "react";

/* Stable identity — see the note above. */
const SPIRAL_ITEMS: InfiniteSpiralItem[] = SKILL_MARKS.map((mark) => ({
  src: skillMarkUrl(mark),
  alt: mark.name,
  label: mark.name,
}));

export function SkillsSpiral() {
  const bandRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={bandRef}
      className="hk-spiral"
      role="list"
      aria-label="Skills gallery"
    >
      <InfiniteSpiral
        items={SPIRAL_ITEMS}
        rootRef={bandRef}
        animationMode="all"
        speed={0.4}
        direction="up"
        radius={190}
        cardWidth={104}
        cardHeight={104}
        verticalSpacing={62}
        perspective={1000}
        cardRadius={12}
        centerScale={1.18}
        edgeFade={0.34}
        edgeBlur={5}
        cardsPerTurn={8}
        pauseOnHover
      />
    </div>
  );
}
