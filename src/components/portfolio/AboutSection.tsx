import { keywords } from "@/lib/experience-data";
import { motion } from "framer-motion";
import "./about.css";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function rise(delay: number, distance = 15) {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: EASE, delay },
  };
}

const STAGES = [
  { n: "01", name: "Question", desc: "Start with the problem." },
  { n: "02", name: "Explore", desc: "Understand the data." },
  { n: "03", name: "Model", desc: "Build and evaluate." },
  { n: "04", name: "Explain", desc: "Turn findings into action." },
];

const AT = {
  marker: 0,
  headline: 0.06,
  method: 0.12,
  step: (i: number) => 0.16 + i * 0.05,
  label: 0.2,
  paragraph: (i: number) => 0.24 + i * 0.06,
  discipline: 0.5,
};

const SKILLS = [
  "Python",
  "SQL",
  "Data Science",
  "Machine Learning",
  "Deep Learning",
  "Artificial Intelligence",
  "Pandas",
  "NumPy",
  "Scikit-learn",
  "Data Analysis",
  "Statistics",
  "EDA",
  "Power BI",
  "Tableau",
  "Data Visualization",
  "Feature Engineering",
  "Model Evaluation",
  "Predictive Analytics",
  "JavaScript",
  "MySQL",
];

const SKILLS_SECOND = [
  "Data Cleaning",
  "Data Preprocessing",
  "Feature Engineering",
  "Exploratory Data Analysis",
  "Missing Value Handling",
  "Outlier Detection",
  "Feature Selection",
  "Data Encoding",
  "Feature Scaling",
  "Model Training",
  "Hyperparameter Tuning",
  "Model Evaluation",
  "Cross Validation",
  "ROC-AUC Analysis",
  "Model Deployment",
];

export function AboutSection() {
  const paragraphs = [
    <>
      I earned a{" "}
      <em className="about-em">
        Bachelor of Computer Applications (BCA)
      </em>{" "}
      at{" "}
      <em className="about-em">
        Silver Oak University in Ahmedabad
      </em>
      . I am interested in data science, machine learning, AI, and data
      analytics. I use data to discover patterns, solve problems, and build
      predictive models.
    </>,
    <>
      During my BCA, I learned{" "}
      <em className="about-em">web development</em> with{" "}
      <em className="about-em">
        HTML, CSS, JavaScript, PHP, MySQL, and Bootstrap
      </em>
      . For my final-year project, I helped build{" "}
      <em className="about-em">Krushi Manch</em>, a multilingual website
      providing digital services for farmers. This gave me experience in
      frontend development, backend development, and teamwork.
    </>,
    <>
      I completed a{" "}
      <em className="about-em">Data Science course at Datamites</em>,
      where I studied{" "}
      <em className="about-em">
        Python, NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, SQL,
        and statistics
      </em>
      . I practised exploratory data analysis, data cleaning, feature
      engineering, model training, hyperparameter tuning, and evaluation.
    </>,
    <>
      My goal is to become a{" "}
      <em className="about-em">data scientist</em> who turns complex data
      into useful insights. I am continually developing my skills in{" "}
      <em className="about-em">
        data science, machine learning, and artificial intelligence
      </em>{" "}
      while building practical projects that address real-world problems.
    </>,
  ];

  return (
    <div className="about-section">
      {/* Band 1 — section marker */}
      <motion.div className="about-marker" {...rise(AT.marker)}>
        <span className="about-marker__index">03</span>
        <span className="about-marker__rule" />
        <span className="about-label">About</span>
      </motion.div>

      {/* Band 2 — headline */}
      <motion.h2
        className="about-headline"
        {...rise(AT.headline, 25)}
      >
        <span className="about-headline__line">
          Curious about data,
        </span>
        <span className="about-headline__line">
          serious about what it{" "}
          <span className="about-headline__accent">proves.</span>
        </span>
      </motion.h2>

      {/* Band 3 — method strip */}
      <motion.section
        className="about-method"
        {...rise(AT.method, 0)}
      >
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

      {/* Band 4 — profile */}
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

      {/* Closing band — continuously moving skill index */}
      <motion.div
        className="about-discipline"
        {...rise(AT.discipline)}
      >
        <span className="about-discipline__rule" />

        <div
          className="about-skills-marquee"
          role="region"
          aria-label="Technical skills"
        >
          <div className="about-skills-marquee__track">
            {[0, 1].map((copy) => (
              <div
                className="about-skills-marquee__group"
                key={copy}
                aria-hidden={copy === 1}
              >
                {SKILLS.map((skill, i) => (
                  <span
                    className="about-keyword"
                    key={`${copy}-${skill}`}
                  >
                    <span>{skill}</span>
                    <span
                      className="about-keyword__diamond"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>

     
<div className="about-skills-marquee about-skills-marquee--reverse">
  <div className="about-skills-marquee__track">
    {[...SKILLS_SECOND, ...SKILLS_SECOND].map((skill, index) => (
      <div
        className="about-skills-marquee__group"
        key={`${skill}-${index}`}
      >
        <span className="about-keyword">{skill}</span>
        <span className="about-keyword__diamond">✦</span>
      </div>
    ))}
  </div>
</div>

        </div>

      </motion.div>
    </div>
  );
}

export default AboutSection;