# HT Workflow Overview For Paper Agent

This file summarizes the three active HT workflow folders under
`/projects/bgzf/xzhang65/annotation_bias/HT`. It is intentionally explicit
about data sources, label construction, model/loss choices, calibration, result
files, and theory alignment, so that the workflows are not conflated.

## One-Line Summary

| Folder | Main role | Data type | Main statistical target | Theory alignment |
|---|---|---|---|---|
| `v1_cts_avg_trained_ref/` | Original real-data continuous-average workflow | Real annotator labels compressed to scalar `y_mean` | Task I self-reference and continuous trained-reference Task II | Squared-loss/Brier-style HT theory for scalar continuous targets |
| `v1_bernoulli_task1_bce/` | Real-data Bernoulli Task I workflow | Real R8/R9/R10 27-label binary annotations | Bernoulli Task I self-reference with BCE-trained predictors | BCE first-stage; Task I test currently uses the same squared-loss/Brier identity aspectwise |
| `synthetic_bernoulli_task2/` | Semi-synthetic Bernoulli Task II workflow | Synthetic Bernoulli labels generated on real image embeddings | Bernoulli Task II trained-reference test with known oracle information | Closest implementation of `Bernoulli_version_Sept.pdf` Task II logic |

Do not compare the result numbers across these folders as if they came from the
same experiment. They answer related but distinct questions.

## Shared Data Infrastructure

All workflows use precomputed chest X-ray embeddings with dimension 1376. When
an embedding file has spatial or multiple-instance dimensions, the code pools by
reshaping to `(-1, 1376)` and taking the mean along the first axis. The usual
embedding directories are:

```text
Data_process/###Embeddings###/embeddings
Data_process/###Embeddings###/embeddings_new
```

The real annotation CSVs use 28 columns:

```text
27 disease labels + No finding
```

The 27 disease labels are:

```text
Aortic enlargement, Atelectasis, Calcification, Cardiomegaly,
Clavicle fracture, Consolidation, Edema, Emphysema, Enlarged PA,
ILD, Infiltration, Lung Opacity, Lung cavity, Lung cyst,
Mediastinal shift, Nodule/Mass, Pleural effusion,
Pleural thickening, Pneumothorax, Pulmonary fibrosis, Rib fracture,
Other lesion, COPD, Lung tumor, Pneumonia, Tuberculosis,
Other diseases
```

Important `No finding` convention:

- In the continuous workflow, `No finding` is excluded from `y_mean`.
- In the real Bernoulli Task I workflow, `No finding` is kept in the CSVs but is not a model head and has no extra loss penalty.
- In the semi-synthetic Bernoulli Task II workflow, there is no `No finding` head. The 27 outputs are artificial Bernoulli aspects that reuse the 27-column interface.

## Folder 1: `v1_cts_avg_trained_ref/`

### Purpose

This is the original HT v1 workflow. It compresses each annotator's 27 disease
labels into one scalar target:

```text
y_mean(x, r) = mean of the 27 disease labels for image x and annotator r.
```

The target lies in `[0, 1]`. Since `No finding` is excluded, a no-disease image
usually has `y_mean=0`, but `No finding` itself is not modeled.

This folder supports:

- Task I self-reference tests for R8/R9/R10.
- Continuous trained-reference Task II experiments.
- An alternative R11-R16 continuous Task II experiment.

### Data Used

Task I data:

```text
HT/v1_cts_avg_trained_ref/taskI_processed_data/
```

This is built from:

```text
Data_process/TaskI_by_youden/
```

using:

```text
HT/v1_cts_avg_trained_ref/taskI_processed_data/build_cts_avg_data.py
```

The builder reads the real Bernoulli labels, drops `No finding`, computes
`y_mean`, and writes CSVs with columns:

```text
image_id, rad_id, y_mean
```

Current Task I split sizes and target means from `taskI_processed_data/meta.json`:

| Split | Rows | Average `y_mean` |
|---|---:|---:|
| `train_R8` | 4446 | 0.0698 |
| `val_R8` | 636 | 0.0643 |
| `train_R9` | 4046 | 0.0953 |
| `val_R9` | 579 | 0.0955 |
| `train_R10` | 4346 | 0.0774 |
| `val_R10` | 621 | 0.0795 |
| `test_shared` | 4500 rows, 1500 shared images times 3 annotators | 0.0957 |

