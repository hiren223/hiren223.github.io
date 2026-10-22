/**
 * SiteHeader — shared portfolio navbar.
 * Logo visible on mobile, tablet, and desktop.
 */

import { GooeyNav } from "@/components/portfolio/GooeyNav";
import { useEffect, useRef, useState } from "react";

const BRAND_PORTRAIT = `${import.meta.env.BASE_URL}assets/fav-icon.png`;

export type HeaderLink = {
  label: string;
  href: string;
};

export type SiteHeaderProps = {
  links: HeaderLink[];
  activeIndex: number;
  className?: string;
};

export function SiteHeader({
  links,
  activeIndex,
  className,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  const tone = "text-[#1d1b18]";

  const closeMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  // Focus the first link when the mobile menu opens.
  useEffect(() => {
    if (isMenuOpen) {
      firstMenuLinkRef.current?.focus();
    }
  }, [isMenuOpen]);

  // Lock background scrolling while the mobile menu is open.
  useEffect(() => {
    if (!isMenuOpen) return;

    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";

    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`;
    }

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [isMenuOpen]);

  // Close the menu when resizing from mobile to desktop.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 769px)");

    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };

    desktop.addEventListener("change", onChange);

    return () => {
      desktop.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1000] ${
        className ?? ""
      }`}
    >
      <div
        className="
          navbar-gutter relative mx-4 my-2
          flex h-12 w-auto items-center justify-center
          rounded-[10px] backdrop-blur-xl backdrop-saturate-150
          md:mx-6 md:h-14
          md:bg-transparent md:backdrop-blur-none
          md:backdrop-saturate-100
        "
      >
        {/* BRAND LOGO — visible at every screen size */}
        <a
          href="#top"
          aria-label="Hiren Keraliya — home"
          className={`
            absolute left-3 z-20
            flex items-center gap-2 rounded-md p-2
            transition-colors
            ${tone}
          `}
        >
          <img
            src={BRAND_PORTRAIT}
            alt=""
            width={28}
            height={28}
            className="
              size-7 shrink-0 rounded-full
              object-cover
              ring-1 ring-[rgba(29,27,24,0.12)]
            "
          />

          <span
            className=" logo-text
              whitespace-nowrap text-xs font-semibold
              leading-none tracking-[0.1em]
            "
          >
            HK.
          </span>
        </a>

        {/* DESKTOP NAVIGATION */}
        <GooeyNav
          aria-label="Primary"
          items={links}
          value={activeIndex}
          className="hidden md:block"
          activeColor="var(--clay-deep)"
          activeLabelColor="var(--clay-foreground)"
          idleColor="#1d1b18"
          idleLabelColor="rgba(255,255,255,0.78)"
        />

        {/* MOBILE HAMBURGER */}
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          className={`
            absolute right-3 z-20
            flex size-9 shrink-0 items-center justify-center
            transition-colors duration-[350ms]
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-clay
            md:hidden
            ${tone}
          `}
        >
          <span
            className="relative block h-4 w-5"
            aria-hidden="true"
          >
            {/* Top line */}
            <span
              className={`
                absolute left-0 top-1/2
                block h-px w-5 bg-current
                transition-[translate,rotate]
                duration-300 ease-out
                ${
                  isMenuOpen
                    ? "translate-y-0 rotate-45"
                    : "-translate-y-[4px] rotate-0"
                }
              `}
            />

            {/* Middle line */}
            <span
              className={`
                absolute left-0 top-1/2
                block h-px w-5 bg-current
                transition-opacity duration-200 ease-out
                ${isMenuOpen ? "opacity-0" : "opacity-100"}
              `}
            />

            {/* Bottom line */}
            <span
              className={`
                absolute left-0 top-1/2
                block h-px w-5 bg-current
                transition-[translate,rotate]
                duration-300 ease-out
                ${
                  isMenuOpen
                    ? "translate-y-0 -rotate-45"
                    : "translate-y-[4px] rotate-0"
                }
              `}
            />
          </span>
        </button>
      </div>

      {/* MOBILE MENU PANEL */}
      <div
        id="mobile-menu"
        className={`
          mx-4 grid rounded-[10px]
          border-t border-[rgba(20,20,20,0.08)]
          transition-[grid-template-rows,opacity,translate,visibility]
          duration-[300ms] ease-out
          md:hidden
          ${
            isMenuOpen
              ? "visible grid-rows-[1fr] translate-y-0 opacity-100"
              : "invisible grid-rows-[0fr] -translate-y-2 opacity-0"
          }
        `}
      >
        <div className="overflow-hidden">
          <nav
            aria-label="Mobile"
            className="
              navbar-gutter mx-auto flex w-full max-w-6xl
              max-h-[calc(100svh-4rem)]
              flex-col overflow-y-auto pb-5
            "
          >
            {links.map((link, index) => {
              const isActive = index === activeIndex;
              const itemTone = isActive
                ? "text-[#111]"
                : "text-[#111]/60";

              return (
                <a
                  key={link.href}
                  href={link.href}
                  ref={
                    index === 0
                      ? firstMenuLinkRef
                      : undefined
                  }
                  onClick={closeMenu}
                  aria-current={isActive ? "true" : undefined}
                  className={`
                    flex items-center justify-between
                    border-b border-[rgba(20,20,20,0.08)]
                    py-3 text-[11px] font-medium uppercase
                    tracking-[0.2em]
                    transition-colors duration-[300ms]
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-clay
                    max-sm:py-2.5
                    ${itemTone}
                  `}
                >
                  <span>{link.label}</span>

                  <span
                    aria-hidden="true"
                    className={`
                      h-px w-5 transition-opacity duration-[300ms]
                      ${
                        isActive
                          ? "bg-clay opacity-100"
                          : "bg-current opacity-0"
                      }
                    `}
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
