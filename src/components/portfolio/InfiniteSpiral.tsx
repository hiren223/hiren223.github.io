/**
 * InfiniteSpiral — React Bits (https://reactbits.dev/infinite-spiral)
 *
 * Ported from the React Bits source to this app's stack: no "use client",
 * named exports, and the card visuals are driven by CSS custom properties +
 * the same theme tokens as the rest of the portfolio so the gallery inherits
 * the theme instead of hard-coding a light/dark palette.
 *
 * How it works: every card sits at `left:50% / top:50%` and the rAF loop
 * writes a single composed transform per card from one shared `progress`
 * value. The offset from that value decides the card's angle on the helix,
 * its depth scale, its z-index, its edge fade and its edge blur, so a single
 * float drives the whole scene on the compositor.
 */
import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export type InfiniteSpiralItem = {
  id?: string | number;
  src: string;
  alt?: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  label?: string;
};

export type InfiniteSpiralProps = {
  items?: Array<string | InfiniteSpiralItem>;
  /** Cards per second, and the sensitivity of scroll-controlled motion. */
  speed?: number;
  direction?: "up" | "down";
  animationMode?: "auto" | "drag" | "scroll" | "all";
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  verticalSpacing?: number;
  perspective?: number;
  cardsPerTurn?: number;
  rotation?: number;
  cardTilt?: number;
  cardRadius?: number;
  centerScale?: number;
  edgeFade?: number;
  edgeBlur?: number;
  pauseOnHover?: boolean;
  imageFit?: CSSProperties["objectFit"];
  grayscale?: number;
  className?: string;
  /**
   * Render into an existing element instead of a wrapper of our own: the
   * cards become direct children of this ref, and it receives the
   * perspective + cursor styles. Lets a caller own the box (and its
   * overflow/mask) without an extra nesting level.
   */
  rootRef?: RefObject<HTMLDivElement | null>;
};

type NormalizedItem = InfiniteSpiralItem & { alt: string };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const modulo = (value: number, divisor: number) =>
  ((value % divisor) + divisor) % divisor;
const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
};

