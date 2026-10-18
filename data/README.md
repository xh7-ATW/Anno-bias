# data

Result files behind the figures and interactive tables of the post. The page loads only `results-data.js`; the other files are its sources.

| File or folder | Contents |
|---|---|
| `part1-aggregate/` | Part I, self-reference test for the aggregate score (Figure 1). |
| `part1-binary/` | Part I, self-reference test for each finding with binary labels (Figure 2), with the decision thresholds and probability calibration of the trained models. |
| `part2-aggregate/` | Part II, reliability test on every configuration (the certification-rate heatmap and the per-configuration table). |
| `part3-semisynthetic/` | Part III, results for each synthetic finding, how the semi-synthetic labels were generated, and the finding-level quantities correlated with the certification rate. |
| `results-dump.md` | All Part I and Part II result files in one document, with the original path of each file in its source inventory. |
| `extract_from_dump.py` | Splits `results-dump.md` into the Part I and Part II folders and builds `results-data.js`. Run from the repository root: `python data/extract_from_dump.py`. |
| `results-data.js` | The data read by `results.js` to draw the interactive figures and tables. |
