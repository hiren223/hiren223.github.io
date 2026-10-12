/**
 * GooeyNav — a segmented pill bar whose active segment grows a liquid
 * "neck" into its neighbours while the spring settles.
 *
 * Ported to this app's stack: no Next.js (`next/link`, `usePathname`, no
 * "use client"), motion comes from framer-motion, and every colour comes
 * from the caller's theme tokens instead of hard-coded greys. The active
 * index is fully controlled by the caller, so the navbar's scroll spy stays
 * the single source of truth.
 *
 * How the neck works:
 *  - each segment is an <li> painted in its own fill colour;
 *  - the gap in front of it springs between -1px (closed) and `span` (open);
 *  - a concave SVG path is drawn in that gap, filled with a gradient of the
 *    two neighbouring fills, so the bars read as one liquid body;
 *  - the waist thins to nothing at NECK_BREAK of the separation, so the
 *    neck only exists while the spring settles — at rest the segments are
 *    plain rounded pills separated by `span`.
 */
import {
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* Damped so nothing overshoots. */
const SPRING = {
  type: "spring",
  stiffness: 200,
  damping: 28,
  mass: 1,
} as const;

/* The neck has thinned to nothing by the time the gap is this far open. */
const NECK_BREAK = 0.22;

/* Nominal viewBox height; the svg stretches to whatever the tile is. */
const NECK_H = 100;

const FADE_IN = "transition-colors duration-[400ms]";
const FADE_OUT = "transition-colors duration-0";

const SIZES = {
  xs: {
    label: "gap-1 px-2 py-1.5 text-[11px] leading-4 [&_svg]:size-[11px]",
    radius: 8,
    separation: 14,
  },
  sm: {
    label: "gap-1.5 px-3.5 py-2 text-xs leading-4 [&_svg]:size-3",
    radius: 10,
    separation: 16,
  },
  md: {
    label: "gap-2 px-5 py-2.5 text-sm leading-5 [&_svg]:size-3.5",
    radius: 12,
    separation: 20,
  },
  lg: {
    label: "gap-2.5 px-6 py-3 text-base leading-6 [&_svg]:size-4",
    radius: 14,
    separation: 24,
  },
  /** Tuned for the landing navbar: 64px bar, editorial uppercase tracking. */
  nav: {
    label:
      "gap-1.5 px-3 py-2 text-[11px] font-medium uppercase leading-4 tracking-[0.16em] [&_svg]:size-3",
    radius: 7,
    separation: 12,
  },
} as const;

export type GooeyNavSize = keyof typeof SIZES;

type NavItem = { label: string; href?: string; icon?: ReactNode };

export type GooeyNavItem = string | NavItem;

const toItem = (item: GooeyNavItem): NavItem =>
  typeof item === "string" ? { label: item } : item;

export type GooeyNavProps = Omit<ComponentProps<"nav">, "onChange"> & {
  items: GooeyNavItem[];
  /** Controlled active index. */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  size?: GooeyNavSize;
  /** Fill of the active segment. */
  activeColor?: string;
  activeLabelColor?: string;
  /** Fill of every inactive segment — keep it subtle, it is the "bar". */
  idleColor?: string;
  idleLabelColor?: string;
  separation?: number;
  radius?: number;
};

/**
 * Two concave curves pinching toward the middle, drawn in the gap the
 * tiles leave between them.
 */
function neckPath(gap: number, span: number) {
  // a NaN or negative span would emit a path full of NaN coordinates
  if (!Number.isFinite(gap) || !Number.isFinite(span) || gap <= 0 || span <= 0) {
    return "";
  }
  const waist = NECK_H * (1 - gap / (span * NECK_BREAK));
  if (waist <= 0) return "";
  const start = span - gap;
  const mid = start + gap / 2;
  return `M${start} 0 Q${mid} ${NECK_H - waist} ${span} 0 L${span} ${NECK_H} Q${mid} ${waist} ${start} ${NECK_H} Z`;
}

type SegmentProps = {
  gap: number;
  span: number;
  hasSeam: boolean;
  leftFill: string;
  rightFill: string;
  reduced: boolean;
  radii: Record<string, number>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function Segment({
  gap,
  span,
  hasSeam,
  leftFill,
  rightFill,
  reduced,
  radii,
  className,
  style,
  children,
}: SegmentProps) {
  const marginLeft = useSpring(gap, SPRING);
  const gradientId = `gooey-neck-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (reduced) marginLeft.jump(gap);
    else marginLeft.set(gap);
  }, [gap, marginLeft, reduced]);

  const d = useTransform(marginLeft, (g) => neckPath(g, span));

  return (
    <motion.li
      data-slot="gooey-nav-segment"
      className={cn("relative", className)}
      style={{ ...style, marginLeft }}
      initial={false}
      animate={radii}
      transition={reduced ? { duration: 0 } : SPRING}
    >
      {hasSeam && (
        <svg
          aria-hidden
          width={span}
          viewBox={`0 0 ${span} ${NECK_H}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-0 right-full h-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop offset="0" stopColor={leftFill} />
              <stop offset="1" stopColor={rightFill} />
            </linearGradient>
          </defs>
          <motion.path d={d} fill={`url(#${gradientId})`} />
        </svg>
      )}
      {children}
    </motion.li>
  );
}

