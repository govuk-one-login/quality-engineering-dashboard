// See https://observablehq.com/framework/config for documentation.
export default {
  // The project’s title; used in the sidebar and webpage titles.
  title: "Quality Engineering Dashboard",

  pages: [
    {
      name: "DORA",
      pages: [
        {name: "Change lead time", path: "/dora/change-lead-time"},
        {name: "Deployment Frequency", path: "/dora/deployment-frequency"},
        {name: "Change failure rate", path: "/dora/change-failure-rate"},
        {name: "Failed Deployment Recovery Time", path: "/dora/failed-deployment-recovery-time"}
      ]
    },
    {
      "name": "Archived QE Reporting & Analysis",
      pages: [
        {name: "Nov 24 - Deployment Counts", path: "/qe-reporting-and-analysis/deployment-counts"}
      ]
    },
    {
      name: "Notes",
      pages: [
        {"name": "Why visualise", path: "/notes/why-visualise"},
        {"name": "Box Plot", path: "/notes/box-plot"},
      ]
    },
    {
      name: "Exploration",
      pages: [
        {"name": "Plots", path: "/explorations/plots"}
      ]
    }
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // dynamicPaths: []
  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // cleanUrls: true, // drop .html from URLs
};
