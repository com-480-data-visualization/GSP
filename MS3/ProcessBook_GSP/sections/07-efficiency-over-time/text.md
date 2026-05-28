# 04 Explaining the Visualizations (Part 3)

## Olympic efficiency over time (bar chart race)

The final visualization brings time to the foreground by racing two leaderboards side by side. The **left race** ranks countries by cumulative total medals since 1960. The **right race** ranks countries by cumulative efficiency. For each Olympic year, we estimate how many medals a country would be expected to win from its population and GDP per capita. We then add actual medals and expected medals from 1960 up to the year currently shown, and compute **cumulative efficiency = cumulative actual medals / cumulative expected medals**. A value of 1 means exactly as expected; 2 means twice as many medals as expected; 0.5 means half as many as expected.

![Initial sketch for comparing raw Olympic success with resource-adjusted performance over time.](../../figures/sketch_implementation_3.jpg)

![The final chart race compares cumulative medal totals on the left with cumulative efficiency on the right.](../../figures/final_implementation_3.png)

We implemented the race with [`racing-bars`](https://racing-bars.hatemhosny.dev/). Each bar is one country (with flag). Left x-axis: cumulative medals since 1960. Right x-axis: cumulative efficiency ratio (actual/expected), so longer bars mean stronger over-performance. The year label marks the current Olympic year. Controls are synchronized across both panels (season toggle, play/pause, step, speed and timeline slider). Historical teams are merged into modern country codes before modeling.
