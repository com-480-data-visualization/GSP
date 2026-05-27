# 05 Challenges

Our team had solid web-development experience, so the difficulties we hit were mostly specific to reconciling two very different datasets and making honest comparisons across countries and eras.

1. **Reconciling country codes across sources and history.** The two datasets use different coding schemes, and history complicates matters: dissolved or split nations (USSR, East/West Germany, Czechoslovakia, Yugoslavia) have no single modern GDP series. We built an explicit mapping onto successor states and merge rows when several historical teams share one modern code, so a country is never double-counted.
2. **Defining a fair success metric.** Raw medal counts overwhelmingly track economic size, so ranking on totals just rewards big, rich countries. The expected-medals model - fitting per event, in log space, including population alongside GDP per capita - is what lets small over-performers surface as genuine outliers.
3. **Deriving population from the available data.** The World Bank extracts had no population field, yet the model needs it. We obtained it by dividing total GDP by GDP per capita, then filtered out non-positive or missing values that were data artefacts.
4. **Usability of the website.** Interactions with complex elements such as the globes were not trivial, so we added hints like "Drag to explore" to make the available gestures discoverable. We also wanted to ensure a good visual experience, which is why we enforced a roughly 16:9 screen ratio so the layout and proportions stay as intended.

# 06 Peer Assessment

All members took part in most of the project, with the majority of design and implementation decisions made together in meetings. Beyond that shared work, each focused on particular areas, reflected in the commit history.

- **Fares Fawzi** — Racing charts · efficiency · EDA. Implemented the racing bar charts and the efficiency calculation. Carried out much of the EDA and dataset preparation (medals-GDP merge, GDP-rank-by-year), and fixed the duplicate-country and layout bugs.
- **Dominik Glandorf** — Architecture · globes · deployment. Set up the website scaffold and GitHub Pages pipeline (Vite, React, TS). Main author of the page structure, the dual-globe visualization and the global styling. Drove the sport-level analysis and maintained the M1 report and README.
- **Mohamed Mamouri** — Efficiency concept · scatter · process book. Originated the efficiency / expected-medals framing and the bubble-chart design that became the relative-performance scatter, and built that component with its pre-computed data. Produced early total-medals-vs-GDP analysis and the M2 sketch, contributed to the README, and wrote this process book.

May this resource-adjusted view make the Games a fairer contest to read - and reveal the quiet overachievers the medal table tends to hide.
