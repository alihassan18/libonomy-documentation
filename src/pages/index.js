import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  // console.log("siteConfig", siteConfig);
  return (
    // <header className={clsx("hero hero--primary", styles.heroBanner)}>
    //   <div className="container">
    //     <h1 className="hero__title">{siteConfig.title}</h1>
    //     <p className="hero__subtitle">{siteConfig.tagline}</p>
    //     <div className={styles.buttons}>
    //       <Link
    //         className="button button--secondary button--lg"
    //         to="/docs/getting-started"
    //       >
    //         Libonomy Tutorial - 5min ⏱️
    //       </Link>
    //     </div>
    //   </div>
    // </header>

    <div className={clsx(styles.heroBanner)}>
      <div className="container">
        <div className={clsx(styles.bannerSection)}>
          <div className={(clsx("col col--6"), styles.bannerContent)}>
            <div className={styles.bannerContentWrapper}>
              <div className={styles.title}>Become a master</div>
              <div className={styles.subHeading}>Documentation for the</div>
              <div className={styles.heading}>Libonomy Blockchain</div>
              <div className={styles.description}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum
              </div>
              <div className={styles.btnContainer}>
                <button className={styles.btnPrimay}>Read doc</button>
                <button className={styles.btnStart}>
                  <img
                    src={require("../../static/img/icon-play.png").default}
                    alt="image"
                    className={styles.iconPlay}
                  />
                  Start Tutorial
                </button>
              </div>
            </div>
            <div className={clsx("col col--6")}>
              <img
                src={require("../../static/img/laptop-img.png").default}
                alt="image"
                className={styles.banImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscribeNow() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <div className={clsx(styles.subscibeWrapper)}>
      <div className="container">
        <div className={styles.subscribeContent}>
          <div>
            <div className={styles.subscribetitle}>Subscrible now</div>
            <div className={styles.subscribeHeading}>
              Get every single update you will get
            </div>
          </div>
          <div>
            <input
              placeholder="Enter email address"
              className={styles.subscribeInput}
            />
            <button className={styles.subscribeButton}>Subscrible now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <>
      <Layout
        // title={`${siteConfig.title}`}
        description="Description will go into a meta tag in <head />"
      >
        <HomepageHeader />
        <HomepageFeatures />
        <SubscribeNow />
      </Layout>
    </>
  );
}
