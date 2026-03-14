# Milestone 1 Report

<!--- **10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)* --->

### Dataset

<!---  > Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)).  --->

We explore two datasets:
1. Olympic medals by country and year
2. Gross Domestic Product (GDP) by country and year

### Problematic

<!---  > Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.  --->

We are interested in exploring the relationship between a country's economic performance (as measured by GDP) and its success in the Olympic Games (as measured by the number of medals won). Our motivation is to understand whether there is a correlation between a country's wealth and its athletic achievements on the global stage. The target audience for our visualization includes sports enthusiasts, economists, and policymakers who are interested in the intersection of sports and economics.

We take a critical stance on the meritocratic narrative often associated with Olympic success, which tends to focus on absolute achievements without considering the resources available to different countries. By analyzing the efficiency of medal wins in relation to GDP, we aim to provide a more nuanced perspective on Olympic success that accounts for economic disparities among nations.

### Exploratory Data Analysis

<!---  > Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data
 --->

To preprocess the data, we established a link between the country codes and filtered for years where both sources have data available.

### Related work

<!---  
> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.  --->

Works in economics found a positive relationship between GDP and Olympic success, but they often focus on absolute medal counts without considering the efficiency of medal wins in relation to economic resources [1]. Such mathematical models come with at several limitations: They have scarce visualizations of the relationships, especially on countries efficiency. They also do not distinguish between individual sports that may be more resource-intensive compared to others. Lastly, they omit the temporal evolution which is relevant since hits on the economy may become visible years later as Olympic success is often the result of long-term investments in sports infrastructure and training programs.

Previous course projects [2] have explored the temporal evolution of Olympic medals focussing on countries, sports and genders. The economic development of countries and its relationship with Olympic success has been less explored. Instead of only praising success in terms of absolute success, we want to explore efficiency in terms of medals won as a function of GDP.

[1] Bernard, A. B., & Busse, M. R. (2004). [Who wins the Olympic Games: Economic resources and medal totals](https://watermark02.silverchair.com/003465304774201824.pdf). Review of economics and statistics, 86(1), 413-417.

[2] [CS-480 Project: Medalytics](https://github.com/com-480-data-visualization/Medalytics)