Alternative Task II data:

```text
HT/v1_cts_avg_trained_ref/task2_alt_processed_data/
```

This uses real R11-R16 annotations from:

```text
Data/annotations/image_labels_train.csv
```

It uses an image-disjoint split: one third of unique R11-R16 image ids are held
out as test images. The remaining images are split into train/val per
annotator. The split is controlled by seed 42. The target is again scalar
`y_mean`.

### Models And Training

Code:

```text
HT/v1_cts_avg_trained_ref/train.py
HT/v1_cts_avg_trained_ref/model.py
```

Model:

```text
1376 embedding -> hidden -> hidden -> 1 logit -> sigmoid -> scalar prediction in [0, 1]
```

Loss:

```text
MSE between sigmoid prediction and y_mean.
```

The Slurm scripts under `training_sh/` use GPU when submitted to the GPU
partition. The key checkpoints are saved under:

```text
checkpoints/cts_avg_R8.pth
checkpoints/cts_avg_R9.pth
checkpoints/cts_avg_R10.pth
checkpoints/cts_avg_alt_R11.pth ... checkpoints/cts_avg_alt_R16.pth
```

### Task I Test

Code:

```text
HT/v1_cts_avg_trained_ref/task1_self_reference_test.py
```

For an ordered triple `(A, B, C)`, where `A` is the model's training annotator,
`B` is the baseline human annotator, and `C` is the external reference human
annotator, the statistic is:

```text
S_A,C = 2 * E[(Y_A - Y_C) * (hat_mu_A - Y_B)].
```

The code also computes:

```text
delta_self     = E[(hat_mu_A - Y_A)^2 - (Y_B - Y_A)^2]
delta_external = E[(hat_mu_A - Y_C)^2 - (Y_B - Y_C)^2]
```

and verifies:

```text
delta_external - delta_self = S_A,C.
```

A positive and statistically significant `S_A,C` means the model trained on
annotator `A` looks better under self-reference `A` than under external
reference `C`, relative to baseline annotator `B`.

### Existing Task I Results

Main output:

```text
HT/v1_cts_avg_trained_ref/outputs/task_I/task1_self_reference_summary.csv
```

Current result summary:

- There are 6 ordered triples among R8/R9/R10.
- At alpha `0.001`, `0.01`, `0.05`, and `0.1`, 4 of 6 ordered triples reject.
- The rejecting triples are the two R8 models and the two R9 models.
- The non-rejecting triples are the two R10-as-model triples, which have negative `S_hat`.

Interpretation:

- This is empirical evidence of self-reference effects in the continuous
  scalar `y_mean` setting.
- It should not be described as a Bernoulli/logit theorem experiment.
- It is aligned with the squared-loss/Brier identity above.

### Continuous Task II Alternative Results

The alternative R11-R16 continuous Task II result lives in:

```text
HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/
```

Main files:

```text
task2_alt_modified_exhaustive_summary.csv
task2_alt_modified_true_rate_by_k_prob.csv
task2_alt_modified_true_rate_by_k_prob_heatmap.png
task2_alt_meta.json
```

The modified result is the one to use. There is also:

```text
HT/v1_cts_avg_trained_ref/outputs/task_II_alt_wrong/
```

That folder corresponds to an older/wrong variant and should be treated as a
diagnostic or historical artifact, not the preferred result.

In the modified R11-R16 alt result, the number of certified rows increases with
the probability/alpha-like tuning parameter:

| `prob` | Rows | Certified rows | Certified percent |
|---:|---:|---:|---:|
| 0.01 | 330 | 2 | 0.61% |
| 0.05 | 330 | 10 | 3.03% |
| 0.10 | 330 | 21 | 6.36% |
| 0.20 | 330 | 60 | 18.18% |

Interpretation:

- These are continuous-target trained-reference certification results.
- They are useful for the original HT trained-reference theory, but they are
  not Bernoulli BCE/logit results.

## Folder 2: `v1_bernoulli_task1_bce/`

### Purpose

