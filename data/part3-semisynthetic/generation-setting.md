# Synthetic Bernoulli Official Generation Setting

This document describes the synthetic data generation used by the current official Bernoulli Task II result:

```text
HT/bernoulli_task2_results/official_result/
```

Important: this official result does **not** use the later `threshold_new` generation setting described in:

```text
HT/SYNTHETIC_BERNOULLI_THRESHOLD_NEW_GENERATION_SETTING.md
```

That later file describes exploratory `threshold_new` attempts such as `beta=5, tau=1`. The official result uses the older/default synthetic data setting:

```text
HT/synthetic_bernoulli_task2/configs/default_semi_synthetic.json
HT/synthetic_bernoulli_task2/outputs/default_seed42/
```

## One-Line Summary

The official synthetic Bernoulli data use real Task II image embeddings as the empirical image distribution, construct 27 latent binary findings from 10 standardized PCA features, generate 34 synthetic annotators with centered nonlinear annotator-specific bias functions, sample Bernoulli labels from the resulting annotator probabilities, then train BCE surrogate models and test them using the new disagreement-count/N-bound calibration.

## Fixed Configuration

```text
config name: default_semi_synthetic_n34_k32_tau0p1_pos_uniform03_05_beta2_seed42
master seed: 42
annotators: R01-R34
n annotators: 34
n findings/aspects: 27
embedding dimension: 1376
PCA dimension: 10
latent logit scale beta: 2
tau: 0.1
target positive rate: one value per finding, sampled Uniform(0.3, 0.5)
synthetic image pool size: 5438
train/val/test split: 2887 / 738 / 1813
surrogate training loss: BCE
official test K values: 16, 24, 32
official random trials: 120 unique A/B/reference configurations per K
official kappa used in test: 2
```

`kappa` is **not** a data-generation parameter. It is used only later in the Task II certification bound.

## Source Data and Image Pool

The generator starts from the existing Bernoulli Task II image pool and embeddings:

```text
source image pool:
HT/synthetic_bernoulli_task2/inputs/task2_image_pool.csv

source Task II split data:
HT/v2_ber_multitask_mse/task_II_Bernoulli/processed_data

embedding directories:
Data_process/###Embeddings###/embeddings
Data_process/###Embeddings###/embeddings_new
```

Only image IDs, split membership, and embeddings are used. The original real disease labels are **not** used to generate the synthetic labels.

The fixed pool contains:

```text
unique images before embedding filter: 5438
unique images after embedding filter: 5438
missing embeddings: 0
train images: 2887
val images: 738
test images: 1813
```

The split assignment follows the saved pool file. If an image appears in multiple source split memberships, the priority is:

```text
test > val > train
```

This is why the synthetic split counts are fixed and reused by training and testing.

## Embeddings and PCA Features

For each image, the stored embedding is pooled to a vector:

```text
x in R^1376
```

PCA is fit on the complete fixed image pool, not separately by split. The generator uses a deterministic block-power/Ritz PCA implementation:

```text
pca_algorithm: block_power_ritz
pca_dim: 10
pca_power_iterations: 60
pca_residual_tolerance: 1e-6
```

The first 10 PCA scores are standardized over the complete image pool using `ddof=0`, giving:

```text
z(x) in R^10
```

The saved numerical checks are:

```text
n_images: 5438
embedding_dim: 1376
pca_dim: 10
max_abs_z_mean: 3.70e-17
max_abs_z_cov_minus_identity: 5.77e-15
min_z_std_ddof0: 0.9999999999999983
max_z_std_ddof0: 1.0000000000000029
pca_iterations_run: 34
pca_converged: True
pca_max_relative_residual: 9.57e-07
```

So, numerically:

```text
E_X z(X) = 0
Cov_X z(X) = I_10
```

Saved files:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/embedding_pool.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/pca_params.npz
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/pca_features_z.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/summaries/pca_checks.csv
```

## Latent Finding Scores

For each finding/aspect `h = 1,...,27`, the generator samples one random direction:

```text
c_h ~ N(0, I_10)
c_h <- c_h / ||c_h||_2
```

Then it defines:

```text
s_h(x) = c_h^T z(x)
```

Because `z(x)` is standardized and each `c_h` has unit norm:

```text
E_X s_h(X) = 0
Var_X s_h(X) = 1
```

The latent logit score used for the baseline probability is:

```text
beta * s_h(x)
```

For the official data:

```text
beta = 2
```

This means `mu_star` is more spread out than a beta=1 construction, but not as extreme as the later beta=4 or beta=5 exploratory attempts.

Saved files:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/aspect_weights.npz
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/aspect_weights.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/aspect_scores_s.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/latent_scores_beta_s.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/summaries/aspect_score_checks.csv
```

## Target Positive Rates and Baseline Probability

For each finding, a target annotator-population positive rate is sampled independently:

```text
pi_h ~ Uniform(0.3, 0.5)
```

The realized target positive-rate range is:

```text
min pi_h: 0.30144194298906707
max pi_h: 0.496188567525264
mean pi_h: 0.3987039366696296
```

The baseline latent probability is:

```text
mu_star_h(x) = sigmoid(a_h + beta * s_h(x))
```

The intercept `a_h` is solved numerically so that the expected annotator-population positive rate for finding `h` matches `pi_h`, after integrating over the annotator-population bias distribution. The tolerance is:

```text
positive_rate_tolerance: 1e-4
```

In this run the maximum absolute population-rate error was:

```text
6.18e-06
```

Overall rates:

```text
target positive-rate mean: 0.3987039366696296
mu_star pool mean: 0.3986187582130494
finite-panel expected positive rate: 0.3989316495518027
sampled label positive rate: 0.39881099757135496
```

