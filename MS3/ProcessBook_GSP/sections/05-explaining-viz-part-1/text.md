# 04 Explaining the Visualizations (Part 1)

## Dual interactive globe

The globe is the entry point of the website: it takes the most familiar metric in Olympic reporting - medal counts by country - and immediately questions it. The first globe colours countries on a bronze-to-gold scale by total medals, with each country’s height scaled to its haul, so the usual suspects (the United States, China, Germany) dominate. As the user scrolls, the view **splits**: the medal globe slides left and a second globe slides in, coloured by **relative performance** (average z-score across all Olympic Games). On that second globe very different countries light up - Kenya and Hungary among them - setting up the central tension of the project. The two globes are camera-synchronized, so the viewer always compares the same hemisphere under both definitions of success; we used the *react-globe.gl* WebGL library for performant rendering.

## Our methodology

Because the rest of the story depends on the idea of “expected” medals, we make the model transparent. We fit a **log-linear regression** separately for each Olympic event and season:

`log(medals) = α·log(GDP per capita) + β·log(population) + γ`

Fitting per event controls for differences in population and wealth at that point in time, so the residual measures genuine over- or under-performance rather than era effects. Including population as well as GDP per capita matters: a large, rich country like the United States gets a high baseline expectation and a z-score near zero, while small countries that consistently exceed their predicted medals - Jamaica, Kenya, Cuba - emerge as the real outliers. We express over-performance multiplicatively, as **log(actual / predicted) ÷ residual standard deviation**. On the website this is conveyed through an animated 3-D regression plane that sweeps in to show the expected surface.
