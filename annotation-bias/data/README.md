Not part of the published article. Local map of where to drop server result files
(see Section 8.1 of `references/annotation-bias-draft-and-agent-instructions.md`,
and the K=16/24/32 override for synthetic Task II).

Server root: `/projects/bgzf/xzhang65/annotation_bias/`

| Drop into | Server relative path |
|---|---|
| `task1-scalar/summary.csv` | `HT/v1_cts_avg_trained_ref/outputs/task_I/task1_self_reference_summary.csv` |
| `task1-bernoulli/summary.csv` (pending) | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/task1_bernoulli_self_reference_summary.csv` |
| `task1-bernoulli/calibration/temperature.json` (pending) | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration.json` |
| `task1-bernoulli/calibration/calibration-summary.csv` (pending) | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration_summary.csv` |
| `task1-bernoulli/calibration/calibration-aspects.csv` (pending) | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration_per_aspect.csv` |
| `task2-scalar/configurations.csv` | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_exhaustive_summary.csv` |
| `task2-scalar/by-k-prob.csv` | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_true_rate_by_k_prob.csv` |
| `task2-scalar/meta.json` | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_meta.json` |
| `../figures/task2-scalar-source.png` | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_true_rate_by_k_prob_heatmap.png` |
| `task2-bernoulli/generation-meta.json` | `HT/synthetic_bernoulli_task2/outputs/default_seed42/meta.json` |
| `task2-bernoulli/generation-config.json` | `HT/synthetic_bernoulli_task2/configs/default_semi_synthetic.json` |

**Superseded pilot grid (K=8/16/32) — not the article's final numbers.** These
were the original per-alpha run directories; keep them only for traceability,
do not cite their K=8 or K=16/32 values as the article's reported results:

Each of `alpha005/`, `alpha010/`, `alpha020/` should receive, from the matching
`task2_bernoulli_sept_K8_16_32_random120_alpha0{05,10,20}/` server directory:

```text
task2_sept_rejection_summary_by_k.csv
task2_sept_rejection_summary_by_k_aspect.csv
task2_sept_combo_aspect_results.csv
task2_sept_combinations.csv
task2_sept_meta.json
```

**Confirmed final result grid (K=16/24/32) — this is what the article reports.**
Drop into `task2-bernoulli/final/`:

```text
task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.png
task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.pdf
task2_per_aspect_rejection_summary_K16_K24_K32_random120_probs.csv
```

from `HT/synthetic_bernoulli_task2/outputs/default_seed42/final_visualizations/`.
K=16 and K=32 in this file come from the `..._K8_16_32_random120_alpha*` runs;
K=24 comes from the separate `..._K24_random120_alpha*` runs. Do not relabel
the old K=8 numbers as K=24.

Empirical power results for synthetic Task II (`[[PENDING:SYNTHETIC_TASK2_POWER]]`
in `_part-3-bernoulli.qmd`) have no assigned server path yet — author to provide.
