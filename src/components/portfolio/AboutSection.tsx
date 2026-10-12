/* AboutSection — an editorial spread in four bands.

   Band 1  the marker: 03 — ABOUT, on the page's left edge
   Band 2  the headline, both lines flush to the marker's left edge
   Band 3  "How I think": a full-width method strip — one row of five
           cells separated by hairlines, no fills and no panels
   Band 4  the profile: four paragraphs set as a two-column spread with
           a hairline column rule, indented to the headline's second
           line so the two left edges rhyme
           … closed by the discipline index on a full-width rule

   Nothing here is a card and nothing is centred. The palette is the
   section's existing tokens only — ink, muted, clay, clay-deep and the
   border hairline — and the two fonts the site already loads.
*/

import { keywords } from "@/lib/experience-data";
import { motion } from "framer-motion";
import "./about.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Scroll entrance — 500–800ms, 15–25px, once only. */
function rise(delay: number, distance = 15) {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: EASE, delay },
  };
}

/**
 * The four stages. Numbers are authored so "01" cannot drift to "1".
 * Labels are written in sentence case and uppercased in CSS, which keeps
 * the markup readable and the typography in one place.
 */
const STAGES = [
  { n: "01", name: "Question", desc: "Start with the problem." },
  { n: "02", name: "Explore", desc: "Understand the data." },
  { n: "03", name: "Model", desc: "Build and evaluate." },
  { n: "04", name: "Explain", desc: "Turn findings into action." },
];

/**
 * One reveal order for the whole section, read top to bottom: marker →
 * headline → method strip → its four steps → profile label → the four
 * paragraphs → the discipline line. Kept together so the cascade can be
 * read at a glance instead of diffing a dozen delay literals.
 */
const AT = {
  marker: 0,
  headline: 0.06,
  method: 0.12,
  step: (i: number) => 0.16 + i * 0.05,
  label: 0.2,
  paragraph: (i: number) => 0.24 + i * 0.06,
  discipline: 0.5,
  keyword: (i: number) => 0.54 + i * 0.04,
};

export function AboutSection() {
  const paragraphs = [
    <>
      I earned a{" "}
      <em className="about-em">Bachelor of Computer Applications (BCA)</em> at{" "}
      <em className="about-em">Silver Oak University in Ahmedabad</em>. I like
      data science, machine learning, AI, and data analytics. I use data to find
      patterns, solve problems, and build models that make predictions.
    </>,
    <>
      During my BCA, I learned{" "}
      <em className="about-em">web development</em> with{" "}
      <em className="about-em">
        HTML, CSS, JavaScript, PHP, MySQL, and Bootstrap
      </em>
      . For my final-year project, I helped build{" "}
      <em className="about-em">Krushi Manch</em>. It is a multilingual website
      that gives farmers digital services. I gained experience building both
      the front and back ends and working with a team.
    </>,
    <>
      I took a{" "}
      <em className="about-em">Data Science course at Datamites</em>. I learned{" "}
      <em className="about-em">
        Python, NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, SQL, and
        statistics
      </em>
      . I also studied machine learning, data visualization, and exploratory
      data analysis (EDA). I cleaned real data, picked useful features, built
      and tuned models, and checked their results.
    </>,
    <>
      I want to become a{" "}
      <em className="about-em">data scientist</em>. I want to use data to solve
      real problems and keep learning about{" "}
      <em className="about-em">
        data science, machine learning, and artificial intelligence
      </em>
      .
    </>,
  ];

  return (
    <div className="about-section">
      {/* Band 1 — the marker, on the copy's left edge */}
      <motion.div className="about-marker" {...rise(AT.marker)}>
        <span className="about-marker__index">03</span>
        <span className="about-marker__rule" />
        <span className="about-label">About</span>
      </motion.div>

      {/* Band 2 — the headline. Two authored lines, both flush left. */}
      <motion.h2 className="about-headline" {...rise(AT.headline, 25)}>
        <span className="about-headline__line">Curious about data,</span>
        <span className="about-headline__line">
          serious about what it{" "}
          <span className="about-headline__accent">proves.</span>
        </span>
      </motion.h2>

      {/* Band 3 — the method strip */}
      <motion.section className="about-method" {...rise(AT.method, 0)}>
        <h3 className="about-method__title">How I think</h3>

        <ol className="about-method__list">
          {STAGES.map((stage, i) => (
            <motion.li
              key={stage.n}
              className="about-method__step"
              {...rise(AT.step(i), 14)}
            >
              <span className="about-method__num">{stage.n}</span>
              <span className="about-method__name">{stage.name}</span>
              <span className="about-method__desc">{stage.desc}</span>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      {/* Band 4 — the profile spread */}
      <div className="about-profile">
        <motion.div className="about-label-row" {...rise(AT.label)}>
          <span className="about-label">Profile</span>
          <span className="about-rule" />
        </motion.div>

        <div className="about-prose">
          {paragraphs.map((content, i) => (
            <motion.p
              key={i}
              className="about-paragraph"
              {...rise(AT.paragraph(i))}
            >
              {content}
            </motion.p>
          ))}
        </div>
      </div>

      {/* Closing band — the discipline index */}
      <motion.div className="about-discipline" {...rise(AT.discipline)}>
        <span className="about-discipline__rule" />
        <div className="about-keywords">
          {keywords.map((word, i) => (
            <motion.span
              key={word}
              className="about-keyword"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                ease: EASE,
                delay: AT.keyword(i),
              }}
            >
              {i > 0 && <span className="about-keyword__sep">/</span>}
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
