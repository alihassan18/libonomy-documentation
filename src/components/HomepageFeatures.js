import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: "Interoperable",
    Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        While other blockchains allow access only to their own ecosystem,
        Libonomy supports all blockchains.
      </>
    ),
  },
  {
    title: "Scalable",
    Svg: require("../../static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        One of the lowest requirements to join and earn in the network, while
        providing the highest transaction speed in the blockchain industry.
      </>
    ),
  },
  {
    title: "Decentralized and Fair",
    Svg: require("../../static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        Unlike POW and POS systems, Libonomy's reward distribution is fair,
        allowing everybody to participate and get a fair share.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
