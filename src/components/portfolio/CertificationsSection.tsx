/**
 * CertificationsSection — a curated archive of credentials.
 *
 * Two tiers, not three cards. The featured credential is set at display
 * scale with its result as a numeral; the supporting credentials follow as
 * a numbered ledger divided by hairlines. The tier is carried by type size,
 * the index column and the rules — there is no badge, panel, gradient or
 * glow anywhere in here, and no card in sight.
 *
 * `.certifications-archive` opens with a rule, gives one rule to each entry
 * and closes with a rule, so the whole section reads as one catalogue rather
 * than as a stack of boxes.
 *
 * No certificate file and no verification URL exists for any of these
 * credentials in the project, so no "view certificate" action is offered:
 * a link that 404s would be worse than no link at all.
 */
import { certifications } from "@/lib/experience-data";
import { motion, MotionConfig } from "framer-motion";
import "./certifications.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * The entry's position in the archive, "01"–"03", read from the data order
 * rather than hard-coded, so inserting a credential renumbers the ledger.
 */
const seq = (entry: (typeof certifications)[number]) =>
  String(certifications.indexOf(entry) + 1).padStart(2, "0");

/** One reveal order for the section, read top to bottom. */
const AT = {
  marker: 0,
  headline: 0.06,
  intro: 0.12,
  entry: (i: number) => 0.18 + i * 0.07,
};

/** Scroll entrance — 14–22px, 0.7s, once only. */
function rise(delay: number, distance = 16) {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-70px" },
    transition: { duration: 0.7, ease: EASE, delay },
  };
}

export function CertificationsSection() {
  /* The tier comes from the data, not from the array's position. */
  const featured = certifications.find((cert) => cert.featured);
  const supporting = certifications.filter((cert) => !cert.featured);

  return (
    <MotionConfig reducedMotion="user">
      <div className="certifications-section">
        <header className="certifications-header">
          <motion.div className="certifications-marker" {...rise(AT.marker)}>
            <span className="certifications-marker__index">05</span>
            <span className="certifications-marker__rule" />
            <span className="certifications-label">Certifications</span>
          </motion.div>

          <motion.h2
            className="certifications-headline"
            {...rise(AT.headline, 22)}
          >
            <span className="certifications-headline__line">
              Credentials earned.
            </span>
            <span className="certifications-headline__line">
              Knowledge{" "}
              <span className="certifications-headline__accent">applied</span>.
            </span>
          </motion.h2>

          <motion.p className="certifications-intro" {...rise(AT.intro)}>
            Professional learning across data science, analytics, and applied
            technology.
          </motion.p>
        </header>

        <div className="certifications-archive">
          {/* 01 — the featured credential */}
          {featured ? (
            <motion.article
              className="certifications-featured"
              {...rise(AT.entry(0))}
            >
              <div className="certifications-featured__top">
                <span className="certifications-index">{seq(featured)}</span>
                <span className="certifications-issuer">{featured.issuer}</span>
              </div>

              <div className="certifications-featured__lead">
                <h3 className="certifications-featured__title">
                  {featured.name}
                </h3>
                <p className="certifications-featured__detail">
                  {featured.detail}
                </p>
              </div>

              {/* The result, as type — the largest thing on the page's
                  smallest band. The award says what the numeral was for. */}
              <p className="certifications-score">
                <span className="certifications-score__num">
                  {featured.score}
                </span>
                <span className="certifications-score__award">
                  {featured.award}
                </span>
              </p>

              <p className="certifications-meta">{featured.meta}</p>
            </motion.article>
          ) : null}

          {/* 02, 03 — the supporting ledger */}
          <ol className="certifications-list">
            {supporting.map((cert, i) => (
              <motion.li
                key={cert.name}
                className="certifications-item"
                {...rise(AT.entry(i + 1), 14)}
              >
                <span className="certifications-index">{seq(cert)}</span>

                <div className="certifications-item__body">
                  <h3 className="certifications-item__title">{cert.name}</h3>
                  <p className="certifications-issuer">{cert.issuer}</p>
                  <p className="certifications-item__meta">
                    {cert.detail}
                    <span className="certifications-dot">·</span>
                    {cert.meta}
                  </p>
                </div>

                <span className="certifications-item__result">
                  {cert.result}
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </MotionConfig>
  );
}