This is a standalone real-data Bernoulli Task I workflow. It was separated from
the continuous folder to avoid mixing continuous-average and Bernoulli logic.

This workflow uses real R8/R9/R10 binary labels directly, trains BCE models, and
then runs Task I self-reference tests aspect by aspect.

### Data Used

Data directory:

```text
HT/v1_bernoulli_task1_bce/taskI_bernoulli_processed_data/
```

It is copied from:

```text
Data_process/TaskI_by_youden/
```

using:

```text
HT/v1_bernoulli_task1_bce/taskI_bernoulli_processed_data/build_task1_bernoulli_data.py
```

No new split randomness is introduced. The current data files are:

```text
train_R8.csv,  val_R8.csv
train_R9.csv,  val_R9.csv
train_R10.csv, val_R10.csv
test_shared.csv
labels_meta.json
meta.json
```

Current row counts from `meta.json`:

| File | Rows |
|---|---:|
| `train_R8.csv` | 4446 |
| `val_R8.csv` | 636 |
| `train_R9.csv` | 4046 |
| `val_R9.csv` | 579 |
| `train_R10.csv` | 4346 |
| `val_R10.csv` | 621 |
| `test_shared.csv` | 4500 |

Each CSV keeps the full real annotation columns:

```text
image_id, rad_id, 27 disease labels, No finding
```

But the model target is:

```text
27 binary disease labels only.
```

`No finding` is not predicted and does not receive a separate loss penalty.

### Models And Training

Code:

```text
HT/v1_bernoulli_task1_bce/model.py
HT/v1_bernoulli_task1_bce/train_task1_bernoulli_bce.py
```

Model:

```text
1376 embedding -> hidden -> hidden -> 27 logits.
```

Loss:

```text
unweighted BCEWithLogitsLoss over the 27 disease heads.
```

No positive-class weights, no aspect-level weights, and no `No finding` penalty
are used.

Training command:

```bash
cd /projects/bgzf/xzhang65/annotation_bias
sbatch HT/v1_bernoulli_task1_bce/training_sh/train_task1_bernoulli_bce_R8_R10.sbatch
```

Despite the file name `R8_R10`, the script trains all three annotators:

```text
R8, R9, R10
```

Expected checkpoints:

```text
checkpoints/task1_bernoulli_bce_R8.pth
checkpoints/task1_bernoulli_bce_R9.pth
checkpoints/task1_bernoulli_bce_R10.pth
```

### GPU Behavior

The Slurm script requests one GPU:

```text
#SBATCH --partition=gpuA40x4
#SBATCH --gres=gpu:1
```

Slurm assigns an available GPU. The Python script uses `--device auto`, which
means it uses CUDA only inside the allocated job if `torch.cuda.is_available()`
is true. The Python code does not independently search for or reserve GPUs.

### Calibration

Code:

```text
HT/v1_bernoulli_task1_bce/calibrate_task1_bernoulli.py
```

This performs validation-set temperature scaling for probability diagnostics.
It minimizes validation BCE after scaling logits by temperature. It writes raw
and calibrated BCE, Brier, and ECE metrics.

Main outputs after running calibration:

```text
HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/
  task1_bernoulli_temperature_calibration.json
  task1_bernoulli_temperature_calibration_summary.csv
  task1_bernoulli_temperature_calibration_per_aspect.csv
  task1_bernoulli_bce_R*_val_logits_probs_calibration.npz
```

Important: this is not the `U_tau` calibration from
`Bernoulli_version_Sept.pdf`. It is standard validation temperature scaling for
model probabilities.

### Task I Test

Code:

```text
HT/v1_bernoulli_task1_bce/task1_bernoulli_self_reference_test.py
```

The test uses the same Task I squared-loss/Brier identity as the continuous
workflow, applied to each Bernoulli aspect:

```text
S_A,C,h = 2 * E[(Y_A,h - Y_C,h) * (hat_mu_A,h - Y_B,h)].
```

The script reports:

- one row per ordered `(A_model, B_human, C_external_ref, aspect, alpha)`,
- one aggregate `ALL_27_mean_over_aspects` row per ordered triple and alpha,
- optional per-image summands.

By default it uses raw sigmoid probabilities. If a calibration JSON is passed,
it uses temperature-calibrated probabilities:

