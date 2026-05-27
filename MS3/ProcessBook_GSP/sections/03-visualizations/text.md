# 02 Visualizations

Based on our story and on the features surfaced by our exploratory analysis, we designed four visualizations. They form a single scrolling narrative on the website, moving from the familiar total medal count toward our resource-adjusted view of success.

## Dual interactive globe

Two synchronized 3-D globes side by side. The first colours countries by total Olympic medal count; on scroll, a second globe slides in colouring them by relative performance instead. Both can be dragged to rotate, and hovering a country reveals its values.

**Goal:** to confront the traditional medal-count worldview with our resource-adjusted one, and let the viewer immediately see how the picture of “successful” countries changes. It intentionally leaves the computation of "relative performance" open to create some tension and curiosity on the side of the reader.

## Our methodology

An explanatory section with an animated 3-D regression plane showing how expected medals are fit from population and GDP per capita, making the model behind the rest of the story transparent before we going into depth analysis.

**Goal:** to explain, visually and honestly, exactly how we compute “expected” medals so the over- and under-performance results that follow are interpretable and trustworthy.

## Relative-performance scatter (Gapminder-style)

An interactive bubble chart with GDP per capita on a log x-axis and the actual-to-expected medal ratio on the y-axis. Bubble size encodes medals won, colour encodes the z-score of over- or under-performance, a season toggle switches Summer/Winter, and a year slider with a play button animates through Olympic history. Clicking a bubble pins a country and traces its trajectory, while a side leaderboard lists the top over- and under-performers.

**Goal:** to let users explore, per Games, which countries punch above their economic weight and which fall short, and to follow individual countries as they drift relative to expectation across the decades.

## Olympic efficiency over time (bar chart race)

Two synchronized racing bar charts. The left race ranks countries by cumulative total medals since 1960; the right ranks the same timeline by cumulative efficiency, defined as cumulative actual medals divided by cumulative expected medals. A value of 1 means exactly as expected, while 2 means twice as many medals as expected. Both advance in lockstep, include a seek slider, and a season toggle switches between Summer and Winter Games.

**Goal:** to contrast the two ways of telling the story over time - who simply wins the most versus who performs best for their resources - and reveal how that ranking shifts across Olympic history.
