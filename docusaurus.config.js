const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: "Libonomy",
    tagline: "Documentation",
    url: "https://libonomy.com/",
    baseUrl: "/",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    favicon: "img/favicon.png",
    organizationName: "magnus mage", // Usually your GitHub org/user name.
    projectName: "libonomy", // Usually your repo name.
    themeConfig: {
        colorMode: {
            defaultMode: "light",
            disableSwitch: false,
            respectPrefersColorScheme: false,
        },

        navbar: {
            logo: {
                alt: "Libonomy Logo",
                src: "img/logo1.png",
            },
            items: [
                {
                    type: "doc",
                    docId: "Introduction/high-level-overview",
                    position: "right",
                    label: "Introduction",
                },
                { to: "/blog", label: "Blog", position: "right" },
                {
                    href: "https://github.com/facebook/docusaurus",
                    label: "GitHub",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "light",
            links: [
                {
                    title: "Docs",
                    // items: [
                    //   {
                    //     label: "Getting started",
                    //     to: "/docs/getting-started",
                    //   },
                    //   {
                    //     label: "Install Go",
                    //     to: "/docs/install-go",
                    //   },
                    //   {
                    //     label: "Cli Commands",
                    //     to: "/docs/cli-commands",
                    //   },
                    // ],
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
                        {
                            label: "Blog",
                            to: "/blog",
                        },
                        {
                            label: "GitHub",
                            href: "https://github.com/facebook/docusaurus",
                        },
                    ],
                },
            ],
            // copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
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
                    editUrl: "https://github.com/facebook/docusaurus/edit/master/website/",
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    editUrl: "https://github.com/facebook/docusaurus/edit/master/website/blog/",
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            },
        ],
    ],
};