type NavLabelProps = NavItem & {
  isActive: boolean;
  size: GooeyNavSize;
  activeLabelColor: string;
  idleLabelColor: string;
  onSelect: () => void;
};

function NavLabel({
  label,
  href,
  icon,
  isActive,
  size,
  activeLabelColor,
  idleLabelColor,
  onSelect,
}: NavLabelProps) {
  const props = {
    "data-slot": "gooey-nav-item",
    "data-active": isActive,
    // in-page anchors get `true`; a real route would get "page"
    "aria-current": isActive ? (href?.startsWith("#") ? true : "page") : undefined,
    className: cn(
      "flex cursor-pointer items-center whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
      isActive ? FADE_IN : FADE_OUT,
      SIZES[size].label,
    ),
    style: { color: isActive ? activeLabelColor : idleLabelColor },
    onClick: onSelect,
  } as const;

  return href ? (
    <a href={href} {...props}>
      {icon}
      {label}
    </a>
  ) : (
    <button type="button" {...props}>
      {icon}
      {label}
    </button>
  );
}

export function GooeyNav({
  items,
  value,
  defaultValue = 0,
  onChange,
  size = "nav",
  activeColor = "var(--clay)",
  activeLabelColor = "var(--clay-foreground)",
  idleColor = "rgba(20,20,20,0.05)",
  idleLabelColor = "var(--muted-foreground)",
  separation,
  radius,
  className,
  ...props
}: GooeyNavProps) {
  const reduced = useReducedMotion() ?? false;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);

  const active = value ?? uncontrolled;
  const span = separation ?? SIZES[size].separation;
  const corner = radius ?? SIZES[size].radius;

  const open = (seam: number) =>
    seam === 0 ||
    seam === items.length ||
    seam - 1 === active ||
    seam === active;

  const fill = (i: number) => (i === active ? activeColor : idleColor);

  return (
    <nav
      data-slot="gooey-nav"
      className={cn("inline-block", className)}
      {...props}
    >
      <ul className="flex items-center">
        {items.map((item, i) => {
          const navItem = toItem(item);
          const isActive = i === active;

          return (
            <Segment
              key={`${i}-${navItem.label}`}
              /* closed seams pull in a pixel so no hairline shows through */
              gap={i === 0 ? 0 : open(i) ? span : -1}
              span={span}
              hasSeam={i > 0}
              leftFill={fill(i - 1)}
              rightFill={fill(i)}
              reduced={reduced}
              radii={{
                borderTopLeftRadius: open(i) ? corner : 0,
                borderBottomLeftRadius: open(i) ? corner : 0,
                borderTopRightRadius: open(i + 1) ? corner : 0,
                borderBottomRightRadius: open(i + 1) ? corner : 0,
              }}
              className={cn(isActive ? FADE_IN : FADE_OUT)}
              style={{ backgroundColor: fill(i) }}
            >
              <NavLabel
                {...navItem}
                isActive={isActive}
                size={size}
                activeLabelColor={activeLabelColor}
                idleLabelColor={idleLabelColor}
                onSelect={() => {
                  if (value === undefined) setUncontrolled(i);
                  onChange?.(i);
                }}
              />
            </Segment>
          );
        })}
      </ul>
    </nav>
  );
}