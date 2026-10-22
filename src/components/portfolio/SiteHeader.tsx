/**
 * SiteHeader — the portfolio navbar, shared by the homepage and the
 * projects page so the two can never drift apart.
 *
 * One look, no scroll state: no fill and no border, ink text, scrolling ink
 * chips for the nav links, and it never changes as the page moves. The old
 * two looks (`overlay` over the dark hero vs `solid` over the light page)
 * are gone — every band is on the light ground now.
 *
 * Below md the nav collapses to the hamburger, so the bar changes shape
 * rather than colour: it gains a frosted fill and shows the brand mark.
 *
 * The mobile hamburger, Escape handling, focus management, body scroll lock
 * and the rotate-past-breakpoint reset all live here too.
 */
import { GooeyNav } from "@/components/portfolio/GooeyNav";
import { useEffect, useRef, useState } from "react";

/* Brand portrait — the same background-removed cutout the hero shows, so the
   navbar mark and the hero read as one person rather than two identities. */
const BRAND_PORTRAIT = `${import.meta.env.BASE_URL}assets/photo-2-removebg-preview.png`;

export type HeaderLink = { label: string; href: string };

export type SiteHeaderProps = {
  links: HeaderLink[];
  /** Index into `links` of the active item. */
  activeIndex: number;
  className?: string;
};