```bash
python HT/v1_bernoulli_task1_bce/task1_bernoulli_self_reference_test.py \
  --checkpoint-run-template 'task1_bernoulli_bce_{annotator}' \
  --calibration-json HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration.json
```

Expected outputs:

```text
HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/
  task1_bernoulli_self_reference_summary.csv
  task1_bernoulli_model_predictions_probs.csv
  task1_bernoulli_model_predictions_logits_probs.npz
  task1_bernoulli_per_image_summands.csv   # only with --save-per-image
```

### Current Result Status

At the time this overview was written, the training job for this folder had
started and produced training logs and validation metrics, but calibration and
Task I self-reference result CSVs were not yet present. Therefore, do not cite
final Bernoulli Task I results from this folder until the calibration and/or
self-reference scripts have been run and their output CSVs exist.

Existing intermediate outputs are under:

```text
HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/train_logs/
HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/val_metrics/
```

### Theory Correspondence

This workflow is closer to the Bernoulli setting than the continuous workflow
because the first-stage models are trained with BCE on real binary labels.

However, the current Task I test statistic is still the squared-loss/Brier
self-reference identity. This is legitimate for binary labels as a Brier-score
test, but it is not the same as the Bernoulli Version Sept Task II
logit-calibration/Bernstein theorem.

Recommended paper language:

- Correct: "We also implemented a real-data Bernoulli Task I workflow using
  BCE-trained 27-output annotator-specific models."
- Correct: "The Task I self-reference statistic is evaluated aspectwise using
  the squared-loss/Brier identity."
- Avoid: "This Task I result directly verifies the Bernoulli Version Sept
  Task II theorem."

## Folder 3: `synthetic_bernoulli_task2/`

### Purpose

This is the semi-synthetic Bernoulli Task II workflow. It uses real image
embeddings but synthetic annotator probabilities and labels. The purpose is to
create a controlled Bernoulli environment where the oracle bias and the
population `kappa` bound are known.

This is the folder most directly aligned with `Bernoulli_version_Sept.pdf` for
Task II.

### Data Used

Image pool:

```text
HT/synthetic_bernoulli_task2/inputs/task2_image_pool.csv
```

Current pool and split sizes from `outputs/default_seed42/meta.json`:

| Quantity | Value |
|---|---:|
| Unique images before embedding filter | 5438 |
| Unique images after embedding filter | 5438 |
| Missing embeddings | 0 |
| Train images | 2887 |
| Validation images, used as D2 | 738 |
| Test images, used as D1 | 1813 |

The split membership is inherited from the existing Task II split by `image_id`:
test has highest priority, then validation, then train. Oracle calculations use
the complete fixed pool of 5438 images.

### Default Semi-Synthetic Generation Settings

Config file:

```text
HT/synthetic_bernoulli_task2/configs/default_semi_synthetic.json
```

Current default:

| Setting | Value |
|---|---:|
| Annotators | `R01` through `R34` |
| Number of annotators | 34 |
| Full-reference K | 32, because A and B are excluded |
| Master seed | 42 |
| Embedding dimension | 1376 |
| PCA dimension | 10 |
| Number of aspects | 27 |
| Target annotator-population positive rate | 0.5 |
| Bias scale `tau` | 0.1 |
| Generation input `kappa` | none |

The 27 output columns reuse the disease names only for interface compatibility.
They should be described as synthetic Bernoulli aspects, not as real disease
semantics.

### Feature Construction

The generator loads the fixed embedding pool:

```text
X in R^1376
```

It fits PCA on the full pool, keeps 10 components, and standardizes each
projected coordinate by the pool mean and pool standard deviation with
`ddof=0`:

```text
z(x) in R^10
E_X z(X) = 0
Cov_X z(X) = I_10
```

Numerical checks:

```text
max_abs_z_mean = 3.14e-17
max_abs_z_cov_minus_identity = 3.77e-15
```

For each aspect `h`, a fixed random unit vector `c_h` is drawn and:

```text
s_h(x) = c_h^T z(x)
E_X s_h(X) = 0
Var_X s_h(X) = 1
```

Numerical checks:

```text
max_abs_s_mean = 2.48e-17
max_abs_s_var_minus_1 = 2.44e-15
```

