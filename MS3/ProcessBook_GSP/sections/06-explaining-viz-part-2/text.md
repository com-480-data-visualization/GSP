# 04 Explaining the Visualizations (Part 2)

## Relative-performance scatter (Gapminder-style)

This is the analytical heart of the project and the visualization that evolved most between milestones. Our milestone-1 exploration started from a simple bubble chart of GDP versus total medals, which already hinted that wealth and medals move together - but imperfectly.

By milestone 3 it had become a fully interactive **Gapminder-style** chart. Each bubble is a medal-winning country at a given Games. The x-axis is GDP per capita on a log scale; the y-axis is the **actual-to-expected medal ratio**, with a clear baseline at “1× expected”. Bubble size encodes medals won, colour encodes the z-score on a diverging scale - gold for far above expectation, blue for far below. A **season toggle** switches the dataset, a **year slider with a play button** animates through every edition, and **clicking a bubble pins that country**, drawing a dashed trajectory through previous Games. A side leaderboard lists the top over- and under-performers.
