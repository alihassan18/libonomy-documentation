import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./index.module.css";
import HomepageFeatures from "../components/HomepageFeatures";
import useThemeContext from "@theme/hooks/useThemeContext";
import { Link } from "react-router-dom";
// function Feature({ Svg, title, description, isDarkTheme }) {
//     return (
//         <div className={clsx("col col--4")}>
//             <div className={styles.featureContainer}>
//                 <div className={styles.featureImgContainer}>
//                     <img src={Svg} className={styles.featureSvg} alt={title} />
//                 </div>
//                 <div className={isDarkTheme ? styles.imgMaskDark : styles.imgMask} />
//                 <div className={("text--center padding-horiz--md", styles.featureCard)}>
//                     <div className={styles.featureCardTitle}>{title}</div>
//                     <p className={styles.featureCardDescription}>{description}</p>
//                 </div>
//             </div>
//         </div>
//     );
// }
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  const { isDarkTheme, setLightTheme, setDarkTheme } = useThemeContext();
  return (
    <div className={clsx(styles.heroBanner)}>
      <div className="container">
        <div className={clsx(styles.bannerSection)}>
          <div className={(clsx("col col-md-8"), styles.bannerContent)}>
            <div className={styles.bannerContentWrapper}>
              <div
                className={isDarkTheme ? styles.titleDark : styles.titleLight}
              >
                Libonomy 
              </div>
              <div
                className={
                  isDarkTheme ? styles.descriptionDark : styles.descriptionLight
                }
              >
                Interoperable, scalable and AI based blockchain technology that
                allows communities and companies to create faster and more
                secure decentralized cross chain solutions - digital asset
                lending and borrowing, virtual storage, hedging and even
                power-sharing between units 
              </div>
              <div
                className={
                  isDarkTheme ? styles.headingDark : styles.headingLight
                }
              >
                Documentation
              </div>
              <div className={styles.end}>
                <div
                  className={
                    isDarkTheme ? styles.subHeadingDark : styles.subHeadingLight
                  }
                >
                  Quick Guide
                </div>
              </div>
              <div className={styles.btnContainer}>
                <div
                  className={
                    isDarkTheme ? styles.btnPrimayDark : styles.btnPrimayLight
                  }
                >
                  {isDarkTheme ? (
                    <Link to="/docs/Introduction/high-level-overview">
                      <img
                        src={require("../../static/img/bookDark.png").default}
                        alt="image"
                        className={styles.iconPlay}
                      />
                    </Link>
                  ) : (
                    <Link to="/docs/Introduction/high-level-overview">
                      <img
                        src={require("../../static/img/bookLight.png").default}
                        alt="image"
                        className={styles.iconPlay}
                      />
                    </Link>
                  )}
                  SDK
                </div>
                <div
                  className={
                    isDarkTheme ? styles.btnPrimayDark : styles.btnPrimayLight
                  }
                >
                  {isDarkTheme ? (
                    <Link to="/">
                      <img
                        src={require("../../static/img/playDark.png").default}
                        alt="image"
                        className={styles.iconPlay}
                      />
                    </Link>
                  ) : (
                    <Link to="/">
                      <img
                        src={require("../../static/img/playLight.png").default}
                        alt="image"
                        className={styles.iconPlay}
                      />
                    </Link>
                  )}
                  Tutorials (Soon)
                </div>
              </div>
            </div>
            <div className={clsx("col col--6")}>
              {isDarkTheme ? (
                <img
                  src={require("../../static/img/personDark.png").default}
                  alt="image"
                  className={styles.banImage}
                />
              ) : (
                <img
                  src={require("../../static/img/personLight.png").default}
                  alt="image"
                  className={styles.banImage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscribeNow() {
  const { siteConfig } = useDocusaurusContext();
  const { isDarkTheme } = useThemeContext();
  return (
    <div
      className={
        isDarkTheme
          ? clsx(styles.subscibeWrapperDark)
          : clsx(styles.subscibeWrapperLight)
      }
    >
      <div className="container">
        <div className={styles.subscribeContent}>
          <div>
            <div
              className={
                isDarkTheme
                  ? styles.subscribetitleDark
                  : styles.subscribetitleLight
              }
            >
              Subscribe now!
            </div>
            <div
              className={
                isDarkTheme
                  ? styles.subscribeHeadingDark
                  : styles.subscribeHeadingLight
              }
            >
              Get our latest News and Docs in your INBOX.
            </div>
          </div>
          <div>
            <input
              placeholder="Enter email address"
              className={
                isDarkTheme
                  ? styles.subscribeInputDark
                  : styles.subscribeInputLight
              }
            />
            <button
              className={
                isDarkTheme
                  ? styles.subscribeButtonDark
                  : styles.subscribeButtonLight
              }
            >
              Subscribe 
            </button>
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
