# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Mohamed Mamouri| 362231|
| Fares Fawzi| 337530|
| Dominik Glandorf| 397208|

[Milestone 1](./MS1/README.md) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)
[Link to our Report](./MS1/README.md)

## Milestone 2 (17th April, 5pm)

[Link to our Report](./MS2/README.md)


## Milestone 3 (29th May, 5pm)

[Link to our Process Book](./MS3/ProcessBook_GSP.pdf)

[Link to our Final Website](https://com-480-data-visualization.github.io/GSP/)

[Link to our Screencast](./MS3/screencast.mov)

# Setup

## Python (data processing)

This project uses Python 3.13 for data processing scripts. We recommend using a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # pandas, numpy, seaborn
```

### Source files (`src/`)

| File | Purpose |
|---|---|
| `src/generate_gapminder.py` | Main pipeline — reads the two merged GDP CSVs, fits a per-year log-log regression (`log(medals) = α·log(gdp_per_capita) + β·log(population) + γ`), computes z-scores and actual/expected ratios, and writes `website/public/data/gapminder_scatter.json` |
| `src/utils.py` | IOC 3-letter → World Bank / ISO-3 country code mapping table (handles historical codes like URS→RUS, GDR→DEU, etc.) |

To regenerate the main dataset after changing the model or source data:

```bash
python src/generate_gapminder.py
```

### Raw data (`data/`)

| File / folder | Description |
|---|---|
| `data/olympic_medals.csv` | Raw Olympic results — one row per medal event (season, year, medal type, IOC code, country, sport, event) |
| `data/olympics_gdp_merged.csv` | Medals joined with World Bank GDP per capita — primary regression input |
| `data/olympics_gdp_current_usd_merged.csv` | Same join but with total GDP in current USD — used to derive population (`population = total_gdp / gdp_per_capita`) |
| `data/gdp_per_capita/` | Raw World Bank GDP per capita dataset (CSV download) |
| `data/gdp_absolute/` | Raw World Bank total GDP dataset (CSV download) |
| `data/summer_efficiency.csv` | Pre-computed per-window efficiency rankings for Summer Olympics |
| `data/winter_efficiency.csv` | Same for Winter Olympics |

## Website (frontend)

The website is a React + TypeScript app built with Vite. Requires **Node.js ≥ 18** and **npm ≥ 9**.

```bash
cd website
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build → dist/
npm run deploy    # build + push to GitHub Pages
```

### Source structure

```
website/src/
├── types/
│   └── olympics.ts                  # Shared data interfaces (GapminderData, Season, …)
├── data/
│   ├── countryMaps.ts               # IOC → ISO2 lookup, flag emoji helpers
│   └── buildRaceSeries.ts           # Pure data-transform for the bar chart race
├── theme/
│   └── raceColors.ts                # Story-country accent colors + soft palette
├── hooks/
│   └── useWindowSize.ts             # Reactive window dimensions hook
├── components/
│   ├── sections/
│   │   ├── HeroSection.tsx          # Landing hero
│   │   └── KeyFindings.tsx          # Closing findings grid
│   ├── BarChartRaceSection/
│   │   ├── index.tsx                # Racing-bars dual-chart component
│   │   ├── RaceControls.tsx         # Play / pause / skip / slider / year display
│   │   └── ReferenceLine.tsx        # Dashed "expected" overlay on efficiency chart
│   ├── GlobeSection.tsx             # Dual-globe WebGL view
│   ├── GapminderScatter.tsx         # Animated bubble scatter plot
│   └── OurMethodology.tsx           # Methodology explainer
├── App.tsx                          # Top-level layout and scroll wiring
├── index.css                        # CSS custom properties (colors, typography)
└── main.tsx                         # React entry point
```
