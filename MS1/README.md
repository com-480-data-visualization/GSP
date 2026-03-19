# Milestone 1 Report

<!--- **10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)* --->

### Dataset

<!---  > Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)).  --->

<!-- We explore two datasets:
1. Olympic medals by country and year
2. Gross Domestic Product (GDP) per capita by country and year
Why do we use per capita? Resources per person are more relevant for Olympic success than total GDP, which can be skewed by population size. By using GDP per capita, we can better assess the efficiency of medal wins in relation to the economic resources available to each individual athlete.
 -->

We explore two datasets: (1) Olympic medals by country and year [1], and (2) Gross Domestic Product (GDP) per capita by country and year [2]. We use GDP per capita rather than total GDP because we hypothesise that Olympic performance is more meaningfully related to resources available per person than to total economic size, which is strongly affected by population.

The Olympics data is high quality and requires limited preprocessing. It spans 1896 to 2024, has no missing values, and provides consistent information on year, country, sport, medal, and event. However, the country codes are in the IOC format, used by the International Olympic Committee. To align it with the GDP per capita data, we restrict the analysis to 1960 onward and map IOC country codes, to World Bank and ISO3 three-letter country codes.

The GDP per capita data [2] requires slightly more preprocessing. It spans 1960 to 2025 and contains missing GDP per capita values for some country-year observations. It also includes aggregate regional entries and uses a different country coding convention (World Bank and ISO3). We therefore interpolate missing values within each country series and merge it with the Olympics data by mapped country code and year. Some missing values remain for historical countries and special Olympic teams that do not have direct GDP data.



### Problematic

<!---  > Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.  --->

We are interested in exploring the relationship between a country's economic performance (as measured by GDP) and its success in the Olympic Games (as measured by the number of medals won). Our motivation is to understand whether there is a correlation between a country's wealth and its sports achievements. The target audience for our visualization includes sports enthusiasts, economists, and policymakers who are interested in the intersection of sports and economics.

We take a critical stance on the meritocratic narrative often associated with Olympic success, which tends to focus on absolute achievements without considering the resources available to different countries. By analyzing the efficiency of medal wins in relation to GDP, we aim to provide a more nuanced perspective on Olympic success that accounts for economic disparities among nations.

We will explore the temporal evolution of this relationship, as well as the differences across various sports, to identify patterns and insights that may not be immediately apparent from raw medal counts alone.

### Exploratory Data Analysis

<!---  > Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data
 --->

We start with the Olympics data, which covers 1896 to 2024, contains 21,261 medal entries across 92 sports and 174 countries, and has no missing values. It contains the columns `season`, `year`, `medal`, `country_code`, `country`, `games`, `sport`, `event_gender`, and `event_name`.

The GDP data contains country codes and GDP per capita in US dollars from 1960 to 2025. Missing GDP values were interpolated (linear interpolation) within each country series using linear interpolation, reducing missing data from 17.06% to 1.50%. Some values remain missing because some entities have no GDP data at all.

We map Olympic IOC codes to World Bank and ISO3 country codes and keep Olympic entries from 1960 onward. We then merge the GDP data by country code and year, so each Olympic medal entry is matched with the GDP value of that country in the same year. Some mismatches remain because the GDP data includes regions, while the Olympics data includes historical countries and special teams.

The table below summarizes the final merged dataset.

| Variable | Value |
|---|---|
| Number of entries/medals | 16,333 |
| Number of sports | 80 |
| Number of countries | 166 |
| Number of years included (medals and GDP) | 25 |
| Missing data (GDP) | 0.72% |




Plots:
Mohamed 2026 GDP vs total medals scatterplot (one point per country)

We plotted the mean GDP rank of medal winners over years, separated by the season:
![GDP rank by year](../figures/gdp_rank_by_year.png)

The plot confirms that the average medal winner always came from a top 30% GDP/capita country, with a much stronger relationship for winter sports. The relationships seems to have significantly weakened in the 90's with recent years in the summer olympics showing a slight increase in the average GDP rank of medal winners.

The ten individual sports with the highest mean GDP rank of medal winners include expensive sports such as ice hockey, alpine skiing and equestrian:

| Sport               | Avg. GDP/Capita Rank   |
|:--------------------|:-----------|
| Ice Hockey          | 91.9%      |
| Alpine Skiing       | 91.5%      |
| Curling             | 91.4%      |
| Nordic Combined     | 91.3%      |
| Equestrian Dressage | 91.0%      |
| Equestrian          | 91.0%      |
| Bobsleigh           | 90.9%      |
| Softball            | 90.8%      |
| Speed skating       | 90.3%      |
| Snowboard           | 90.3%      |


The lower end includes cheap racquet sports, gymnastics and martial arts:
| Sport               | Avg. GDP/Capita Rank   |
|:--------------------|:-----------|
| Hockey              | 67.3%      |
| Karate              | 66.6%      |
| Taekwondo           | 66.5%      |
| Gymnastics Rhythmic | 66.0%      |
| Trampoline          | 64.7%      |
| Weightlifting       | 64.7%      |
| Wrestling           | 62.4%      |
| Table Tennis        | 57.5%      |
| Badminton           | 56.5%      |
| Artistic swimming   | 54.0%      |



### Related work

<!---  
> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).--->

Works in economics found a positive relationship between GDP and Olympic success, but they often focus on absolute medal counts without considering the efficiency of medal wins in relation to economic resources [3]. Such mathematical models come with at several limitations: They have scarce visualizations of the relationships, especially on countries efficiency. They also do not distinguish between individual sports that may be more resource-intensive compared to others. Lastly, they omit the temporal evolution which is relevant since hits on the economy may become visible years later as Olympic success is often the result of long-term investments in sports infrastructure and training programs.

Previous course projects [2] have explored the temporal evolution of Olympic medals focussing on countries, sports and genders. The economic development of countries and its relationship with Olympic success has been less explored. Instead of only praising success in terms of absolute success, we want to explore efficiency in terms of medals won as a function of GDP.

For engaging visualizations, we take inspirations from interactive maps with observer interactions [3,4] and bar chart races [5], where we plan to add a new dimension to include efficiency of medal wins.



[1] Ashyou09. (2024). [Olympics Athletes Dataset (1896–2024)](https://www.kaggle.com/datasets/ashyou09/olympics-athletes-dataset-18962024) [Data set]. Kaggle.

[2] World Bank. (2024). [GDP per capita (current US$)](https://data.worldbank.org/indicator/NY.GDP.PCAP.CD) [Data set]. World Development Indicators.


[3] Bernard, A. B., & Busse, M. R. (2004). [Who wins the Olympic Games: Economic resources and medal totals](https://watermark02.silverchair.com/003465304774201824.pdf). Review of economics and statistics, 86(1), 413-417.

[4] [CS-480 Project: Medalytics](https://github.com/com-480-data-visualization/Medalytics)

[5] [EU Regions Funding](https://pudding.cool/2019/04/eu-regions/)

[6] [Visual Introduction to Machine Learning](https://r2d3.us/visual-intro-to-machine-learning-part-1/)

[7] [Bar Chart Race](https://flourish.studio/visualisations/bar-chart-race/)
