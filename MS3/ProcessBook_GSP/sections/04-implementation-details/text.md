# 03 Implementation Details

After settling on the visualizations, we built the website as a single-page scrolling experience (tested on Chrome and Safari). For the second milestone, we had a first running version with the basic skeleton and first drafts of the charts, which we completed into the full interactive version for the third. We first sketched each visualization on paper and with a digital stylus during team meetings, then implemented them in the browser - the charts are hand-built directly with SVG inside React components, complemented by a few specialised libraries.

## Main tech stack

- React + TypeScript: The whole site is a React single-page app in TypeScript for type safety and reusable, maintainable components.
- Vite: A fast modern build tool for development and bundling, giving instant live reload while iterating on the charts.
- WebGL / SVG: The two globes are rendered in WebGL via *react-globe.gl* (Three.js under the hood), while the scatter plot and methodology charts are drawn directly as SVG with custom scales and log axes.
- Specialised libraries: racing-bars (the bar chart race) and framer-motion (layout animation).
- Python · pandas / NumPy: Milestone-1 analysis and all pre-processing: code reconciliation, merging, deriving population, and fitting the per-event regressions exported to the site.
- GitHub Pages: We host the site on GitHub Pages - permanently online with no server to maintain. Deployment is a single **npm run deploy** that builds and pushes to the gh-pages branch.

## Reusable building blocks

To follow good practice and reduce duplication, we shared logic across the visualizations. The same **season toggle and animated time controls** - with a play button and seek slider - appear in both the scatter plot and the bar chart race, and a single **IOC-to-flag mapping** drives the country flags throughout. The regression model is computed once in Python and consumed identically by every chart, so the whole site tells one internally consistent story.
