# 04 Explaining the Visualizations (Part 3)

## Olympic efficiency over time (bar chart race)

The final visualization brings time to the foreground by racing two leaderboards side by side. The **left race** ranks countries by cumulative total medals since 1960; the **right race** ranks countries by cumulative efficiency: cumulative actual medals divided by cumulative expected medals. A value of 1 means the country won exactly as many medals as the GDP-and-population model expected; 2 means twice as many as expected. Seeing both at once makes the thesis concrete: the country topping the medal race is rarely the one topping the efficiency race.

![Initial sketch for comparing raw Olympic success with resource-adjusted performance over time.](../../figures/sketch_implementation_3.jpg)

![The twin racing bar charts: total medals (left) vs. cumulative efficiency (right).](../../figures/final_implementation_3.png)

The two races are driven from the same year sequence so they stay in lockstep, with play, pause, speed and seek controls. We built them with the *racing-bars* library fed by the same pre-computed expected-medals JSON used in the scatter plot. One subtlety handled in pre-processing was combining historical teams that map onto a single modern code: medals, population and total GDP are aggregated consistently, then GDP per capita is recomputed before fitting the expected-medals model. Combined with the scatter, the two views let a reader move fluidly between a single Games and the whole arc of Olympic history, always under the same resource-adjusted definition of success.