export function SiteHeader({ links, activeIndex, className }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  /* Opening the panel moves focus to its first link; closing always hands
     focus back to the hamburger so the keyboard never lands on a hidden
     element. */
  const closeMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  /* Navbar state: there is none. The bar used to watch the hero with an
     IntersectionObserver and flip its fill and text colour at the top of
     the viewport; with one light ground across every band there is nothing
     left to flip to, so the observer and the state it wrote are gone. */

  /* Escape closes the mobile menu. */
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  /* Move focus into the panel as it opens. */
  useEffect(() => {
    if (isMenuOpen) firstMenuLinkRef.current?.focus();
  }, [isMenuOpen]);

  /* Menu open → freeze the page behind it. The scrollbar width is given
     back as padding so nothing shifts horizontally. */
  useEffect(() => {
    if (!isMenuOpen) return;

    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [isMenuOpen]);

  /* Rotating or widening past the mobile breakpoint must not leave the
     panel stuck open behind the desktop nav. */
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 769px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };

    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  const tone = "text-[#1d1b18]";

  return (
    <header className={`fixed inset-x-0 top-0 z-[1000] ${className ?? ""}`}>
      {/* 64px on a phone, 72px from md up — never taller, never overlapping
          content (every section clears it with scroll-mt). The 8px vertical
          margins live inside those heights, so the reserved space the
          sections already clear is unchanged.

          The bar carries nothing: no fill, no border, no colour transition —
          it is only a row of measurements. The dark chips on the nav links
          below are what gives the navbar its shape now. */}
      <div
        className="navbar-gutter relative mx-4 my-2 flex h-12 w-auto items-center justify-center rounded-[10px] backdrop-blur-xl backdrop-saturate-150 md:mx-6 md:h-14 md:bg-transparent md:backdrop-blur-none md:backdrop-saturate-100"
      >
        {/* Brand mark — small screens only. Below md the pill nav is hidden
            and the bar is the only navigation, so it needs a surface to sit
            on and something identifying at its leading edge; from md up the
            bar goes transparent again and the nav carries itself.

            Owner's portrait plus the HK monogram. The cutout is square with
            the subject centred, so a circular crop lands on the face without
            any repositioning, and the ring holds the circle when the page
            behind it is the same cream. `left-3` + `p-2` puts it 20px in —
            the same 1.25rem the mobile gutter uses — while keeping a 44px
            tap target. */}
        <a
          href="/"
          aria-label="Hiren Keraliya — home"
          className={`absolute left-3 flex items-center gap-2 rounded-md p-2 md:hidden ${tone}`}
        >
          <img
            src={BRAND_PORTRAIT}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(29,27,24,0.12)]"
          />
          <span className="text-xs font-semibold leading-none tracking-[0.1em]">
            HK.
          </span>
        </a>

        {/* Centered liquid pill nav — the active segment is filled and
            springs a neck into its neighbours. */}
        <GooeyNav
          aria-label="Primary"
          items={links}
          value={activeIndex}
          className="hidden md:block"
          /* The filled segment uses the deep copper, not raw --clay: white
             on #8F4C35 measures 6.5:1, on #B86543 only 4.2:1. */
          activeColor="var(--clay-deep)"
          activeLabelColor="var(--clay-foreground)"
          /* Every inactive segment is a dark chip. The bar itself carries no
             fill and no border any more, so these chips are the only thing
             giving the navbar an edge — --foreground for the fill, 78% white
             for the label, which measures 10.2:1. The active segment keeps
             the copper so the current section still reads. */
          idleColor="#1d1b18"
          idleLabelColor="rgba(255,255,255,0.78)"
        />

        {/* Mobile: three stacked lines. Closed they sit as an even triple;
            open, the outer two rotate into a X and the middle one fades out.

            Absolute, so `navbar-gutter`'s padding does not reach it — the
            insets below are what hold it off the bar. `right-3` + `size-9`
            puts the 20px-wide glyph exactly 20px (1.25rem) from the right
            edge, mirroring the portrait at 20px from the left; the old flush
            `right-0` had it touching the corner radius. The 36px box is also
            a larger tap target than the 32px it replaces. */}
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          className={`absolute right-3 flex size-9 shrink-0 items-center justify-center transition-colors duration-[350ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay md:hidden ${tone}`}
        >
          {/* Each bar carries exactly ONE translate-y class in either state.
              The old markup stacked `-translate-y-1/2` (centring) under the
              state's `-translate-y-[4px]`; both write --tw-translate-y, so the
              later rule won and the centring was silently dropped. That left
              the closed triple 1px out of step, and when open parked the two
              strokes 10px apart, so they crossed off-centre instead of forming
              an X. Anchored to `top-1/2` (the element's TOP edge at 8px of the
              16px box), the offsets are whole pixels: 4 / 8 / 12. */}
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 top-1/2 block h-px w-5 bg-current transition-[translate,rotate] duration-300 ease-out ${
                isMenuOpen ? "translate-y-0 rotate-45" : "-translate-y-[4px] rotate-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-px w-5 bg-current transition-opacity duration-200 ease-out ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-px w-5 bg-current transition-[translate,rotate] duration-300 ease-out ${
                isMenuOpen ? "translate-y-0 -rotate-45" : "translate-y-[4px] rotate-0"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel — height animates with grid rows, so no measured
          pixel height is needed; opacity/transform/visibility handle
          the fade and slide. */}
      <div
        id="mobile-menu"
        className={`mx-4 grid rounded-[10px] border-t border-[rgba(20,20,20,0.08)] transition-[grid-template-rows,opacity,translate,visibility] duration-[300ms] ease-out md:hidden ${
          isMenuOpen
            ? "visible grid-rows-[1fr] translate-y-0 opacity-100"
            : "invisible grid-rows-[0fr] -translate-y-2 opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <nav
            aria-label="Mobile"
            className="navbar-gutter mx-auto flex max-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col overflow-y-auto pb-5"
          >
            {links.map((link, i) => {
              const isActive = i === activeIndex;
              const itemTone = isActive ? "text-[#111]" : "text-[#111]/60";

              return (
                <a
                  key={link.href}
                  href={link.href}
                  ref={i === 0 ? firstMenuLinkRef : undefined}
                  onClick={closeMenu}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex items-center justify-between border-b border-[rgba(20,20,20,0.08)] py-3 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-[300ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay max-sm:py-2.5 ${itemTone}`}
                >
                  <span>{link.label}</span>
                  <span
                    aria-hidden="true"
                    className={`h-px w-5 transition-opacity duration-[300ms] ${
                      isActive ? "bg-clay opacity-100" : "bg-current opacity-0"
                    }`}
                  />
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