export function InfiniteSpiral({
  items = [],
  speed = 0.55,
  direction = "up",
  animationMode = "auto",
  radius = 170,
  cardWidth = 100,
  cardHeight = 100,
  verticalSpacing = 60,
  perspective = 1000,
  cardsPerTurn = 7,
  rotation = 0,
  cardTilt = 0,
  cardRadius = 10,
  centerScale = 1.2,
  edgeFade = 0.3,
  edgeBlur = 6,
  pauseOnHover = true,
  imageFit = "cover",
  grayscale = 0,
  className = "",
  rootRef: providedRootRef,
}: InfiniteSpiralProps) {
  const fallbackRootRef = useRef<HTMLDivElement>(null);
  const rootRef = providedRootRef ?? fallbackRootRef;
  const cardRefs = useRef<Array<HTMLAnchorElement | HTMLDivElement | null>>([]);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const autoSpeedRef = useRef(0);
  const hoveredRef = useRef(false);
  const visibleRef = useRef(true);
  const draggingRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const dragMovedRef = useRef(false);

  /* A stable array identity matters: it is a dependency of the rAF effect,
     so it is memoised rather than rebuilt on every render. */
  const normalizedItems = useMemo<NormalizedItem[]>(
    () =>
      items.map((item, index) =>
        typeof item === "string"
          ? { src: item, alt: `Spiral image ${index + 1}` }
          : { alt: `Spiral image ${index + 1}`, ...item },
      ),
    [items],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || normalizedItems.length === 0) return;

    let frameId = 0;
    let previousTime = performance.now();
    let bounds = root.getBoundingClientRect();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollEnabled = animationMode === "scroll" || animationMode === "all";
    const scrollSpeedMultiplier = Math.max(speed, 0) / 0.55;
    let lastScrollY = window.scrollY;

    const resizeObserver = new ResizeObserver(() => {
      bounds = root.getBoundingClientRect();
    });
    resizeObserver.observe(root);

    /* Auto travel and scroll travel both stop when off-screen, so a long
       page never pays for a spiral nobody is looking at. */
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    intersectionObserver.observe(root);

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (!scrollEnabled || !visibleRef.current || scrollDelta === 0) return;
      targetProgressRef.current += clamp(
        (scrollDelta * scrollSpeedMultiplier) / Math.max(verticalSpacing * 2, 1),
        -1.5,
        1.5,
      );
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const render = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      const autoEnabled = animationMode === "auto" || animationMode === "all";
      const motionPaused =
        draggingRef.current || (pauseOnHover && hoveredRef.current);
      const directionMultiplier = direction === "down" ? -1 : 1;
      const desiredAutoSpeed =
        autoEnabled && visibleRef.current && !reducedMotion.matches && !motionPaused
          ? speed * directionMultiplier
          : 0;

      /* Ease into and out of motion rather than starting and stopping hard. */
      const speedBlend = 1 - Math.exp(-delta * 7);
      autoSpeedRef.current += (desiredAutoSpeed - autoSpeedRef.current) * speedBlend;
      targetProgressRef.current += autoSpeedRef.current * delta;

      const followBlend = 1 - Math.exp(-delta * (draggingRef.current ? 22 : 11));
      progressRef.current +=
        (targetProgressRef.current - progressRef.current) * followBlend;

      const count = normalizedItems.length;
      const half = count / 2;
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);

      /* Everything below scales with the box so the spiral reads the same on
         a phone as on a wide desktop. */
      const fit = Math.min(1, width / (cardWidth * 2.8), height / (cardHeight * 2.35));
      const responsiveRadius = Math.min(radius, Math.max(72, width * 0.36)) * fit;
      const fadeStart = clamp(1 - edgeFade, 0, 0.98);
      const turnSize = Math.max(cardsPerTurn, 1);

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const offset = modulo(index - progressRef.current + half, count) - half;
        const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
        const opacity = 1 - smoothstep(fadeStart, 1, edge);
        const focus = 1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
        const scale = (1 + (centerScale - 1) * focus) * fit;
        const angle = offset * (360 / turnSize) + rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const x = Math.sin(angleRadians) * responsiveRadius;
        const z = Math.cos(angleRadians) * responsiveRadius;
        const depthScale = clamp(perspective / Math.max(perspective - z, 1), 0.72, 1.45);
        const visualScale = scale * depthScale;
        const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
        const blur = edgeBlur * smoothstep(0.35, 1, edge);

        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * verticalSpacing * fit}px, 0) rotateZ(${cardTilt}deg) scale(${visualScale})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "none";
        card.style.zIndex = String(Math.round(depth * 100000) + index);
        card.style.pointerEvents = opacity > 0.25 ? "auto" : "none";
      });

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    normalizedItems,
    speed,
    direction,
    animationMode,
    radius,
    perspective,
    cardWidth,
    cardHeight,
    verticalSpacing,
    cardsPerTurn,
    rotation,
    cardTilt,
    centerScale,
    edgeFade,
    edgeBlur,
    pauseOnHover,
  ]);

  const dragEnabled = animationMode === "drag" || animationMode === "all";

  const rootStyle: CSSProperties = {
    perspective: `${perspective}px`,
    /* custom properties need the index signature, not CSSProperties */
    "--spiral-width": `${cardWidth}px`,
    "--spiral-height": `${cardHeight}px`,
    "--spiral-radius": `${cardRadius}px`,
    cursor: dragEnabled ? "grab" : "default",
    touchAction: dragEnabled ? "pan-x" : "auto",
    userSelect: dragEnabled ? "none" : "auto",
  } as CSSProperties;

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = dragEnabled ? "grab" : "default";
  };

  const setCardRef = (index: number) => (node: HTMLAnchorElement | HTMLDivElement | null) => {
    cardRefs.current[index] = node;
  };

  const cardStyle: CSSProperties = {
    width: cardWidth,
    height: cardHeight,
    borderRadius: cardRadius,
  };

  /* Only the fit and the grayscale live inline — the pixel size is left to
     CSS so a card can pad its glyph (the upstream version hard-coded the
     full card size here, which made every image bleed to the tile edge). */
  const imageStyle: CSSProperties = {
    objectFit: imageFit,
    filter: `grayscale(${Math.min(1, Math.max(0, grayscale))})`,
  };

  /* Cards are direct children of the perspective root — no extra 3D wrapper,
     so each card's transform is composed against the root's perspective. */
  const cardClassName = [
    "hk-spiral-card absolute left-1/2 top-1/2 block",
    "h-[var(--spiral-height)] w-[var(--spiral-width)]",
    "overflow-hidden rounded-[var(--spiral-radius)]",
    "border border-border bg-card",
    "[backface-visibility:hidden]",
    "[will-change:transform,opacity,filter]",
  ].join(" ");

  const cards = normalizedItems.map((item, index) => {
    const content = (
      <img
        className="block max-h-full max-w-full select-none object-center"
        src={item.src}
        alt={item.alt}
        loading={index < 6 ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        style={imageStyle}
      />
    );

    const key = item.id ?? `${item.src}-${index}`;

    return item.href ? (
      <a
        key={key}
        ref={setCardRef(index)}
        className={cardClassName}
        style={cardStyle}
        href={item.href}
        target={item.target}
        rel={item.target === "_blank" ? "noreferrer" : undefined}
        role="listitem"
        aria-label={item.label ?? item.alt}
      >
        {content}
      </a>
    ) : (
      <div
        key={key}
        ref={setCardRef(index)}
        className={cardClassName}
        style={cardStyle}
        role="listitem"
        aria-label={item.label ?? item.alt}
      >
        {content}
      </div>
    );
  });

  /* When the caller supplies a root, the cards render straight into it and
     the perspective/cursor styles are written onto that element — no wrapper
     of our own. Otherwise fall back to rendering a self-contained root.

     This effect is declared unconditionally, above the branch, so the hook
     order never changes between renders. */
  useEffect(() => {
    const root = providedRootRef?.current;
    if (!root) return;
    Object.assign(root.style, {
      perspective: `${perspective}px`,
      cursor: dragEnabled ? "grab" : "default",
      touchAction: dragEnabled ? "pan-x" : "auto",
      userSelect: dragEnabled ? "none" : "auto",
    });
  }, [providedRootRef, perspective, dragEnabled]);

  if (providedRootRef) return <>{cards}</>;

  return (
    <div
      ref={rootRef}
      className={`relative isolate h-full min-h-80 w-full overflow-hidden ${className}`}
      style={rootStyle}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      onPointerDown={(event) => {
        if (!dragEnabled || event.button !== 0) return;
        draggingRef.current = true;
        dragMovedRef.current = false;
        lastPointerYRef.current = event.clientY;
        targetProgressRef.current = progressRef.current;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.cursor = "grabbing";
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        const pointerDelta = event.clientY - lastPointerYRef.current;
        lastPointerYRef.current = event.clientY;
        if (Math.abs(pointerDelta) > 0.5) dragMovedRef.current = true;
        targetProgressRef.current -= pointerDelta / Math.max(verticalSpacing, 1);
      }}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onClickCapture={(event) => {
        /* A drag that ends over a card must not also open it. */
        if (!dragMovedRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        dragMovedRef.current = false;
      }}
      role="list"
      aria-label="Skills gallery"
    >
      {cards}
    </div>
  );
}

export default InfiniteSpiral;
