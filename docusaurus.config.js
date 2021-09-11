const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: "Libonomy Documentation | Libonomy Documentation",
    tagline: "Documentation",
    url: "https://libonomy.com/",
    baseUrl: "/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.png",
    organizationName: "Libonomy", // Usually your GitHub org/user name.
    projectName: "libonomy", // Usually your repo name.
    themeConfig: {
        colorMode: {
            defaultMode: "light",
            disableSwitch: false,
            respectPrefersColorScheme: false,
        },

        navbar: {
            // title: "LIBONOMY",
            logo: {
                alt: "Libonomy Logo",
                src: "img/logo1.png",
            },
            items: [
                {
                    type: "doc",
                    docId: "Introduction/high-level-overview",
                    position: "right",
                    label: "Quick Start",
                },
                // { to: "/blog", label: "Blog", position: "right" },
                {
                    href: "https://github.com/libonomy",
                    label: "GitHub",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "light",

            links: [
                {
                    title: "Libonomy",
                    items: [
                        {
                            html: `
                                <p>Libonomy LTD | 483 Green Lanes, N13 4BS | London United Kingdom
                                </br>info@libonomy.com</br>
                                +44 742 458 6677
                                </p>
                              `,
                        },
                    ],
                },
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Quick Start",
                            to: "/docs/Introduction/high-level-overview",
                        },
                        {
                            label: "Installation",
                            to: "/docs/Guide/install-cusp",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            href: "https://discord.com/invite/6P9SX5c",
                        },
                        {
                            label: "Twitter",
                            href: "https://twitter.com/libonomy",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        // {
                        //     label: "Blog",
                        //     to: "/blog",
                        // },
                        {
                            label: "GitHub",
                            href: "https://github.com/libonomy",
                        },
                    ],
                },
            ],

            copyright: "© Libonomy (2021). All rights reserved.",
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme,
        },
    },
    presets: [
        [
            "@docusaurus/preset-classic",
            {
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    editUrl: "https://github.com/libonomy",
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            },
        ],
    ],
};
