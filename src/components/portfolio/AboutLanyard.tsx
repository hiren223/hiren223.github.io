/**
 * AboutLanyard — the About section's card, and its drag surface.
 *
 * Two pieces, deliberately:
 *
 * - `AboutLanyard` is the canvas. It is absolutely positioned over the
 *   whole `.about-section`, not over the right-hand column, so the
 *   card can be picked up and thrown across the entire section.
 * - `LanyardCaption` is the visible instruction. It stays in the
 *   right-hand column, where the card rests, so "Drag the card." still
 *   points at the thing it describes.
 *
 * The card does not follow the canvas to the middle of the section:
 * `anchorX` / `anchorY` pin the rig over the right-hand column, which
 * is measured from the DOM rather than hard-coded, so it survives any
 * change to the grid.
 *
 * A wrapper rather than <Lanyard /> directly, for three more reasons:
 *
 * - **Weight.** three + react-three + drei + rapier is far larger
 *   than the rest of the page, so the scene is a lazy chunk and is
 *   only requested when this section approaches the viewport.
 * - **Cost.** The canvas mounts once, when it is near the viewport,
 *   and never after; the device pixel ratio is capped inside the
 *   scene rather than left at the display's native value.
 * - **Accessibility.** The scene carries no information that is not
 *   already in the About copy, so the canvas is hidden from assistive
 *   technology. The caption stays, because "drag the card" is an
 *   instruction a pointer user needs and cannot see.
 */
import { useInView, useReducedMotion } from "framer-motion";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import "./lanyard-stage.css";

const Lanyard = lazy(() => import("./Lanyard"));

/* The card face: the light stock with the ink mark, drawn at the
   face's own proportions (1 : 1.5, which is what the card model's
   front and back panels are), so `cover` fills the panel edge to
   edge with no stretch. Swapping in a different artwork is this one
   constant: drop the file in public/lanyard/ and point at it here.
   A PNG with transparency still works — `faceFill` paints the
   panel behind it. */
const CARD_FACE = `${import.meta.env.BASE_URL}lanyard/card-face.svg`;

/* Warm paper, matching the light card in the reference the About
   section was built from. The knob to change the card's stock. */
const CARD_FACE_FILL = "#f4f1ea";

/* The height the scene's camera distances were framed against; passed
   through so a section-tall canvas shows the card at the same size. */
const REFERENCE_HEIGHT = 500;

/* How far down its own box the band's fixed end sits, from the frame
   the scene shipped with. Used to keep the card at its familiar
   height inside the taller section. */
const ANCHOR_DROP = 0.1042;

export function LanyardCaption() {
  const still = useReducedMotion() ?? false;

  return (
    <figure className="lanyard-stage">
      <figcaption className="lanyard-stage__caption">
        {still ? "A lanyard card." : "Drag the card."}
      </figcaption>
    </figure>
  );
}

export function AboutLanyard() {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "240px" });

  /* Centre of the canvas until the section has been measured. */
  const [anchor, setAnchor] = useState({ x: 0.5, y: ANCHOR_DROP });

  useEffect(() => {
    const layer = ref.current;
    const section = layer?.closest<HTMLElement>(".about-section");
    const slot = section?.querySelector<HTMLElement>(".about-visual");
    if (!section || !slot) return;

    const measure = () => {
      /* The layer is inset:0 on the section, so the section's own box
         is the canvas box — no need to measure the layer too. */
      const box = section.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      const column = slot.getBoundingClientRect();

      setAnchor({
        x: (column.left + column.width / 2 - box.left) / box.width,
        y: (column.top - box.top + ANCHOR_DROP * column.height) / box.height,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(slot);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="lanyard-stage__layer" ref={ref}>
      {inView ? (
        <div className="lanyard-stage__canvas" aria-hidden="true">
          <Suspense fallback={null}>
            <Lanyard
              paused={still}
              position={[0, 0, 26]}
              fov={22}
              anchorX={anchor.x}
              anchorY={anchor.y}
              referenceHeight={REFERENCE_HEIGHT}
              frontImage={CARD_FACE}
              backImage={CARD_FACE}
              imageFit="cover"
              faceFill={CARD_FACE_FILL}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
