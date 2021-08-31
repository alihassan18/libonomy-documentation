import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';
import useThemeContext from "@theme/hooks/useThemeContext";

const FeatureList = [
  {
    title: "Interoperable",
    Svg: require("../../static/img/molecular.png").default,
    description: (
      <>
        While other blockchains allow access only to their own ecosystem,
        Libonomy supports all blockchains.
      </>
    ),
  },
  {
    title: "Scalable",
    Svg: require("../../static/img/arrow.png").default,
    description: (
      <>
        While other blockchains allow access only to their own ecosystem,
        Libonomy supports all blockchains.
      </>
    ),
  },
  {
    title: "Decentralized and Fair",
    Svg: require("../../static/img/decent.png").default,
    description: (
      <>
        While other blockchains allow access only to their own ecosystem,
        Libonomy supports all blockchains.
      </>
    ),
  },
];

function Feature({ Svg, title, description, isDarkTheme }) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.featureContainer}>
        <div className={styles.featureImgContainer}>
          <img src={Svg} className={styles.featureSvg} alt={title} />
        </div>
        <div className={isDarkTheme ? styles.imgMaskDark : styles.imgMask} />
        <div className={("text--center padding-horiz--md", styles.featureCard)}>
          <div className={styles.featureCardTitle}>{title}</div>
          <p className={styles.featureCardDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  const { isDarkTheme, setLightTheme, setDarkTheme } = useThemeContext();
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionTitle}>Libonomy Exclusive Feature </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} isDarkTheme={isDarkTheme} />
          ))}
        </div>
      </div>
    </section>
  );
}
