"""
Generate gapminder_scatter.json for the Gapminder-style scatter visualization.

Fits a multivariate log-log regression per Olympic year/season:

    log(medals) = α·log(gdp_per_capita) + β·log(population) + γ

Population is derived from the two existing datasets:
    population = total_gdp / gdp_per_capita

Including population means the model accounts for a country's size, not just
its wealth. A large rich country (USA) gets a high predicted baseline, so its
z-score approaches 0. Small countries that over-perform (Jamaica, Kenya, Cuba)
become the genuine outliers.

Z-scores are computed in log space: log(actual / predicted) / σ
This measures multiplicative over-performance — "X times more than expected".

Run from the project root:
    python src/generate_gapminder.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd

GDP_PC_PATH  = Path(__file__).parent.parent / "data" / "olympics_gdp_merged.csv"
GDP_TOT_PATH = Path(__file__).parent.parent / "data" / "olympics_gdp_current_usd_merged.csv"
OUT_PATH     = Path(__file__).parent.parent / "website" / "public" / "data" / "gapminder_scatter.json"


N_CURVE_POINTS = 60


def fit_year(df: pd.DataFrame, gdp_global_min: float, gdp_global_max: float) -> dict:
    """Fit multivariate log-log regression for one year/season slice."""
    log_gdp_pc = np.log(df["gdp_per_capita"].values.astype(float))
    log_pop    = np.log(df["population"].values.astype(float))
    log_medals = np.log(df["medal_count"].values.astype(float))

    # Design matrix: [log(gdp_pc), log(pop), 1]
    X = np.column_stack([log_gdp_pc, log_pop, np.ones(len(df))])
    coeffs, _, _, _ = np.linalg.lstsq(X, log_medals, rcond=None)
    alpha, beta, gamma = float(coeffs[0]), float(coeffs[1]), float(coeffs[2])

    predicted_log = alpha * log_gdp_pc + beta * log_pop + gamma
    predicted     = np.exp(predicted_log)

    # Residuals in log space → z-scores
    log_residuals = log_medals - predicted_log
    std     = log_residuals.std()
    zscores = log_residuals / std if std > 0 else np.zeros_like(log_residuals)

    countries = []
    for i, (_, row) in enumerate(df.iterrows()):
        ratio = float(row["medal_count"]) / float(predicted[i]) if predicted[i] > 0 else 1.0
        countries.append({
            "country":        row["country"],
            "code":           row["gdp_country_code"],
            "gdp_per_capita": round(float(row["gdp_per_capita"]), 2),
            "population":     round(float(row["population"]) / 1e6, 2),  # millions
            "medal_count":    int(row["medal_count"]),
            "predicted":      round(float(predicted[i]), 2),
            "ratio":          round(ratio, 3),   # actual / expected — >1 means over-performing
            "zscore":         round(float(zscores[i]), 3),
        })

    countries.sort(key=lambda c: c["zscore"], reverse=True)

    # Pre-sample regression curve at the median population of this year.
    # Holds population fixed so the curve shows expected medals vs GDP/capita
    # for a "typical" country — bubbles above it are over-performers.
    median_pop = float(np.median(df["population"].values))
    curve_gdps   = np.exp(np.linspace(np.log(gdp_global_min), np.log(gdp_global_max), N_CURVE_POINTS))
    curve_medals = np.exp(alpha * np.log(curve_gdps) + beta * np.log(median_pop) + gamma)
    curve = [[round(float(g), 2), round(float(m), 3)] for g, m in zip(curve_gdps, curve_medals)]

    return {"countries": countries, "curve": curve}


def merge_shared_codes(df: pd.DataFrame) -> pd.DataFrame:
    """
    Collapse rows sharing the same gdp_country_code/year/season (e.g. East + West Germany).
    Medal counts are summed; GDP and population values are kept from the first row (same source).
    """
    MERGED_NAMES: dict[str, str] = {"DEU": "Germany (E+W)"}

    grouped = (
        df.groupby(["gdp_country_code", "year", "season"], as_index=False)
        .agg(
            country=("country",        lambda names: " + ".join(sorted(set(names)))),
            gdp_per_capita=("gdp_per_capita", "first"),
            population=("population",  "first"),
            medal_count=("medal_count", "sum"),
        )
    )

    def clean_name(row: pd.Series) -> str:
        if "+" not in row["country"]:
            return row["country"]
        return MERGED_NAMES.get(row["gdp_country_code"], row["country"])

    grouped["country"] = grouped.apply(clean_name, axis=1)
    return grouped


def main() -> None:
    #  Load and merge the two GDP datasets 
    pc_df  = pd.read_csv(GDP_PC_PATH)
    tot_df = pd.read_csv(GDP_TOT_PATH)

    df = pc_df.merge(
        tot_df[["gdp_country_code", "year", "season", "gdp_current_usd"]],
        on=["gdp_country_code", "year", "season"],
        how="inner",
    )
    df["population"] = df["gdp_current_usd"] / df["gdp_per_capita"]

    # Drop rows where population is zero/negative/NaN (data artefacts)
    df = df[df["population"] > 0].dropna(subset=["population"])
    print(f"Loaded {len(df):,} rows after merging GDP datasets")

    #  Merge split national teams 
    before = len(df)
    df = merge_shared_codes(df)
    if before - len(df):
        print(f"  Merged {before - len(df)} duplicate code/year/season rows")

    #  Global meta for frontend axis scales 
    gdp_global_min = float(df["gdp_per_capita"].min())
    gdp_global_max = float(df["gdp_per_capita"].max())

    result: dict = {
        "meta": {
            "gdpMin": round(gdp_global_min, 2),
            "gdpMax": round(gdp_global_max, 2),
        },
        "Summer": {},
        "Winter": {},
    }

    #  Fit per season / year 
    for season in ("Summer", "Winter"):
        season_df = df[df["season"] == season].copy()
        years     = sorted(season_df["year"].unique().tolist())

        by_year: dict = {}
        for year in years:
            year_df = season_df[season_df["year"] == year].copy()
            if len(year_df) < 5:
                continue
            by_year[str(year)] = fit_year(year_df, gdp_global_min, gdp_global_max)

        result[season]["years"]  = [y for y in years if str(y) in by_year]
        result[season]["byYear"] = by_year
        print(f"  {season}: {len(by_year)} years processed")

    # Compute global ratioMax across all years/seasons 
    all_ratios = [
        c["ratio"]
        for season in ("Summer", "Winter")
        for yd in result[season]["byYear"].values()
        for c in yd["countries"]
    ]
    ratio_global_max = round(float(np.percentile(all_ratios, 99)), 1)  # 99th pct to avoid extreme outliers
    result["meta"]["ratioMax"] = ratio_global_max

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(result, f, separators=(",", ":"))

    print(f"\nSaved → {OUT_PATH}")

    # Sanity check: USA and Jamaica in latest Summer
    latest = str(result["Summer"]["years"][-1])
    for name in ("United States", "Jamaica", "Kenya", "Qatar"):
        match = next((c for c in result["Summer"]["byYear"][latest]["countries"] if name in c["country"]), None)
        if match:
            print(f"  {match['country']:30s} actual={match['medal_count']:3d}  "
                  f"predicted={match['predicted']:5.1f}  z={match['zscore']:+.2f}")


if __name__ == "__main__":
    main()