The actual target positive rates by finding are saved in:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/summaries/positive_rate_summary.json
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/intercepts.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/summaries/positive_rates_by_aspect.csv
```

## Annotator Bias Model

Each annotator `r` and finding `h` has a separate nonlinear bias function. The bias uses the full 10-dimensional PCA feature `z(x)`, not only the scalar latent score `s_h(x)`.

For each annotator/finding pair, the generator samples a random one-hidden-layer tanh network:

```text
f_{r,h}(x) = v_{r,h}^T tanh(W_{r,h} z(x) + u_{r,h})
```

Network dimensions:

```text
10 -> 32 -> 1
```

Parameter distributions:

```text
W_{r,h}[j,k] ~ N(0, 0.1)
u_{r,h}[j]   ~ N(0, 1)
v_{r,h}[j]   ~ N(0, 0.0003125)
```

Since:

```text
0.0003125 = 0.1^2 / 32
```

the output layer scale corresponds to `tau=0.1`.

The raw network output is centered over the complete image pool:

```text
f_centered_{r,h}(x) = f_{r,h}(x) - E_X f_{r,h}(X)
```

Each annotator/finding also has a global offset:

```text
C_{r,h} ~ N(0, tau^2)
tau = 0.1
```

The complete annotator bias is:

```text
b_{r,h}(x) = C_{r,h} + f_centered_{r,h}(x)
```

Therefore:

```text
E_X b_{r,h}(X) = C_{r,h}
Var_X b_{r,h}(X) = Var_X f_centered_{r,h}(X)
```

Saved files:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/bias_network_params.npz
HT/synthetic_bernoulli_task2/outputs/default_seed42/artifacts/bias_network_summary.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/probabilities/f_centered.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/probabilities/bias_b.npy
```

## Annotator Probabilities and Labels

For image `x`, finding `h`, and annotator `r`, the annotator probability is:

```text
mu_{r,h}(x) = sigmoid(a_h + beta * s_h(x) + b_{r,h}(x))
```

Then the synthetic label is sampled independently:

```text
Y_{r,h}(x) | x,r,h ~ Bernoulli(mu_{r,h}(x))
```

Conditional on the generated probabilities, labels are sampled independently across annotators/images/findings.

Saved probability and label arrays:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/probabilities/mu_star.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/probabilities/mu_annotator.npy
HT/synthetic_bernoulli_task2/outputs/default_seed42/probabilities/labels.npy
```

The train/val/test CSVs used by training are:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/processed_data/train_R*.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/processed_data/val_R*.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/processed_data/test_R*.csv
```

Each CSV has:

```text
image_id, rad_id, 27 binary finding columns
```

There is one CSV per synthetic annotator.

## Random Number Streams

The master seed is:

```text
42
```

Separate PCG64 streams are spawned for:

```text
aspect_weights
intercept_population_noise
bias_networks
global_offsets
label_sampling
target_positive_rates
```

This separation matters because changing label sampling should not silently change the aspect directions or bias networks.

## Oracle Kappa Information

For this generator:

```text
tau^2 = 0.01
hidden_dim * output_weight_variance = 32 * 0.0003125 = 0.01
```

The population bound used for the generation oracle is:

```text
population E[C^2] = 0.01
population upper bound on E[Var_X f] = 0.01
population valid kappa upper bound = 1 + 0.01 / 0.01 = 2
```

This is why the official Task II test uses:

```text
kappa = 2
```

The finite 34-annotator panel has a smaller empirical diagnostic ratio, but that empirical ratio is not used as the theoretical population bound.

Saved oracle files:

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/summaries/oracle_by_aspect.csv
HT/synthetic_bernoulli_task2/outputs/default_seed42/reports/oracle_report.md
```

## Training and Test Connection

The data generation stops after synthetic labels and oracle summaries. After generation:

1. A separate 27-output BCE surrogate is trained for each synthetic annotator R01-R34.
2. Validation labels are used to select a threshold separately for each annotator and finding.
3. In the official Task II comparison, the A-model probability is thresholded:

```text
hat_Y_A(x) = 1{hat_mu_A(x) >= validation threshold}
```

4. Reference predictors remain probability-valued trained models:

```text
hat_mu_R(x) = average of K trained reference probabilities
```

5. The official result uses the new disagreement-count/N-bound calibration for the final `g` distortion term.

The current official result is archived at:

```text
HT/bernoulli_task2_results/official_result/
```

The main official result file is:

```text
HT/bernoulli_task2_results/official_result/oracle_power/overall.csv
```

The official power summary is:

```text
alpha=0.05, K=16:    0 / 3240 rejections
alpha=0.05, K=24:    0 / 3240 rejections
alpha=0.05, K=32:    0 / 3240 rejections

alpha=0.10, K=16:    1 / 3240 rejections
alpha=0.10, K=24:    2 / 3240 rejections
alpha=0.10, K=32:    3 / 3240 rejections

alpha=0.20, K=16:   87 / 3240 rejections
alpha=0.20, K=24:  415 / 3240 rejections
alpha=0.20, K=32: 1222 / 3240 rejections
```

For the official run, all 3240 finding-level configurations satisfy the oracle alternative at each K, so the rejection percentages can be interpreted as empirical power for this synthetic setting.

## What This Is Not

This official synthetic data setting is not:

```text
beta=4, tau=0.3
beta=5, tau=1
threshold_new_seed42_beta4_tau0p3
threshold_new_seed42_beta5_tau1
```

Those were later exploratory attempts and are not the current official Bernoulli Task II result.