### Synthetic Probability Model

Base probability:

```text
mu_h^*(x) = sigmoid(a_h + s_h(x)).
```

The annotator-specific bias is nonlinear and depends on all 10 PCA features:

```text
f_{r,h}(x) = W2_{r,h} tanh(W1_{r,h} z(x) + b1_{r,h})
b_{r,h}(x) = C_{r,h} + f_{r,h}(x) - E_X f_{r,h}(X)
mu_{r,h}(x) = sigmoid(a_h + s_h(x) + b_{r,h}(x)).
```

Random network settings:

| Parameter | Distribution |
|---|---|
| Input weights `W1`, shape `32 x 10` | `N(0, 1/10)` |
| Hidden bias `b1`, length 32 | `N(0, 1)` |
| Output weights `W2`, length 32 | `N(0, 0.1^2 / 32)` |
| Global offset `C_{r,h}` | `N(0, 0.1^2)` |

The network parameters are sampled once per annotator and aspect, then fixed
over all images.

The intercepts `a_h` are solved so that the annotator-population positive rate
is 0.5. This is not re-tuned to the finite 34-person panel and labels are not
forced to have exactly 50 percent positives.

Positive-rate checks:

```text
target_positive_rate = 0.5
max_abs_population_rate_error = 4.32e-06
finite_panel_expected_positive_rate_overall = 0.500315
sampled_label_positive_rate_overall = 0.500210
mu_star_positive_rate_overall = 0.499999
```

### Oracle Kappa Information

Because:

```text
E_X b_{r,h}(X) = C_{r,h}
Var_X b_{r,h}(X) = Var_X f_{r,h}(X)
```

and the network scale was chosen so that:

```text
E_r Var_X f_{r,h}(X) <= tau^2 = 0.01
E_r C_{r,h}^2 = tau^2 = 0.01
```

the population oracle upper bound is:

```text
kappa <= 1 + 0.01 / 0.01 = 2.
```

This `kappa=2` is an oracle property of the generation mechanism. It is not a
data-generation input.

Current oracle checks:

```text
population_kappa_valid_upper_bound_all_aspects = 2.0
empirical_panel_kappa_min = 1.2387
empirical_panel_kappa_max = 1.3108
empirical_panel_kappa_mean = 1.2730
```

The finite-panel empirical ratios are diagnostics only. They should not replace
the population oracle upper bound used in the theorem check.

### Surrogate Training

Code:

```text
HT/synthetic_bernoulli_task2/train_synthetic_bernoulli.py
```

Model:

```text
1376 embedding -> hidden -> hidden -> 27 logits.
```

Loss:

```text
unweighted BCEWithLogitsLoss over 27 Bernoulli aspects.
```

There are no positive-class weights and no aspect-level loss weights.

Current status:

```text
34 synthetic BCE checkpoints exist.
34 per-aspect validation metric CSVs exist.
```

Checkpoint directory:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/training/checkpoints/
```

### Bernoulli Version Sept Task II Test

Code:

```text
HT/synthetic_bernoulli_task2/run_task2_bernoulli_sept.py
```

The implementation follows the Bernoulli Version Sept PDF logic:

- BCE-trained first-stage predictors.
- Logit-scale reference differences.
- `U_tau` calibration on D2, the validation split with 738 images.
- Main Task II statistic on D1, the test split with 1813 images.
- Bernstein distortion bound with oracle `kappa=2`.
- Each scalar Bernoulli aspect is tested separately.
- A combo-level rejection means at least one of the 27 aspects rejects.

The calibration solver uses a generalized eigen decomposition once per
calibration problem:

```text
eigh(Omega / n, I + 11^T)
```

then solves the scalar equation:

```text
sum_j a_j^2 / (lambda_j + u) = chi-square quantile
```

by bisection in `u = U_tau^2`.

### Existing Synthetic Task II Results

The most relevant output folders are:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha005/
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha010/
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha020/
```

For each alpha/prob setting, 120 random `(A, B, reference set)` combinations
are tested at each K. The outputs include:

```text
task2_sept_rejection_summary_by_k.csv
task2_sept_rejection_summary_by_k_aspect.csv
task2_sept_combo_aspect_results.csv
task2_sept_combinations.csv
task2_sept_meta.json
```

