import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";
import useThemeContext from "@theme/hooks/useThemeContext";

const FeatureList = [
    {
        title: "Interoperable",
        Svg1: require("../../static/img/moleculerLight.png").default,
        Svg2: require("../../static/img/moleculerDark.png").default,
        description: (
            <>
                While other blockchains allow access only to their own ecosystem, Libonomy supports
                all blockchains.
            </>
        ),
    },
    {
        title: "Scalable",
        Svg1: require("../../static/img/arrowLight.png").default,
        Svg2: require("../../static/img/arrowDark.png").default,
        description: (
            <>
                While other blockchains allow access only to their own ecosystem, Libonomy supports
                all blockchains.
            </>
        ),
    },
    {
        title: "Decentralized and Fair",
        Svg1: require("../../static/img/decentLight.png").default,
        Svg2: require("../../static/img/decentDark.png").default,
        description: (
            <>
                While other blockchains allow access only to their own ecosystem, Libonomy supports
                all blockchains.
            </>
        ),
    },
];

function Feature({ Svg1, Svg2, title, description, isDarkTheme }) {
    return (
        <div className={clsx("col col--4")}>
            <div className={styles.featureContainer}>
                {/* <div className={styles.featureImgContainer}>
                    <img src={Svg} className={styles.featureSvg} alt={title} />
                </div> */}
                <div className={styles.imgMask}>
                    <div className={isDarkTheme ? styles.imgMaskDark : styles.imgMaskLight}>
                        <img
                            src={isDarkTheme ? Svg2 : Svg1}
                            className={styles.featureSvg}
                            alt={title}
                        />
                        <div
                            className={
                                isDarkTheme
                                    ? styles.featureCardTitleDark
                                    : styles.featureCardTitleLight
                            }>
                            {title}
                        </div>
                    </div>
                </div>
                <div className={("text--center padding-horiz--md", styles.featureCard)}>
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
                <div className={isDarkTheme ? styles.sectionTitleDark : styles.sectionTitleLight}>
                    Libonomy Exclusive Feature{" "}
                </div>
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} isDarkTheme={isDarkTheme} />
                    ))}
                </div>
            </div>
        </section>
    );
}
