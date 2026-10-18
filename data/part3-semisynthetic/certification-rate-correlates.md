# Bernoulli Task II: Finding-Level Certification Rate Correlates

This note summarizes selected finding-level metrics associated with certification difficulty in the official synthetic Bernoulli Task II result.

## Analysis Target

Outcome:

\[
\mathrm{CertRate}_h
= \frac{\#\{\text{certified/rejected configurations for finding }h\}}{120}.
\]

The correlations below use:

- official synthetic Bernoulli Task II result;
- \(K=32\);
- \(\alpha=0.20\);
- 27 findings;
- Pearson correlation across findings.

Important: the first two metrics below are learned-reference-model diagnostics. They are useful for explaining why the calibration bound becomes large, but they are not raw embedding features.

## Learned-Reference Logit Diagnostics

Let

\[
\ell_{r,h}(x)=\operatorname{logit}\{\hat\mu_{r,h}(x)\},
\]

where \(\hat\mu_{r,h}(x)\) is the trained reference model \(r\)'s predicted probability for finding \(h\). These quantities are computed on the calibration set \(D_2\).

### 1. Variance of Mean Predicted Logits Across Reference Models

Define

\[
m_{r,h}=E_{X\in D_2}\ell_{r,h}(X),
\]

and

\[
\mathrm{MeanLogitVar}_h
=\operatorname{Var}_r(m_{r,h})
=\operatorname{Var}_r\left\{E_{X\in D_2}\ell_{r,h}(X)\right\}.
\]

Interpretation:

This measures how different the reference models are in their average predicted logit for a finding. Large values mean some reference models are overall more positive for that finding, while others are overall more negative.

Correlation:

\[
\operatorname{corr}(\mathrm{MeanLogitVar}_h,\mathrm{CertRate}_h)=-0.766.
\]

Reason this matters:

If reference models differ strongly in their average predicted logits, the calibrated uncertainty for the reference panel becomes larger, making certification harder.

### 2. Average Across-Reference Logit Variance on Images

Define

\[
\mathrm{TotalLogitDisagree}_h
=E_{X\in D_2}\left[\operatorname{Var}_r\{\ell_{r,h}(X)\}\right].
\]

Interpretation:

For each image, this measures how spread out the reference-model logits are, then averages that spread over images.

Correlation:

\[
\operatorname{corr}(\mathrm{TotalLogitDisagree}_h,\mathrm{CertRate}_h)=-0.564.
\]

Reason this matters:

This is a direct learned-reference disagreement measure. Larger disagreement means the trained reference panel is less stable for that finding, so the final certification bound tends to be harder to pass.

Relation between the two:

\[
E_X\operatorname{Var}_r\{\ell_{r,h}(X)\}
=
\operatorname{Var}_r\{E_X\ell_{r,h}(X)\}
+
E_X\operatorname{Var}_r\{\ell_{r,h}(X)-E_X\ell_{r,h}(X)\}.
\]

So the second metric contains the first metric plus image-dependent disagreement after subtracting each reference model's average logit level.

## Candidate Explanatory Metrics

These are less direct than the learned-logit diagnostics. They are closer to generation, training, or latent-probability structure.

### 3. Direction Concentration: \(\sum_k v_{h,k}^4\)

For finding \(h\), \(v_h\in\mathbb R^{10}\) is the random unit vector used to define the latent score:

\[
s_h(x_i)=z_i^\top v_h.
\]

Write

\[
v_h=(v_{h,1},\ldots,v_{h,10}).
\]

Define

\[
H_h=\sum_{k=1}^{10}v_{h,k}^4.
\]

Because \(v_h\) is a unit vector,

\[
\sum_{k=1}^{10}v_{h,k}^2=1.
\]

Interpretation:

\(H_h\) measures whether the random finding direction is concentrated on a small number of PCA-feature coordinates. Larger \(H_h\) means the synthetic finding score is driven more by fewer coordinates.

Correlation:

\[
\operatorname{corr}(H_h,\mathrm{CertRate}_h)=0.436.
\]

Reason this may matter:

If a synthetic finding direction is concentrated on fewer PCA-feature coordinates, the signal may be simpler for the surrogate models to learn and for the reference panel to calibrate.

### 4. Training Performance MSE on Test Set

Define

\[
\mathrm{TrainMSE}_h
=E_{r,X\in D_1}
\left[
\{\hat\mu_{r,h}(X)-\mu_{r,h}(X)\}^2
\right],
\]

where \(D_1\) is the test/evaluation split, \(\hat\mu_{r,h}\) is the trained surrogate probability, and \(\mu_{r,h}\) is the true synthetic annotator probability.

Interpretation:

This is the test-set probability MSE of the trained surrogate models against the known synthetic probabilities. Smaller values mean better first-stage training accuracy.

Correlation:

\[
\operatorname{corr}(\mathrm{TrainMSE}_h,\mathrm{CertRate}_h)=-0.195.
\]

Reason this may matter:

Poorer surrogate training can make model comparisons and reference calibration less stable. In the current result this association is weak and negative, so training MSE does not appear to be the main driver of certification difficulty.

### 5. Effective Dimension of \(v_h\)

Define

\[
\mathrm{EffDim}_h
=
\frac{1}{\sum_{k=1}^{10}v_{h,k}^4}.
\]

Interpretation:

This is the inverse of the concentration metric above. Smaller effective dimension means \(v_h\) is concentrated on fewer coordinates; larger effective dimension means it is more spread out across the 10 coordinates.

Correlation:

\[
\operatorname{corr}(\mathrm{EffDim}_h,\mathrm{CertRate}_h)=-0.368.
\]

Reason this may matter:

This is the same empirical pattern as \(H_h\), expressed in the opposite direction. More spread-out random directions tend to have lower certification rate in this run.

### 6. Standard Deviation of \(\mu_h^*(X)\)

The latent target probability is

\[
\mu_h^*(x)=\sigma(a_h+\beta s_h(x)),
\qquad
s_h(x)=z(x)^\top v_h.
\]

Define

\[
\mathrm{SDMuStar}_h
=
\operatorname{SD}_{X}\{\mu_h^*(X)\}.
\]

Interpretation:

This measures how dispersed the latent target probability is across images for finding \(h\). Larger values mean the latent probabilities are more spread out over the image pool.

Correlation:

\[
\operatorname{corr}(\mathrm{SDMuStar}_h,\mathrm{CertRate}_h)=0.312.
\]

Reason this may matter:

If \(\mu_h^*(X)\) is more spread out, the latent comparison between model and human may be easier to distinguish for some configurations. The association is positive but moderate.

## Summary Table

| metric | definition | corr with cert rate |
|---|---|---:|
| variance of mean predicted logits | \(\operatorname{Var}_r\{E_{X\in D_2}\ell_{r,h}(X)\}\) | -0.766 |
| average across-reference logit variance | \(E_{X\in D_2}\operatorname{Var}_r\{\ell_{r,h}(X)\}\) | -0.564 |
| direction concentration | \(\sum_{k=1}^{10}v_{h,k}^4\) | 0.436 |
| training test MSE | \(E_{r,X\in D_1}[(\hat\mu_{r,h}(X)-\mu_{r,h}(X))^2]\) | -0.195 |
| effective dimension of \(v_h\) | \(1/\sum_{k=1}^{10}v_{h,k}^4\) | -0.368 |
| standard deviation of \(\mu_h^*(X)\) | \(\operatorname{SD}_X\{\mu_h^*(X)\}\) | 0.312 |

## Interpretation

The two learned-logit metrics have the strongest correlations, but they are close to the calibration mechanism itself. They should be described as diagnostics of reference-model instability, not as primitive data-generation factors.

Among the more structural metrics, the clearest signal is concentration of the random finding direction \(v_h\). Findings whose synthetic direction is concentrated on fewer PCA-feature coordinates have higher certification rate in this run. The spread of the latent probability \(\mu_h^*(X)\) also has a moderate positive association. Training test MSE has only a weak negative association and does not look like the main explanation.
