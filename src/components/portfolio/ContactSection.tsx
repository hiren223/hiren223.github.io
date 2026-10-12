/**
 * ContactSection — the closing page of the portfolio.
 *
 * Two columns and no form: the invitation on the left (marker, headline,
 * one paragraph, the email action) and the directory on the right, set as
 * a ledger of hairlines rather than as a grid of social cards.
 *
 * The data is not restated here. `contacts` is the page's own CONTACTS
 * array — the same one the footer's icon row is derived from — so a value
 * can never appear in one place and disagree with the other, and the
 * availability line reads the array's Status entry instead of hard-coding
 * a claim about availability.
 *
 * Every row keeps the same three cells (index, label + value, indicator),
 * including the one entry with no href: that is what holds the values on
 * one left edge instead of letting each row size itself.
 */
import { motion, MotionConfig } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import "./contact.css";

export type ContactEntry = {
  label: string;
  value: string;
  href: string | null;
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** One reveal order for the section, read top to bottom. */
const AT = {
  marker: 0,
  headline: 0.06,
  intro: 0.12,
  action: 0.18,
  row: (i: number) => 0.22 + i * 0.06,
};

/** Scroll entrance — 14–22px, 0.7s, once only. */
function rise(delay: number, distance = 18) {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-70px" },
    transition: { duration: 0.7, ease: EASE, delay },
  };
}

export function ContactSection({
  contacts,
  email,
}: {
  contacts: readonly ContactEntry[];
  email: string;
}) {
  /* The availability line comes from the data, not from a literal. */
  const status = contacts.find((contact) => contact.label === "Status");

  return (
    <MotionConfig reducedMotion="user">
      <div className="contact-section">
        <div className="contact-grid">
          {/* ---------- left: the invitation ---------- */}
          <div className="contact-invite">
            <motion.div className="contact-marker" {...rise(AT.marker)}>
              <span className="contact-marker__index">06</span>
              <span className="contact-marker__rule" />
              <span className="contact-label">Contact</span>
            </motion.div>

            {/* Three authored lines, not two. Measured, the phrase set as
                "Let's make something" is 728px at the headline's 72px, and
                the invitation column is 718px at 1440 — so any two-line
                version of this headline breaks in the same place no matter
                how the type is scaled, only a pixel or two from fitting.
                Set as three short lines the break is the design's, and the
                widest of them is 405px, which clears every column from
                1440 down to 320. */}
            <motion.h2
              className="contact-headline"
              {...rise(AT.headline, 22)}
            >
              <span className="contact-headline__line">Let&apos;s make</span>
              <span className="contact-headline__line">something</span>
              <span className="contact-headline__line">
                <span className="contact-headline__accent">meaningful</span>.
              </span>
            </motion.h2>

            <motion.p className="contact-intro" {...rise(AT.intro)}>
              Have a role, a collaboration, or a data problem worth exploring?
              I&apos;d be glad to hear from you.
            </motion.p>

            <motion.div className="contact-actions" {...rise(AT.action, 14)}>
              {status ? (
                <p className="contact-status">
                  <span className="contact-status__dot" aria-hidden="true" />
                  {status.value}
                </p>
              ) : null}

              {/* The main action on the page. The address is on the button's
                  own title attribute rather than in the label, so the label
                  stays a verb and the mail client still opens. */}
              <a
                className="contact-cta"
                href={`mailto:${email}`}
                title={email}
              >
                Get in touch
                <ArrowUpRight aria-hidden="true" className="contact-cta__arrow" />
              </a>
            </motion.div>
          </div>

          {/* ---------- right: the directory ---------- */}
          <ol className="contact-list">
            {contacts.map((contact, i) => {
              const external = contact.href?.startsWith("http") ?? false;

              const cells = (
                <>
                  <span className="contact-row__index">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span className="contact-row__body">
                    <span className="contact-row__label">{contact.label}</span>
                    <span className="contact-row__value">{contact.value}</span>
                  </span>

                  {/* Always present, so every row has the same three tracks
                      and the values line up down the ledger. */}
                  <span className="contact-row__arrow" aria-hidden="true">
                    {contact.href ? (
                      <ArrowUpRight className="contact-row__glyph" />
                    ) : null}
                  </span>
                </>
              );

              const shared = {
                className: "contact-row__inner",
                ...rise(AT.row(i), 12),
              };

              return (
                <li className="contact-row" key={contact.label}>
                  {contact.href ? (
                    <motion.a
                      href={contact.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      {...shared}
                    >
                      {cells}
                      {external ? (
                        <span className="contact-sr">
                          opens in a new tab
                        </span>
                      ) : null}
                    </motion.a>
                  ) : (
                    <motion.div {...shared}>{cells}</motion.div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </MotionConfig>
  );
}