Aggregate results:

| Alpha/prob | K | Random combos | Combo rejection percent, any aspect | Combo-aspect rejection percent | Mean certification margin |
|---:|---:|---:|---:|---:|---:|
| 0.05 | 8 | 120 | 0.0% | 0.0% | -0.4852 |
| 0.05 | 16 | 120 | 0.0% | 0.0% | -0.1538 |
| 0.05 | 32 | 120 | 100.0% | 63.21% | 0.0040 |
| 0.10 | 8 | 120 | 0.0% | 0.0% | -0.3749 |
| 0.10 | 16 | 120 | 0.0% | 0.0% | -0.1033 |
| 0.10 | 32 | 120 | 100.0% | 100.0% | 0.0297 |
| 0.20 | 8 | 120 | 0.0% | 0.0% | -0.2700 |
| 0.20 | 16 | 120 | 7.5% | 0.31% | -0.0533 |
| 0.20 | 32 | 120 | 100.0% | 100.0% | 0.0558 |

The final heatmap/summary visualization files are under:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/final_visualizations/
```

In particular:

```text
task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.png
task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.pdf
task2_per_aspect_rejection_summary_K16_K24_K32_random120_probs.csv
```

Interpretation:

- Increasing K improves power because the trained-reference average has lower
  variability and the distortion bound becomes smaller.
- K=8 and K=16 are mostly too conservative under alpha/prob 0.05 and 0.10.
- K=32 has strong rejection in these synthetic settings, consistent with the
  intended controlled bias signal and oracle `kappa=2` bound.
- These results support the Bernoulli Task II theorem workflow under a
  controlled semi-synthetic data-generating mechanism.

## Cross-Folder Interpretation Guide

### What The Three Workflows Can Support

1. `v1_cts_avg_trained_ref/`
   - Supports claims about real-data self-reference and trained-reference
     behavior after compressing labels to scalar `y_mean`.
   - Good for explaining the original HT intuition.
   - Not a Bernoulli BCE/logit theorem experiment.

2. `v1_bernoulli_task1_bce/`
   - Supports real-data Bernoulli Task I experiments with BCE-trained
     annotator-specific predictors.
   - Good for showing that the framework can operate on real binary labels
     without collapsing to `y_mean`.
   - Current Task I test is Brier-style, not the Bernoulli Version Sept Task II
     Bernstein certification.

3. `synthetic_bernoulli_task2/`
   - Supports controlled Bernoulli Task II theorem experiments.
   - Uses known oracle probabilities and known population `kappa <= 2`.
   - Good for interpreting finite-sample power and conservativeness of the
     Bernstein/logit-calibrated test.

### Most Important Non-Confusions

- `v1_cts_avg_trained_ref/` uses MSE on scalar `y_mean`; it is not BCE.
- `v1_bernoulli_task1_bce/` uses BCE on real 27-label binary annotations; it is
  not synthetic.
- `synthetic_bernoulli_task2/` uses BCE-trained surrogates but labels are
  generated artificially from the semi-synthetic model.
- Temperature calibration in `v1_bernoulli_task1_bce/` is not the same as
  `U_tau` calibration in `synthetic_bernoulli_task2/`.
- The `kappa=2` statement belongs to the semi-synthetic Task II generator and
  theorem check. It is not estimated from the real R8/R9/R10 Bernoulli Task I
  data.
- Synthetic aspect names reuse disease labels only to preserve the 27-output
  interface. They should not be interpreted as true disease semantics.

## Recommended Paper-Agent Usage

Use the workflows as follows:

- Use `v1_cts_avg_trained_ref/` for background and empirical motivation in the
  original scalar target setting.
- Use `v1_bernoulli_task1_bce/` for real-data Bernoulli Task I implementation
  details once final Task I result CSVs are generated.
- Use `synthetic_bernoulli_task2/` for the main controlled Bernoulli Task II
  theorem-aligned experiment and oracle discussion.

If quoting results, cite the exact CSV path and state the target scale:

- continuous scalar `y_mean`,
- real 27-label Bernoulli,
- or semi-synthetic 27-aspect Bernoulli.

