# Annotation Bias — Full Draft and Quarto Agent Instructions

版本：2026-09-24。交付对象：在作者本地项目中工作的 Claude / VS Code agent。

这份文件包含可直接采用的英文初稿、图表及结果导入规范、数学解释、Quarto 展示指令和完整 BibTeX。它不是要求另一个 agent 再写一篇文章的 outline。**下游 agent 的任务是拆分文件、排版、导入结果和本地检查；内容、结构和论证以本文为准。**

## 0. 先读：交接约定与已经确定的编辑决定

### 0.1 哪些内容进入博客

- **第 2–6 节是英文正文**：依次是 Introduction、Part I、Part II、Part III、Conclusion。保留论证、公式、数字和结论边界。中文的 `【Agent 指令】` 不进入公开正文。
- 标为 `【折叠内容】` 的英文段落也属于初稿；放进默认收起的 Quarto callout。不要删去，也不要全部摊开。
- 第 1、7–11 节是执行说明和编辑依据；不要把整份交接文件原样当博客渲染。
- 第 12 节完整 BibTeX 提取为 `references.bib`。正文已经放入对应引用键。
- `[[ASSET:...]]` 表示已有实验的文件尚待作者复制；`[[PENDING:...]]` 表示实验最终结果尚未完成；`[[VERIFY:...]]` 表示 workflow 未提供的实现元数据。三者不能互换。
- 文件中给出的统计结论仅来自这次上传的材料。不要自行训练、重跑实验、编造曲线或替作者选择有利结果。生成图表仅允许对复制过来的汇总数据进行确定性的展示变换。

### 0.2 采用的结构

**Introduction 常驻 → 三个 Part 选项 → 当前 Part → Conclusion 常驻 → References。**

这里“常驻”指切换 Part 时仍保留在页面的正常文档流中；不把 Introduction 或 Conclusion 固定在屏幕上。三部分使用一个编译页面中的三个页签，源文件分别保存。这样既减少同时展开的长度，又共享公式编号、引用和上下文。

三个 Part 的逻辑分别是：

| 展示名称 | 要回答的问题 | 实验安排 |
|---|---|---|
| I · Self-reference | 训练标注者兼任评价 reference，会怎样改变模型对另一位人的优势？ | **真实 scalar Task I + 真实 Bernoulli Task I** 都在这里；后者待完成 |
| II · Continuous | 在 bounded scalar / additive 框架下，何时能认证 reference 保留了比较方向？ | R11–R16 trained-reference Task II |
| III · Bernoulli | 二元标签的 logit bias 为什么需要另一套界和 calibration？ | 34 annotators 的半合成 Bernoulli Task II |

不再增加一整篇独立的 Methods 和一整篇 Experiments。每个 Part 都按“问题 → 设置 → 核心结果及解释 → 对应实验 → 小结”的顺序写；完整推导、模型细节和大表放在该处折叠块里。**General setup 与 Bernoulli setup 明确分开。**

### 0.3 本稿依赖的材料

1. `outline.md`：文章目的、三部分叙事、主要解释应放在正文的偏好。
2. `WORKFLOW_OVERVIEW_FOR_PAPER_AGENT.md`：当前实验版本、设置、完成状态、数值、服务器文件。
3. `Anno_bias_theory_modified(1).pdf`：general/additive Task I、Task II 与 trained-reference 理论。
4. `Bernoulli_version_Sept(1).pdf`：Bernoulli Task II。
5. `Task_II_Synthetic_Data_Gen(1).pdf`：半合成生成框架；实际分布、规模及结果以 workflow 的具体实现为准。

公开文献用于背景、数据归属和已有方法，不替代本项目的定理来源。理论笔记中的几个结论范围需要更准确的措辞；本稿已经处理，见第 10 节。不要在排版时把这些限定删掉。

### 0.4 当前结果状态

| 实验 | 已知结果 | 本稿处理 |
|---|---|---|
| Scalar Task I，R8–R10 | 6 个 ordered triples 中 4 个在所有报告的 nominal levels 下拒绝；R10 作为训练标注者的两组估计效应为负 | 写完整结论；精确效应和图待 CSV |
| Real Bernoulli Task I，R8–R10 | 训练及校准流程已有；最终 self-reference test 结果未提供 | 写完整方法和图表方案；**保留结果待完成** |
| Continuous Task II，R11–R16 | `prob` 为 .01/.05/.10/.20 时认证 2/10/21/60 个配置，分母各 330 | 写完整结果；按 K 的图待 CSV |
| Synthetic Bernoulli Task II | K=8/16/32、三种 `prob` 的汇总已提供 | 写完整表格与解释；图片必须匹配该 K 网格 |

注意：服务器最终 heatmap 名字包含 **K16/K24/K32**，而已提供数字是 **K8/K16/K32**。本稿以后一组为已核实的主结果；不能猜测 K24。

---

## 1. 页面内容地图与阅读节奏（不进入正文）

建议标题：**Who Judges the Model?**

副标题：**Annotation bias, self-reference, and reliable model–human comparisons**

不用“AI really beats humans?”做结论式标题。文章研究的是特定评价量的 reference dependence，不是全面医学能力。

| 区域 | 常规展开内容 | 折叠内容 / 图表 |
|---|---|---|
| 标题之后 | 3 句 summary、Introduction、简短 worked example | example 是解释性数值，不是假装真实病人 case |
| Part I | A/B/C、general setup、self-reference identity、bias mechanism、Bernoulli setup、两项真实实验 | ERM 与代数；训练样本表；27-aspect 名单；真实 Bernoulli 结果占位 |
| Part II | trained references 的必要性；latent comparison；margin 对 distortion 的认证；calibration 解释；真实结果 | calibration 矩阵与证明；按配置完整表 |
| Part III | logit bias；曲率导致残余偏移；Bernoulli bound；半合成设置与结果 | 精确生成分布；κ 推导；solver 细节 |
| Conclusion | 三个得到的认识、未完成实验和解释边界 | 不新增实验结论 |
| References | Quarto 生成的统一文献列表 | 不在三个 Part 中重复生成 |

主文阅读不应依赖展开证明。每个 Part 顶部放一句 takeaway 与 3–4 个内部导航链接。图紧跟解释该图的段落，不在文章末尾堆图。

---

## 2. PUBLIC DRAFT — Introduction

### Summary

A model can learn an annotator's systematic tendencies as well as the task. When that annotator also supplies the evaluation reference, the model's apparent advantage over another human can change. We study how to detect this self-reference effect and when an ensemble of annotator-specific models can certify a comparison despite reference distortion.

### Introduction

Human labels enter a model twice: first as a training signal, and later as the standard against which its predictions are judged. These roles are often discussed separately. Their interaction matters when annotators differ systematically.

Some tasks are explicitly subjective. In hate-speech or emotion annotation, different judgments may reflect different interpretations rather than interchangeable mistakes. Annotation policy helps determine which judgments a system should reproduce [@rottger2022paradigms; @davani2022disagreements]. Human preferences also shape language-model training. InstructGPT, for example, uses human demonstrations and comparisons, while explicitly examining generalization to held-out labelers [@ouyang2022instruction]. In medical image interpretation, an underlying clinical condition may exist even when the available labels do not provide an uncontested reference for it. These settings differ, but they share an evaluation question: **whose judgments define success?**

Consider a model trained on annotator A and compared with annotator B. If A also supplies the evaluation labels, close agreement with A is rewarded twice: it is what training encourages, and what evaluation measures. A model can therefore look relatively strong because it has learned A's systematic tendencies. Evaluating against a different annotator C may change that apparent advantage. But replacing A with C does not, by itself, establish that C is the right reference.

Model–human comparisons make this issue concrete. CheXNet reported a higher average F1 score than its radiologist comparison group under its study protocol [@rajpurkar2017chexnet]. Such findings must be interpreted together with the reference and metric used. Our analysis does not re-evaluate CheXNet or attribute the mechanism below to that study; it asks what a reference-dependent comparison can establish in general.

Here is a deliberately simple example. On one illustrative item, a model predicts 0.75, A reports 0.80, and B and C both report 0.20. Using squared loss gives:

| Evaluation reference | Model loss | B's loss | Model loss minus B's loss |
|---|---:|---:|---:|
| A: 0.80 | 0.0025 | 0.3600 | −0.3575 |
| C: 0.20 | 0.3025 | 0.0000 | +0.3025 |

The predictions did not change; the reference did. The negative gap favors the model under A, while the positive gap favors B under C. This example illustrates a possible reversal, not an observed experimental result and not evidence that either reference is correct.

Previous work has shown that annotator-specific patterns can be learned: Geva et al. found that performance often deteriorated on examples produced by unseen annotators in text datasets [@geva2019annotator]. Multi-annotator models can represent disagreement explicitly [@davani2022disagreements]. Classical approaches instead estimate latent labels and observer errors under specified models [@dawid1979observer; @raykar2010crowds]. Our question is more specific: **does a particular evaluation reference preserve the direction of a particular model–human comparison?**

The article proceeds in three parts. Part I measures how the comparison changes under self-reference, for both bounded scalar and binary labels. Part II develops a trained-reference procedure in an additive framework. Part III treats binary labels through a logit-bias model, where averaging more references cannot automatically remove every component of distortion. The aim is to make the assumptions behind a comparison visible, and to distinguish a detectable reference effect from a certified conclusion about a latent target.

【Agent 指令】Summary 用浅灰摘要块；Introduction 正常正文。示例表作为 `tbl-illustrative-reference`，caption 明确写 “Illustrative values, not experimental observations.” 不另画装饰性网络图。三部分选择器放在本节之后。角色说明在 Part I 中展开，不在 Introduction 堆符号。

---

## 3. PUBLIC DRAFT — Part I: When the training annotator also judges the model

**Takeaway.** Self-reference can shift a model–human comparison in the model's favor. The shift is directly estimable, but a positive shift does not establish that the model wins, that the ranking reverses, or that the alternative reference is correct.

### 3.1 General setup: separate the competitor from the reference

Let $X$ denote an item. Annotator $r$ produces a response $Y_r$, with conditional mean

$$
\mu_r(x)=\mathbb E[Y_r\mid X=x,r].
$$

A model trained on A's labels outputs $p_A(x)$. We compare this model with B's observed response, using another response as the reference.

| Role | Symbol | What it represents |
|---|---|---|
| Training annotator | A | Supplies labels used to train the model |
| Model | $p_A$ | A prediction rule fitted to A's responses |
| Human competitor | B | The human response against which the model is compared |
| External reference | C | A distinct annotator used to evaluate that comparison |
| Latent target | $\mu^*$ | The target specified by the statistical model; not directly observed |

For the bounded scalar formulation, write

$$
Y_r=\mu_r(X)+\varepsilon_r,\qquad
\mu_r(X)=\mu^*(X)+b_r(X),\qquad
\mathbb E[\varepsilon_r\mid X,r]=0.
$$

The population-centering assumption is $\mathbb E_r[b_r(x)]=0$ at each $x$. Here the expectation over $r$ refers to an idealized population of annotators. It does not say that every fixed panel averages exactly to $\mu^*$, or that each annotator's bias averages to zero over items. In this additive model, $\mu^*$ is the annotator-population mean response. Treating it as a clinical target would require further justification.

Separate learning error from annotation bias by writing

$$
p_A=\mu_A+h_A=\mu^*+b_A+h_A.
$$

The term $b_A$ describes what is systematic about A's responses. The term $h_A$ describes how the fitted model differs from A's conditional mean. Learning A more accurately can reduce $h_A$ while preserving $b_A$.

### 3.2 A comparison gap and a self-reference effect

Using reference J, define the squared-loss gap

$$
\Delta_J
=\mathbb E\!\left[(p_A(X)-Y_J)^2-(Y_B-Y_J)^2\right].
$$ {#eq-comparison-gap}

A negative gap favors the model; a positive gap favors B. The evaluation metric is squared loss, not classification accuracy or AUC. A soft prediction and an observed human response are the two competitors.

Self-reference uses J=A. External-reference evaluation uses J=C. Their difference is

$$
\begin{aligned}
S_{A,C}
&=\Delta_C-\Delta_A\\
&=2\mathbb E\!\left[(Y_A-Y_C)(p_A(X)-Y_B)\right].
\end{aligned}
$$ {#eq-self-reference}

If $S_{A,C}>0$, the gap is more favorable to the model when A is the reference. This definition measures a change in the comparison. It does not require $\Delta_A<0$ or a change of sign between $\Delta_A$ and $\Delta_C$.

【折叠内容：Why the identity holds】

For arbitrary real values $p,b,a,c$,

$$
[(p-c)^2-(b-c)^2]-[(p-a)^2-(b-a)^2]
=2(a-c)(p-b).
$$

Taking expectations gives @eq-self-reference. The algebra does not depend on an additive bias model or on whether the responses are binary. The model assumptions enter when interpreting the effect and quantifying its uncertainty.

【折叠内容结束】

### 3.3 Why the effect can appear even when learning works

On evaluation items held out from fitting, assume the idiosyncratic responses of distinct annotators are independent conditional on the item and annotator identities. Then

$$
\frac{S_{A,C}}{2}
=\mathbb E_X[(\mu_A-\mu_C)(\mu_A-\mu_B+h_A)].
$$

In the additive formulation this becomes

$$
\begin{aligned}
\frac{S_{A,C}}{2}
={}&\mathbb E_X[b_A^2]
-\mathbb E_X[b_A b_B]\\
&-\mathbb E_X[b_C(b_A-b_B)]
+\mathbb E_X[(b_A-b_C)h_A].
\end{aligned}
$$ {#eq-bias-decomposition}

The first term captures alignment with A's own systematic tendencies. The next two depend on how the particular annotators agree or differ. The last reflects imperfect learning. This is why self-reference has a systematic mechanism without having the same sign for every fixed trio.

The population-learning ideal makes the mechanism especially clear. If A, B, and C are independent draws from the annotator population and $p_A=\mu_A$, then

$$
\mathbb E_{A,B,C}[S_{A,C}]
=2\mathbb E_X\operatorname{Var}_r\{\mu_r(X)\}\geq0.
$$ {#eq-average-self-reference}

The expected shift is strictly positive whenever annotators' conditional response tendencies differ on a set of items with positive probability. In the additive centered model, this variance is $\mathbb E_r[b_r(X)^2]$.

More training data can make a model a better predictor of A without making A an independent judge of that model's performance. At the same time, @eq-average-self-reference is a statement over sampled annotators. It does not predict that all six permutations of one realized three-person panel must show a positive effect.

【Agent 指令】本小节是原 outline 指定的核心解释，必须留在主文。不能只显示公式后把全部 interpretation 折起来。

【折叠内容：What training learns, and what remains when the fit is imperfect】

For squared-loss training on A,

$$
\mathbb E[(g(X)-Y_A)^2]
=\mathbb E[(g(X)-\mu_A(X))^2]
+\mathbb E[\operatorname{Var}(Y_A\mid X,A)].
$$

The unrestricted population minimizer is $\mu_A$. With a restricted model class, $h_A$ includes approximation and estimation error, as well as any optimization error of the fitted model.

For iid bounded training observations and exact empirical risk minimization over $\mathcal F\subseteq[0,1]$, the source notes give a bound of the form

$$
\|h_A\|_2^2\leq
\inf_{g\in\mathcal F}\|g-\mu_A\|_2^2
+8\mathfrak R_n(\mathcal F)
+2\sqrt{\frac{\log(2/\delta)}{2n}}
$$

with probability at least $1-\delta$. Here $\mathfrak R_n$ is the expected Rademacher complexity of the prediction class. This explains the roles of approximation and sample size; it is not a claim that neural-network optimization necessarily achieves exact ERM.

A useful statement that also covers binary responses sets $m(x)=\mathbb E_r\mu_r(x)$. Provided the fit on A does not use B or C,

$$
\begin{aligned}
\mathbb E[S_{A,C}]
={}&2\mathbb E_X\operatorname{Var}_r\{\mu_r(X)\}\\
&+2\mathbb E_{A,\mathrm{train}}\mathbb E_X[(\mu_A-m)h_A].
\end{aligned}
$$

The absolute value of the second term is at most

$$
2\mathbb E_{A,\mathrm{train}}
[\|\mu_A-m\|_2\,\|h_A\|_2].
$$

Accurate learning makes this remainder small; it does not remove the leading between-annotator variation.

【折叠内容结束】

### 3.4 Detecting the effect from paired evaluation items

For each of $n$ evaluation items, form the paired contribution

$$
Z_i=2(Y_{A,i}-Y_{C,i})(p_A(X_i)-Y_{B,i}).
$$

Estimate $S_{A,C}$ by $\widehat S=n^{-1}\sum_iZ_i$ and its standard error by $s_Z/\sqrt n$. The one-sided test of $H_0:S_{A,C}\leq0$ rejects when

$$
\widehat S-t_{n-1,1-\alpha}\frac{s_Z}{\sqrt n}>0.
$$ {#eq-task1-test}

The unit of replication is the item. All responses on one item remain paired. With iid held-out evaluation items and nonzero finite variance, this is an asymptotic test; the Student-t cutoff does not make it an exact finite-sample test for arbitrary bounded responses.

### 3.5 Bernoulli setup: the same question, a different response model

For a binary aspect $h$, retain the individual label:

$$
Y_{r,h}\mid X,r\sim\operatorname{Bernoulli}(\mu_{r,h}(X)),
\qquad
\operatorname{logit}\mu_{r,h}
=\operatorname{logit}\mu_h^*+b_{r,h}.
$$

This models systematic differences on the logit scale. Even if $\mathbb E_r b_{r,h}(x)=0$, the mean probability $\mathbb E_r\mu_{r,h}(x)$ need not equal $\mu_h^*(x)$. We will need that distinction in Part III.

For Task I, however, the Brier-loss identity remains exactly the same:

$$
S_{A,C,h}
=2\mathbb E[(Y_{A,h}-Y_{C,h})(p_{A,h}(X)-Y_{B,h})].
$$

An unweighted binary-cross-entropy model targets the annotator's conditional probability $\mu_{A,h}$ at the unrestricted population optimum. Its probability output can still be evaluated with Brier loss. Training loss and evaluation loss do not need to be identical.

The ideal average self-reference effect in @eq-average-self-reference still applies, now using between-annotator variance **on the probability scale**. It is not twice the variance of the logit biases.

If we summarize 27 aspects, we average their $Z_{i,h}$ values within each image and then compute uncertainty across images. We do not treat the 27 labels of one image as 27 independent observations. Aspect-specific tests are useful descriptively, but simultaneous claims across aspects and trios require an explicit multiple-testing rule.

### 3.6 Real-data setting: two views of the same annotations

We use annotator-specific labels from VinDr-CXR [@nguyen2022vindr; @vindr2021data], accessed through PhysioNet [@pollard2026physionet]. The released resource contains 18,000 radiographs. Its official training set has three independent radiologist annotations per image; its official test set uses five-reader consensus. Our experiments use filtered annotator cohorts and project-specific splits. Their held-out sets should not be confused with the resource's official consensus test set.

The project represents each image with a precomputed 1,376-dimensional embedding. When an embedding contains multiple spatial or instance vectors, those vectors are averaged. The processed labels contain 27 clinical finding or diagnosis indicators, excluding “No finding.” We analyze them in two ways:

| Experiment | Response representation | Model output | Training objective |
|---|---|---|---|
| Scalar Task I | Mean of the 27 binary indicators | One sigmoid output | Mean squared error |
| Bernoulli Task I | All 27 indicators separately | 27 sigmoid probabilities | Unweighted binary cross-entropy |

The scalar response is

$$
Y_r^{\mathrm{avg}}=\frac1{27}\sum_{h=1}^{27}Y_{r,h}.
$$

It is a bounded score with 28 possible values, not a continuously distributed clinical measurement or a disease-severity scale. It can summarize how broadly an annotator marks findings, but it removes information about which findings were marked. Squared loss on this average is also different from averaging 27 aspect-specific Brier losses.

Both Task I workflows use R8, R9, and R10, with annotator-specific training and validation data and the same paired evaluation images. The evaluation table has 4,500 annotation rows, corresponding to **1,500 images with three annotations each**. The paired test therefore uses 1,500 image-level observations.

【折叠内容：Training splits and label construction】

| Annotator | Training rows | Mean scalar label, training | Validation rows | Mean scalar label, validation |
|---|---:|---:|---:|---:|
| R8 | 4,446 | 0.0698 | 636 | 0.0643 |
| R9 | 4,046 | 0.0953 | 579 | 0.0955 |
| R10 | 4,346 | 0.0774 | 621 | 0.0795 |

The mean scalar label across the 4,500 evaluation rows is 0.0957. These prevalence summaries describe the processed splits; they do not by themselves identify an annotator effect because the training item distributions can differ.

Both networks use the precomputed embedding, two hidden layers, and the appropriate one- or 27-dimensional output. The binary workflow has no positive-class weighting, aspect weighting, or additional “No finding” head or constraint. The binary data preparation preserves the original Task I split rather than introducing a new random split.

The processed aspects are: Aortic enlargement; Atelectasis; Calcification; Cardiomegaly; Clavicle fracture; Consolidation; Edema; Emphysema; Enlarged PA; ILD; Infiltration; Lung Opacity; Lung cavity; Lung cyst; Mediastinal shift; Nodule/Mass; Pleural effusion; Pleural thickening; Pneumothorax; Pulmonary fibrosis; Rib fracture; Other lesion; COPD; Lung tumor; Pneumonia; Tuberculosis; Other diseases.

【折叠内容结束】

### 3.7 Scalar result: a positive effect in four of six comparisons

We evaluate all six ordered assignments of A, B, and C from R8, R9, and R10. Four reject $S_{A,C}\leq0$ at every reported nominal level: 0.001, 0.01, 0.05, and 0.10. These are the two configurations with R8 as the training annotator and the two with R9. The two configurations with R10 as the training annotator have negative estimated effects and do not reject.

| Training annotator A | Competitor B | External reference C | Reported self-reference result |
|---|---|---|---|
| R8 | R9 | R10 | Positive; rejects at all four reported levels |
| R8 | R10 | R9 | Positive; rejects at all four reported levels |
| R9 | R8 | R10 | Positive; rejects at all four reported levels |
| R9 | R10 | R8 | Positive; rejects at all four reported levels |
| R10 | R8 | R9 | Negative estimate; does not reject |
| R10 | R9 | R8 | Negative estimate; does not reject |

[[ASSET:part1-scalar-effects]]

**Figure caption.** Estimated self-reference effects for the six ordered Task I configurations. Positive values mean that using the training annotator as reference moves the model–human squared-loss comparison in the model's favor. Estimates and any displayed uncertainty bounds are computed over 1,500 paired images. The configurations reuse the same annotator panel and evaluation images.

These results support a self-reference effect in the four identified configurations. The R10 cases also matter: the sign can differ across fixed trios, as the decomposition predicts. The six tests are dependent comparisons, not six independent samples from an annotator population. Their rejection count should not be interpreted as the population frequency of annotation bias.

A positive $\widehat S$ alone does not show that the model was ranked above B under A and below B under C. That stronger statement requires inspecting the signs of both comparison gaps. The supplied summary does not establish how many ranking reversals occurred, so we do not report such a count.

### 3.8 Real Bernoulli Task I: completed protocol, results pending

The binary experiment repeats the self-reference analysis on each of the 27 aspects, using the same R8–R10 splits and 1,500 paired evaluation images. It reports both aspect-specific effects and an image-level mean across all 27 aspects. This asks whether the scalar result conceals differences between individual labels.

The workflow includes a validation-set temperature-scaling step, with planned BCE, Brier-score, and calibration-error diagnostics before and after scaling. Its calibration outputs are not yet documented as completed in the supplied record. Temperature scaling rescales logits to improve probability calibration [@guo2017calibration]. It does not remove annotator-specific tendencies by definition. The self-reference analysis must identify whether it uses raw or temperature-scaled probabilities; these are different fitted predictors.

[[PENDING:part1-real-bernoulli-results]]

**Draft status.** Final real-data Bernoulli Task I self-reference results are not yet available in the current experiment record. No per-aspect rejection counts, aggregate effects, or conclusions from this run are reported here.

【Agent 指令】保留上面的 status，而不是伪造正常结果段落。最终 CSV 到位后按第 8 节提供的固定模板填入。不能用 scalar Task I 或 synthetic Task II 的数值填这里。温度校准的 diagnostics 若已有可放折叠块，但不能把它们说成 Task I 假设检验结果。

### 3.9 What this part establishes

Task I separates a testable reference effect from a claim about truth. It can show that the choice of evaluator changes a model's apparent advantage. It cannot, on its own, tell us which evaluator preserves the comparison we would obtain against the latent target. That is the question for Task II.


---

## 4. PUBLIC DRAFT — Part II: Certifying a comparison with trained references

**Takeaway.** A reference can be useful without being perfect. For a particular model–human comparison, the question is whether the observed gap is large enough to withstand the reference's remaining distortion and statistical uncertainty.

### 4.1 Why use annotator-specific models as references?

An average of several annotators is a natural candidate reference. Label-aggregation methods have long used models of observer error to learn from noisy judgments [@dawid1979observer; @raykar2010crowds]. Here we use aggregation for a narrower purpose: assessing whether a comparison keeps the same direction under a specified latent target.

A practical obstacle is sparse overlap. In the independent-label portion of VinDr-CXR, an image generally has three annotations, not labels from every member of a larger panel. We therefore train an annotator-specific predictor $\widehat\mu_r$ from each reference annotator's available data and evaluate those predictors on common images. For a reference set $\mathcal R$ of size K, excluding A and B, define

$$
\widehat\mu_{\mathcal R}(x)
=\frac1K\sum_{r\in\mathcal R}\widehat\mu_r(x).
$$

This lets us construct common-image references from annotators who did not all label the evaluation images. Its immediate benefit is flexibility in forming a reference panel. We do not measure a labeling-cost reduction in these experiments. The method still needs observed B responses for the model–human comparison.

A trained reference is also an approximation. Write $\widehat\mu_r=\mu_r+h_r$ and $\bar h_{\mathcal R}=K^{-1}\sum_r h_r$. The relevant error is not simply its validation loss; it is how its error aligns with the model–human difference. One idealizing condition used below is

$$
\mathbb E[\bar h_{\mathcal R}(X)(p_A(X)-Y_B)]=0.
$$ {#eq-reference-orthogonality}

This is a substantive assumption, not a consequence of using a held-out test set. Two errors can remain aligned through their dependence on the same item even when their training data are separate.

### 4.2 Define reliability for the comparison we actually want

The latent-target gap is

$$
\Delta^*
=\mathbb E[(p_A(X)-\mu^*(X))^2-(Y_B-\mu^*(X))^2].
$$ {#eq-latent-gap}

The trained-reference gap is

$$
\Delta_{\widehat{\mathcal R}}
=\mathbb E[(p_A(X)-\widehat\mu_{\mathcal R}(X))^2
-(Y_B-\widehat\mu_{\mathcal R}(X))^2].
$$

We call the reference reliable **for this comparison** when the two population gaps have the same nonzero sign. This is not a global judgment that the reference annotators are unbiased or that their predictions are accurate for every task.

Define the comparison-specific distortion

$$
g_{\widehat{\mathcal R}}
=\mathbb E[(\widehat\mu_{\mathcal R}(X)-\mu^*(X))(p_A(X)-Y_B)].
$$

Expanding the squared losses gives the exact identity

$$
\Delta_{\widehat{\mathcal R}}-\Delta^*
=-2g_{\widehat{\mathcal R}}.
$$ {#eq-reference-distortion}

The entire effect of replacing the latent target by this reference is captured by one scalar. A sufficient condition for preserving the sign is therefore

$$
|\Delta_{\widehat{\mathcal R}}|>2|g_{\widehat{\mathcal R}}|.
$$ {#eq-population-certificate}

The left side measures the strength of the comparison. The right side measures how much the reference could move it. Small gaps need a particularly accurate reference; large gaps may survive some reference error.

【折叠内容：What the latent comparison does and does not mean】

The human competitor in @eq-latent-gap is the observed response $Y_B$, not the conditional mean $\mu_B$. Thus

$$
\Delta^*
=\mathbb E[(p_A-\mu^*)^2-(\mu_B-\mu^*)^2]
-\mathbb E[\operatorname{Var}(Y_B\mid X,B)].
$$

Human response variability is part of this estimand. For a binary aspect the variance term is $\mu_B(1-\mu_B)$. A certified negative gap therefore concerns the stated squared-loss comparison of a soft prediction with a human response. It should not be rewritten as a general claim about diagnostic skill or as a comparison between two conditional means.

Also, @eq-population-certificate is sufficient, not necessary. A reference can preserve the direction without passing this conservative inequality.

【折叠内容结束】

### 4.3 From a population condition to a data-dependent rule

On a main evaluation sample $D_1$ of size $n_1$, let

$$
d_i=(p_A(X_i)-\widehat\mu_{\mathcal R}(X_i))^2
-(Y_{B,i}-\widehat\mu_{\mathcal R}(X_i))^2.
$$

Compute $\widehat\Delta=n_1^{-1}\sum_i d_i$ and $\widehat{\mathrm{se}}(\widehat\Delta)=s_d/\sqrt{n_1}$. A lower confidence bound for the magnitude of the population gap is

$$
L_\Delta
=|\widehat\Delta|
-t_{n_1-1,1-\alpha_\Delta/2}\widehat{\mathrm{se}}(\widehat\Delta).
$$ {#eq-gap-lower-bound}

If $B_{\mathcal R}$ is an upper bound for the magnitude of reference distortion, the operational rule is

$$
\boxed{\quad L_\Delta>2B_{\mathcal R}.\quad}
$$ {#eq-general-certificate}

A negative $L_\Delta$ simply cannot pass the rule. When a certificate is issued, the sign of $\widehat\Delta$ tells us which competitor is favored. When no certificate is issued, the result is inconclusive: the gap may be too small, the reference too variable, or the bounds too conservative. Non-certification is not evidence of an incorrect reference.

### 4.4 A Gaussian working model for additive reference distortion

For each trained reference, define its full contribution

$$
\widetilde g_r
=\mathbb E[(\widehat\mu_r(X)-\mu^*(X))(p_A(X)-Y_B)].
$$

Then $g_{\widehat{\mathcal R}}=K^{-1}\sum_r\widetilde g_r$ exactly. Under the additive model, @eq-reference-orthogonality removes the average contribution of surrogate prediction errors. A Gaussian random-effects formulation additionally models the individual $\widetilde g_r$ as independent, centered effects with scale $\tau_g$.

For our bounded responses and sigmoid predictions, an exactly nondegenerate Gaussian distribution is incompatible with the bounded support of these contributions. We therefore treat it as a **working random-effects approximation** for the real-data procedure. Centering, independence, and its quality as an approximation are assumptions, not facts implied by the construction of an ensemble. The calibration below estimates a scale for the complete trained-reference contributions; average surrogate-error orthogonality alone does not establish their individual distribution.

Within the Gaussian idealization, averaging K effects yields the distortion bound

$$
B_{\mathcal R}^{\mathrm{G}}
=z_{1-\alpha_g/2}\frac{U_g}{\sqrt K},
$$ {#eq-gaussian-bound}

where $U_g$ is an upper confidence bound for $\tau_g$. The resulting procedure compares the uncertainty-adjusted evaluation gap with twice this quantity.

### 4.5 Calibrating the distortion scale without observing the latent target

The latent target appears in $\widetilde g_r$, so we cannot measure each contribution directly. Differences between reference predictions solve that particular problem. On a calibration sample $D_2$, take one reference as a baseline and compute

$$
W_{i,r}
=(\widehat\mu_r(X_i)-\widehat\mu_1(X_i))(p_A(X_i)-Y_{B,i}),
\qquad r=2,\ldots,K.
$$

Their means estimate $\widetilde g_r-\widetilde g_1$: the unknown target cancels. The variation between these contrasts informs the between-reference scale, while their item-level covariance accounts for finite calibration-sample noise. Because all contrasts share the same baseline, their covariance is not diagonal.

This is **bias-scale calibration**. It is different from the temperature scaling in Part I, which adjusts predicted probabilities using observed labels.

【折叠内容：Calibration formula and implementation】

Let $\bar W$ be the $(K-1)$-dimensional vector of calibration means and $\widehat\Omega$ the sample covariance of the item-level vectors. Write

$$
M=I_{K-1}+\mathbf1\mathbf1^\top,\qquad
\widehat V(t)=t^2M+\widehat\Omega/n_2,
$$

and

$$
Q(t)=\bar W^\top\widehat V(t)^{-1}\bar W.
$$

The matrix $M$ represents the shared reference effect in the contrasts. Where the inverse is defined, $Q(t)$ decreases as the candidate scale $t$ increases. Let $q_{\gamma,K-1}$ be the **lower** $\gamma$ quantile of a chi-square distribution with $K-1$ degrees of freedom. Define

$$
U_g=\sup\{t\geq0:Q(t)\geq q_{\gamma,K-1}\},
$$ {#eq-scale-calibration}

with endpoint zero when the set is empty. Singular covariance cases require explicit handling in the implementation; an undefined inverse is not a valid certificate.

Under the ideal Gaussian reference-effect model and appropriate item-sampling conditions, this provides asymptotic upper coverage for the scale with K fixed. The finite-sample covariance expression is an approximation when item covariance depends on the realized reference panel. The boundary $\tau_g=0$ is conservatively covered by the nonnegative endpoint; coverage need not equal exactly $1-\gamma$ there.

Even with infinitely many calibration items, a fixed number of annotators leaves uncertainty. For positive scale and fixed K, the limiting endpoint is

$$
\sqrt{
\frac{\sum_{r=1}^K(\widetilde g_r-\bar{\widetilde g})^2}
{q_{\gamma,K-1}}
}.
$$

It remains random across annotator panels. More items and more annotators address different uncertainties.

【折叠内容结束】

### 4.6 What the certificate controls

The formal argument combines three events: coverage for the main comparison, upper coverage for the distortion scale, and a tail bound for the sampled reference panel. Under the sampling and distributional assumptions, their failure probabilities give

$$
\Pr\!\left\{
\text{certificate issued and }
\Delta_{\widehat{\mathcal R}}\Delta^*\leq0
\right\}
\leq\alpha_\Delta+\alpha_g+\gamma+o(1).
$$ {#eq-false-certificate}

This is a probability over the random reference panel and evaluation/calibration samples, with the other permitted quantities fixed. On the same successful events, the reported empirical sign also agrees with the population signs. It is not a conditional error guarantee for every realized panel, nor a posterior probability that a selected certificate is correct. For the bounded real-data application, the Gaussian approximation and trained-reference assumptions further limit how literally the nominal bound can be interpreted.

The explicit $1/\sqrt K$ term explains why a larger panel can help when the effect scale remains controlled. It does not, by itself, prove a growing-K theorem for the estimated-scale procedure: the calibration argument above holds K fixed. Nor does increasing K repair systematic surrogate errors or dependence between annotators.

【折叠内容：Why the three error terms add】

On the main-sample coverage event, $L_\Delta\leq|\Delta_{\widehat{\mathcal R}}|$. If the reference does not preserve the latent sign, @eq-reference-distortion implies

$$
|\Delta_{\widehat{\mathcal R}}|\leq2|g_{\widehat{\mathcal R}}|.
$$

On the scale-coverage and reference-tail events, $|g_{\widehat{\mathcal R}}|\leq B_{\mathcal R}$. A wrong-sign reference therefore cannot satisfy $L_\Delta>2B_{\mathcal R}$ while all three events hold. A union bound gives @eq-false-certificate. This proof does not require independence between those three events. In particular, it does not condition a reference-tail probability on having passed scale calibration.

【折叠内容结束】

### 4.7 Real-data experiment: R11–R16 trained references

For this experiment we use R11–R16, a six-annotator cohort selected to improve comparability of the predominantly negative annotation data described in the workflow. This is a practical cohort choice, not proof that these six annotators are iid draws from the theoretical population or that their item distributions are identical.

Each annotator-specific model predicts the same 27-indicator average used in the scalar Task I analysis. The data construction holds out one third of unique image IDs for evaluation, using seed 42, and prepares annotator-specific training and validation sets from the remaining images. With six annotators, excluding A and B leaves at most four references. All reported results below use the corrected `task_II_alt_modified` output.

The implementation reports results at a tuning field named `prob`. The supplied workflow calls it alpha-like but does not specify how it allocates $\alpha_\Delta$, $\alpha_g$, and $\gamma$. We retain that field name in the empirical tables rather than equating it with the total error bound in @eq-false-certificate.

| Reported `prob` | Certified configurations | Configurations evaluated | Certification fraction |
|---:|---:|---:|---:|
| 0.01 | 2 | 330 | 0.61% |
| 0.05 | 10 | 330 | 3.03% |
| 0.10 | 21 | 330 | 6.36% |
| 0.20 | 60 | 330 | 18.18% |

[[ASSET:part2-continuous-by-k]]

**Figure caption.** Certification fractions by reference-panel size and the implementation's `prob` setting for the R11–R16 scalar experiment. Each cell uses the actual number of evaluated configurations at that K. Configurations reuse annotators and data. The percentages describe how often the working-model procedure issues a certificate, not measured accuracy against a known latent target.

At the most stringent reported setting, the procedure certifies 2 of 330 configurations. This rises to 60 of 330 at the most permissive setting. Most configurations remain uncertified even there. That pattern is compatible with a rule that requires a sufficiently strong comparison margin relative to reference distortion and sampling uncertainty; it does not establish that the remaining references are wrong.

The results also illustrate the difference between a certificate's nominal justification and its observed frequency. We can count how often the implemented rule passes. Without an observed latent target, these counts do not directly measure false-certification probability. The filename's `true_rate` field should therefore be read here as a certification fraction, not a truth or accuracy rate.

【Agent 指令】workflow 没给各 K 的精确分母、D1/D2 的确切规模、D2 使用方式，以及 `prob` 的预算映射。不得由 330 的组合数“反推并断言”这些设置。相关文件复制后按第 8 节机械填元数据；缺失时保留上面的保守写法。

### 4.8 What this part adds

The key object is the gap between the comparison signal and the largest distortion allowed by the procedure. Trained references make that object accessible even with sparse labeling overlap. Their usefulness still depends on how well the statistical model describes annotator variation and surrogate error. Binary outcomes raise an additional issue: centering bias before a nonlinear link need not center the resulting probabilities.

---

## 5. PUBLIC DRAFT — Part III: Binary labels and the limits of averaging

**Takeaway.** Under a logit-bias model, averaging references reduces random variation but can leave a systematic probability-scale shift. A Bernoulli certificate must allow for both effects.

### 5.1 Why the additive argument does not transfer unchanged

For one binary aspect, suppress the aspect index and write

$$
Y_r\mid X,r\sim\operatorname{Bernoulli}(\mu_r(X)),
\qquad
\mu_r(X)=\sigma(\operatorname{logit}\mu^*(X)+b_r(X)),
$$ {#eq-bernoulli-model}

where $\sigma(u)=(1+e^{-u})^{-1}$. Assume the bias is centered over annotators at each item: $\mathbb E_r b_r(x)=0$.

Because the sigmoid is nonlinear,

$$
\mathbb E_r\sigma(\operatorname{logit}\mu^*(x)+b_r(x))
\quad\text{need not equal}\quad\mu^*(x).
$$

An arbitrarily large probability-averaging panel can therefore converge to a value different from the latent target. In this model, $\operatorname{logit}\mu^*(x)$ is the population-average logit; this is a different centering convention from the additive model in Part II.

The observed loss gap, the distortion identity, and the signal bound $L_\Delta$ remain the same. What changes is the bound for reference distortion.

### 5.2 Separate average logit offsets from item-dependent variation

The reference identities, including their entire bias functions $b_r(\cdot)$, are iid draws independent of A, B, and the fit of $p_A$. The reference-panel analysis conditions on $p_A$ and B. Independent average offsets alone would not be enough: shared item-dependent bias components could still make the reference effects dependent.

Let

$$
C_r=\mathbb E_X b_r(X),\qquad C_r\overset{\mathrm{iid}}\sim N(0,\tau^2).
$$

Allow bias to vary across items, but bound its average variation by

$$
\mathbb E_r\operatorname{Var}_X(b_r(X))
\leq(\kappa-1)\tau^2,\qquad\kappa\geq1.
$$ {#eq-kappa-assumption}

Thus $\mathbb E_X\mathbb E_r b_r(X)^2\leq\kappa\tau^2$. The parameter $\tau$ measures between-annotator average logit offsets; $\kappa$ limits additional item-dependent variation. The Gaussian law is now imposed on unbounded logit offsets, not on bounded probability-scale distortion terms.

For trained references, write $\widehat\mu_r=\mu_r+h_r$ on the **probability scale**. Under the error moment in @eq-reference-orthogonality, the aggregate surrogate-error contribution vanishes, and the relevant reference effects are

$$
g_r=\mathbb E_X[(\mu_r(X)-\mu^*(X))(p_A(X)-\mu_B(X))],
\qquad
g_{\widehat{\mathcal R}}=\frac1K\sum_r g_r.
$$

The logit model alone does not establish the surrogate-error assumption. A low prediction loss is useful evidence about a model but is not a proof of that particular moment condition.

### 5.3 The Bernoulli distortion bound

Let $U_\tau$ be an upper confidence bound for $\tau$ and put $\ell=\log(2/\alpha_g)$. The bound used here is

$$
\begin{aligned}
B_{\mathcal R}^{\mathrm{Bern}}
=\min\Bigg\{1,\;&
\frac{\sqrt3}{36}\kappa U_\tau^2\\
&+\sqrt{\frac{\min\{\kappa U_\tau^2,4\}\,\ell}{8K}}
+\frac{\ell}{3K}\Bigg\}.
\end{aligned}
$$ {#eq-bernoulli-bound}

The rule remains $L_\Delta>2B_{\mathcal R}^{\mathrm{Bern}}$.

Each term has a distinct role. The first allows for the average shift caused by sigmoid curvature. The square-root term allows for random variation across a finite panel. The final term is the additional bounded-tail correction. The outer minimum uses the trivial bound $|g_{\widehat{\mathcal R}}|\leq1$.

Increasing K reduces the two finite-panel terms. It does not eliminate the curvature term. This is why “use more annotators” is incomplete advice under the logit formulation. The rule can also be conservative: it must accommodate variation and nonlinear distortion without directly observing the target.

【折叠内容：Where the constants come from】

The logistic function satisfies

$$
\sup_u|\sigma'(u)|=\frac14,
\qquad
\sup_u|\sigma''(u)|=\frac{\sqrt3}{18}.
$$

A second-order expansion, together with pointwise centering of $b_r$, bounds the mean reference effect:

$$
|\mathbb E_r g_r|\leq\frac{\sqrt3}{36}\kappa\tau^2.
$$

The Lipschitz bound and Jensen's inequality give

$$
\operatorname{Var}_r(g_r)
\leq\min\left\{\frac{\kappa\tau^2}{16},\frac14\right\}.
$$

The second bound uses the fact that the support of $g_r$ has diameter at most one. Consequently $|g_r-\mathbb E_rg_r|\leq1$. A bounded-summand Bernstein/sub-gamma bound controls the deviation of the K-reference average by

$$
\sqrt{\frac{\min\{\kappa\tau^2,4\}\ell}{8K}}
+\frac{\ell}{3K}
$$

with failure probability at most $\alpha_g$. On the separate event $\tau\leq U_\tau$, every term is bounded by the corresponding expression in @eq-bernoulli-bound. Combining those events with the main comparison coverage gives the same marginal false-certification statement as @eq-false-certificate, under the Bernoulli assumptions.

This argument uses an intersection of events and a union bound. It does not assert that the reference-tail event has unchanged probability conditional on the scale estimate passing its own check.

【折叠内容结束】

### 5.4 Calibrating a logit-bias scale

Under @eq-bernoulli-model, the latent logit cancels in a pairwise difference:

$$
\operatorname{logit}\mu_r(X)-\operatorname{logit}\mu_1(X)
=b_r(X)-b_1(X).
$$

Averaging over items targets $C_r-C_1$. On $D_2$, we therefore use signed differences of the trained reference logits,

$$
W_{i,r}=\operatorname{logit}\widehat\mu_r(X_i)
-\operatorname{logit}\widehat\mu_1(X_i),
\qquad r=2,\ldots,K.
$$

The same covariance structure $I+\mathbf1\mathbf1^\top$ and chi-square inversion in @eq-scale-calibration produce $U_\tau$. Unlike continuous weighted calibration, these contrasts are not multiplied by $p_A-Y_B$. Unlike temperature scaling, this step does not fit a scalar temperature to label prediction loss.

The calibration needs accurate out-of-sample logit contrasts. Predictions must lie strictly between zero and one; the item covariance must be estimable; and the signed mean first-stage logit-contrast error must be negligible at the calibration uncertainty scale, or its uncertainty must be accounted for. Probability-scale accuracy alone does not guarantee this near probabilities zero or one. Clipping probabilities also changes the contrasts and must be handled consistently with the calibration assumptions.

These are conditions of the statistical argument, not properties established merely by training a Bernoulli network.

【折叠内容：Numerical inversion】

With $\widehat\Omega/n_2$ as the contrast noise matrix and $M=I+\mathbf1\mathbf1^\top$, a generalized eigendecomposition yields eigenvectors $v_j$ and eigenvalues $\lambda_j$, normalized so that $v_j^\top Mv_k=\mathbf1\{j=k\}$. Let $a_j=v_j^\top\bar W$. Then

$$
Q(t)=\sum_j\frac{a_j^2}{\lambda_j+t^2}.
$$

The workflow solves a scalar monotone equation in $u=t^2$ at the lower chi-square quantile and sets $U_\tau=\sqrt u$. The scale is nonnegative; boundary and singular cases must follow explicit solver logic. This computational reduction does not replace the assumptions needed to interpret the resulting endpoint as an upper confidence bound.

【折叠内容结束】

### 5.5 Why a controlled binary experiment is useful

The real-data cohorts provide few reference annotators, and many clinical aspects are rare. Those conditions can leave little information for a conservative binary procedure. To inspect its behavior with larger panels and balanced synthetic outcomes, we keep the real image embeddings but generate artificial annotator responses.

This is a **semi-synthetic experiment**: the feature geometry comes from real images, while the latent probabilities, annotator effects, and binary labels are generated. The 27 output aspects are artificial. Even though storage columns reuse clinical label names, the synthetic outcomes should be read as Aspect 1 through Aspect 27, not as simulated clinical diagnoses.

The experiment uses 5,438 image embeddings and 34 synthetic annotators, R01–R34. Two identities serve as A and B, leaving up to 32 reference annotators. The image split contains 2,887 training items, 738 validation/calibration items ($D_2$), and 1,813 main evaluation items ($D_1$). The master random seed is 42. Each annotator has a separately trained 27-output BCE predictor.

### 5.6 The generator: controlled bias with nonlinear item effects

We obtain ten standardized principal-component coordinates $z(x)$ from the full fixed pool of embeddings. For each aspect, a normalized random linear direction gives a score $s_h(x)$. The latent and annotator probabilities are

$$
\mu_h^*(x)=\sigma(a_h+s_h(x)),
$$

$$
\mu_{r,h}(x)
=\sigma(a_h+s_h(x)+C_{r,h}
+f_{r,h}(x)-\mathbb E_X f_{r,h}(X)).
$$ {#eq-synthetic-generator}

The centered random network $f_{r,h}$ gives item-dependent variation. The independent offset $C_{r,h}\sim N(0,0.1^2)$ controls average logit bias. Network parameters are sampled once per annotator and aspect and then held fixed across images; an annotator therefore has a stable response function rather than fresh bias noise on every item.

For each aspect, $a_h$ is chosen so that the **annotator-population mean positive rate**, averaged over the fixed image pool, is 0.5. This does not force each annotator, each item, or every finite label sample to have a positive rate of 0.5. It also does not define the latent target's prevalence to be exactly 0.5.

For this generator, $\tau=0.1$ and $\kappa=2$ is a valid analytic population upper bound. The procedure uses this generator-derived $\kappa$ while estimating the scale through logit contrasts. We do not replace the population bound with a favorable finite-panel estimate.

【折叠内容：Exact generator settings and diagnostics】

The supplied generation note and workflow specify the following settings:

| Component | Setting |
|---|---|
| Feature pool | 5,438 real 1,376-dimensional image embeddings |
| PCA features | 10 coordinates; full-pool standardization with population variance convention (`ddof=0`) |
| Aspect direction | Gaussian vector in 10 dimensions, normalized to unit length |
| Random network | $f_{r,h}(z)=W_{2,rh}\tanh(W_{1,rh}z+b_{1,rh})$ |
| Hidden width | 32 |
| First-layer weights | Independent $N(0,1/10)$ entries; second parameter is variance |
| Hidden biases | Independent $N(0,1)$ entries |
| Output weights | Independent $N(0,0.1^2/32)$ entries |
| Average offsets | Independent $C_{r,h}\sim N(0,0.1^2)$ |
| Item-centering | Subtract the mean of $f_{r,h}$ over the full pool |
| Labels | Conditionally independent Bernoulli draws given the generated probabilities |
| Panel and seed | 34 annotators, 27 aspects, master seed 42 |

Independent, mean-zero output weights and bounded hidden activations give $\mathbb E_r f_{r,h}(x)=0$ and $\mathbb E_r\operatorname{Var}_X f_{r,h}(X)\leq\tau^2$. Centering over items makes $\mathbb E_X b_{r,h}(X)=C_{r,h}$ exactly. Hence

$$
\mathbb E_r\mathbb E_X b_{r,h}(X)^2
=\mathbb E_r C_{r,h}^2
+\mathbb E_r\operatorname{Var}_X f_{r,h}(X)
\leq2\tau^2,
$$

which justifies $\kappa=2$.

The recorded maximum error in solving the population positive-rate constraint is $4.32\times10^{-6}$. The finite-panel expected positive rate is 0.500315 and the realized label rate is 0.500210. The recorded mean latent probability is 0.499999; this is a diagnostic outcome, not the quantity constrained by the intercept equation. Empirical finite-panel bias ratios range from 1.2387 to 1.3108, with mean 1.2730; these diagnostics do not replace the analytic population bound.

The distribution of X used for generator centering and oracle moments is uniform over the full fixed pool. PCA is also fitted on that pool. This is a fixed-pool simulation, not an evaluation of an inductively learned feature transformation on unseen images. The inherited disjoint $D_1$ and $D_2$ subsets are an experimental analogue of the item-sampling theory; they do not by themselves establish its iid assumptions.

【折叠内容结束】

### 5.7 Results: larger reference panels cross the certification threshold

For each reported setting and K in $\{8,16,32\}$, the workflow samples 120 model–human–reference configurations and applies the rule separately to 27 aspects. These configurations reuse the same generated annotator panel, trained models, and image pool. They are not 120 independently regenerated datasets.

There are two useful but different summaries:

- **Any-aspect certification fraction:** the fraction of the 120 configurations with at least one certified aspect.
- **Aspect–configuration certification fraction:** the fraction of the $120\times27=3,240$ aspect-specific comparisons that are certified.

As in Part II, `prob` is the reported implementation setting; its mapping to the three theoretical error terms must be read from the run metadata or code before assigning it a total-error interpretation.

| `prob` | K | Configurations with ≥1 certified aspect | Certified aspect–configuration pairs | Mean certification margin |
|---:|---:|---:|---:|---:|
| 0.05 | 8 | 0% | 0% | −0.4852 |
| 0.05 | 16 | 0% | 0% | −0.1538 |
| 0.05 | 32 | 100% | 63.21% | +0.0040 |
| 0.10 | 8 | 0% | 0% | −0.3749 |
| 0.10 | 16 | 0% | 0% | −0.1033 |
| 0.10 | 32 | 100% | 100% | +0.0297 |
| 0.20 | 8 | 0% | 0% | −0.2700 |
| 0.20 | 16 | 7.5% | 0.31% | −0.0533 |
| 0.20 | 32 | 100% | 100% | +0.0558 |

[[ASSET:part3-certification-by-k]]

**Figure caption.** Bernoulli Task II certification frequencies in the semi-synthetic experiment. The main panel reports the percentage of 3,240 aspect–configuration pairs certified at each K and `prob`. A separate panel, if shown, reports the percentage of 120 configurations with at least one certified aspect. The experiment uses one generated panel and one fixed image pool. These are descriptive frequencies of the rule's output, not estimates of oracle correctness or simultaneous coverage.

The clearest change occurs at K=32. At `prob`=0.05, every configuration has at least one certified aspect, but only 63.21% of all aspect–configuration comparisons are certified. Thus the two “success” summaries give different information. At `prob`=0.10 and 0.20, all evaluated aspect–configuration pairs are certified for K=32. With K=8, none is certified at any reported setting. K=16 gives only limited certification at the most permissive setting.

The reported mean margins move toward zero as K increases and become positive at K=32. This is consistent with a reduction of finite-panel correction terms. A positive mean margin is not a statement that every individual margin is positive: at K=32 and `prob`=0.05, the mean is slightly positive while a substantial fraction of aspect-level comparisons remain uncertified.

The any-aspect summary is a union across 27 tests. It does not inherit the single-aspect error bound without a multiple-testing adjustment. Similarly, increasing a permissive tuning setting can raise the certification frequency without improving the underlying reference models.

### 5.8 What the synthetic experiment does—and does not—validate

The construction controls the latent probabilities, the average logit-bias distribution, and a population bound on item-dependent bias variation. This makes it possible to study how the implemented rule behaves when substantially more annotators are available.

The reported results show a strong change in certification frequency with panel size under these settings. They do not, by themselves, estimate the probability of an incorrect certificate. Although the generator makes oracle quantities available in principle, the supplied result summary does not report oracle sign agreement, false-certification rates, or coverage. We therefore do not claim that those properties have been empirically verified.

Nor does a controlled label generator guarantee that trained surrogates satisfy the required error moment or logit-contrast accuracy. The use of the validation split for calibration also needs to be interpreted together with any checkpoint-selection or probability-calibration steps that used that split. Those first-stage conditions remain distinct from the generator's known $\tau$ and $\kappa$.

【Agent 指令】这一段保留为短的 interpretation/limitations，不要把生成机制满足 bias assumptions 改成“整个实现已经完全满足定理”。本任务不要求你新增 oracle 实验或重新切分数据。

---

## 6. PUBLIC DRAFT — Conclusion

A model–human comparison is also a comparison of how the model and human relate to an evaluation reference. When the model learns one annotator's systematic tendencies, using that annotator as the reference can change its apparent advantage. Task I makes that shift measurable. In the real scalar experiment, four of six configurations show a significant positive self-reference effect, while the two configurations trained on R10 have negative estimated effects. The real-data Bernoulli Task I analysis remains pending.

Task II asks a different question: can the reference preserve the direction of the comparison against a specified latent target? The central idea is to compare a lower bound on the strength of the observed gap with an upper bound on reference distortion. Trained annotator models make this approach usable with sparse labeling overlap, while introducing assumptions about their own errors. The continuous procedure is a Gaussian working-model analysis; its observed certification frequency should be read in that light.

Binary labels reveal why averaging alone is not enough. Centering annotator biases on the logit scale need not center their probabilities. Larger panels reduce random fluctuations, but a curvature-related component remains in the bound. The semi-synthetic results show how additional references can nevertheless make the certification rule substantially less restrictive in the evaluated settings.

The practical lesson is to specify the reference, the comparison target, and the uncertainty together. A detected self-reference effect is not a verdict about which annotator is correct. A certificate is a comparison-specific conclusion under explicit assumptions. Keeping those distinctions visible makes claims about model–human performance easier to interpret and harder to overstate.

【Agent 指令】Conclusion 与 Introduction 一样放在 tabset 外。未来真实 Bernoulli Task I 完成后，只按已导入结果更新第一段的一句 status；不能自动升级最后三段的理论或临床结论。


---

## 7. 图表执行规范（不进入正文）

### 7.1 总原则

正文以现成数值和上面的解释为准。图的任务是让比较更直观，不承担额外分析。已有汇总 CSV 可以重绘；不要为了“好看”平滑、插值、补点、添加未计算过的误差棒，或筛选最显著的配置。

主色建议深蓝 `#315c85`，次色赭色 `#b46c3c`，其余灰色；不要为每个 annotator 分配醒目随机颜色。所有图统一轴字体、线宽和数值格式。效应值用有正负的连续轴；认证比例用 0–100%。两类图不共用色标。

优先 SVG，必要时高分辨率 PNG。服务器 PDF 可作为下载文件，不能直接代替 HTML 中的图片。图宽约 760–800px；小屏允许图本身横向滚动或打开原图，不应导致整个页面水平滚动。

### 7.2 每个占位符的精确要求

| ID / 占位符 | 放置位置与图形 | 数据要求 | 图中必须说明 |
|---|---|---|---|
| `tbl-illustrative-reference` | Introduction worked example 表 | 本稿已给精确数值 | Illustrative；非真实实验 |
| `fig-task1-scalar` / `[[ASSET:part1-scalar-effects]]` | Part I scalar 结果段后；6 行横向点图，零线，按 A 分组 | 从 Task I summary 读 A/B/C、S estimate；仅在文件已有时加入明确定义的区间 | S>0 的含义；n=1,500 images；具体区间/nominal level；不要把 one-sided bound 画成凭空的 two-sided CI |
| `fig-task1-binary` / pending block | Part I Bernoulli；完成后 27 aspects × 6 triples 的热图；aggregate 单独一行/单独小表 | final summary，概率版本，名义阈值，估计值和 decision；识别 `ALL_27_mean_over_aspects` | aspectwise 与 aggregate 分开；raw/temp；未校正的 nominal tests 若是现状 |
| `fig-task2-scalar` / `[[ASSET:part2-continuous-by-k]]` | Part II；K × `prob` 的认证比例热图 | `task2_alt_modified_true_rate_by_k_prob.csv`；每格分子分母 | Certification fraction；K 由数据读取；总数330并不等于每格330 |
| `fig-task2-binary` / `[[ASSET:part3-certification-by-k]]` | Part III；主图为 aspect–configuration fraction vs K，三条设置曲线；可另列 any-aspect 小面板 | 三个 K8/16/32 run 的 by-K summary；本稿表可作初始精确绘图数据 | 主图分母3,240；any面板分母120；设置是reported `prob`；没有独立重复seed的误差棒 |
| `fig-task2-binary-aspects`（补充） | Part III 折叠详情；每个 setting 一个27-aspect热图 | 对应 by-K-aspect CSV | 每个 aspect×K cell 分母120；人工 aspects命名1–27；不能装成医学诊断 |
| `fig-task2-binary-margin`（可选） | 紧跟结果解释，或折叠 | 已有 mean margin 列，确认其聚合定义 | 零线；mean不是每个comparison的判定；不要作独立trial置信区间 |

表格已经完整时，不必重复画所有维度。建议默认展开：Introduction 的示例表；Part I 的 scalar 点图；Part II 的 heatmap +简短总表；Part III 的主曲线/点图+必要的数字表。真实 Bernoulli 完成后再加入其主图。

### 7.3 缺文件时的渲染

1. 已知数字的表格照常显示；没有精确点估计时不要以正负号代替数值坐标来“画图”。
2. `ASSET` 缺失用一个小的中性占位块，写 “Figure awaiting imported result file.” 并在本地工作记录中列路径。不显示破图图标。
3. `PENDING` 使用正文给出的 “Results pending” 状态。不要自动写“expected to confirm…”等预测。
4. 结果导入后，复制本稿 caption；只补充真实的 nominal level、概率版本、数据规模等机械元数据。
5. 没有逐图作者诊断时，不新增 chest X-ray case。Intro 已有解释性 case；它与真实数据统计结果严格区分。

---

## 8. 服务器文件、导入步骤与缺口处理

### 8.1 路径约定

服务器根目录为：

```text
/projects/bgzf/xzhang65/annotation_bias/
```

下表“服务器相对路径”均相对于这个根。作者自行从服务器复制；本地排版 agent 不需要服务器账号，也不需要重跑训练。博客目录中的 `data/` 只收录用于展示的必要汇总，不要求复制 embeddings、原始影像或全部 checkpoints。

| 用途 | 服务器相对路径 | 建议博客本地路径 |
|---|---|---|
| Scalar Task I summary | `HT/v1_cts_avg_trained_ref/outputs/task_I/task1_self_reference_summary.csv` | `data/task1-scalar/summary.csv` |
| Real binary Task I final summary（未完成） | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/task1_bernoulli_self_reference_summary.csv` | `data/task1-bernoulli/summary.csv` |
| Binary温度参数（预期输出，待完成） | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration.json` | `data/task1-bernoulli/temperature.json` |
| Binary calibration总表（预期输出，待完成） | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration_summary.csv` | `data/task1-bernoulli/calibration-summary.csv` |
| Binary calibration分aspect表（预期输出，待完成） | `HT/v1_bernoulli_task1_bce/outputs/task_I_bernoulli/calibration/task1_bernoulli_temperature_calibration_per_aspect.csv` | `data/task1-bernoulli/calibration-aspects.csv` |
| Continuous Task II配置总表 | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_exhaustive_summary.csv` | `data/task2-scalar/configurations.csv` |
| Continuous Task II按K/setting总表 | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_true_rate_by_k_prob.csv` | `data/task2-scalar/by-k-prob.csv` |
| Continuous Task II metadata | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_meta.json` | `data/task2-scalar/meta.json` |
| Continuous Task II现成图（检查标签后用） | `HT/v1_cts_avg_trained_ref/outputs/task_II_alt_modified/task2_alt_modified_true_rate_by_k_prob_heatmap.png` | `figures/task2-scalar-source.png` |
| Synthetic生成metadata | `HT/synthetic_bernoulli_task2/outputs/default_seed42/meta.json` | `data/task2-bernoulli/generation-meta.json` |
| Synthetic生成config | `HT/synthetic_bernoulli_task2/configs/default_semi_synthetic.json` | `data/task2-bernoulli/generation-config.json` |

若实际输出里的 calibration per-aspect 文件名略有区别，以目录中真实文件和 workflow 为准并记录映射，不因为缺一张诊断表阻塞主稿。

**Synthetic 三个主结果目录：**

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha005/
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha010/
HT/synthetic_bernoulli_task2/outputs/default_seed42/task2_bernoulli_sept_K8_16_32_random120_alpha020/
```

每个目录复制以下五个文件，放到本地 `data/task2-bernoulli/alpha005/`、`alpha010/`、`alpha020/`，保留源文件名：

```text
task2_sept_rejection_summary_by_k.csv
task2_sept_rejection_summary_by_k_aspect.csv
task2_sept_combo_aspect_results.csv
task2_sept_combinations.csv
task2_sept_meta.json
```

**默认不拿来替代主结果的较新图：**

```text
HT/synthetic_bernoulli_task2/outputs/default_seed42/final_visualizations/
  task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.png
  task2_per_aspect_rejection_heatmap_BIGFONT_K16_K24_K32_random120_probs.pdf
  task2_per_aspect_rejection_summary_K16_K24_K32_random120_probs.csv
```

这些文件可以另行复制检查，但当前稿的主结果用 K8/16/32。要改为 K16/24/32，必须同时核实伴随 CSV、对应 metadata，并更新表、图、caption 和全部解释。不要让排版 agent 默默完成这项科学内容变更。

### 8.2 只在需要追溯时复制的实现文件

| 流程 | 可核对文件 / 位置 | 用途 |
|---|---|---|
| Scalar Task I | `HT/v1_cts_avg_trained_ref/task1_self_reference_test.py`；同目录 `train.py`、`model.py`；另在 `HT/v1_cts_avg_trained_ref/taskI_processed_data/build_cts_avg_data.py` | 统计量字段、训练配置、scalar构建 |
| Continuous Task II | `task_II_alt_modified` 的 metadata；若不足，再从同项目取实际运行脚本 | `prob`分配、D1/D2、K列表。workflow未给脚本的明确文件名，不发明名字 |
| Binary Task I | `HT/v1_bernoulli_task1_bce/task1_bernoulli_self_reference_test.py`、`calibrate_task1_bernoulli.py`、`train_task1_bernoulli_bce.py`、`model.py` | raw/temp开关、aggregate单位、输出字段、最终运行状态 |
| Synthetic Task II | `HT/synthetic_bernoulli_task2/run_task2_bernoulli_sept.py`、`train_synthetic_bernoulli.py` | error budgets、margin定义、calibration、checkpoint selection |

Checkpoints 的存在不能代替结果：scalar 的 `cts_avg_R8/R9/R10.pth`；另组 `cts_avg_alt_R11…R16.pth`；binary 的 `task1_bernoulli_bce_R8/R9/R10.pth`；synthetic 的34个checkpoint，各自只证明有可加载模型。网站默认不加载这些大文件。

### 8.3 导入 agent 可以做什么

1. 读取 CSV 实际 header，按语义识别 A/B/C、K、aspect、estimate、standard error、decision、setting、margin。**本文没有假设所有 CSV 的 header 名字。**
2. 记录源路径 → 本地路径和字段映射；检查每个 grouping 的行数及分母。
3. 从已有 decisions 做计数、从已有 summary 重绘、格式化小数。对 rounded percent 不反推并宣称精确计数。
4. 如果文件与本稿已知数值不一致，报告差异并保留源文件，不自动选一个较好看的版本。
5. 不自行改变误差预算、补做多重检验、重新拟合温度、重算标准误或创建额外实验。那属于分析变更，超出排版交接。
6. 可从已提供 metadata / code 读取配置并补入下方固定句式；这属于忠实转录。无法确认时保留已有保守表述和内部缺口记录。

### 8.4 `prob` 和数据划分缺口

内部 tracking tokens：

```text
[[VERIFY:continuous-prob-error-budget-mapping]]
[[VERIFY:synthetic-prob-error-budget-mapping]]
[[VERIFY:continuous-task2-d1-d2-and-k-grid]]
[[VERIFY:synthetic-checkpoint-selection-vs-d2]]
[[VERIFY:synthetic-margin-aggregation]]
```

不要在主文凭空把 `prob=.05` 写成 “95% confidence”。理论总误差界是 $\alpha_\Delta+\alpha_g+\gamma+o(1)$。例如，**如果**实现把三个量都设为 p，则总界是 $3p+o(1)$；**如果**每个都设为 p/3，则是 $p+o(1)$。两种仅用于解释，当前不能假定哪一种被采用。

元数据确认后，使用这段固定英文补充：

> In this run, the configuration field `prob` is mapped to the theoretical terms as follows: $\alpha_\Delta=$ [recorded expression], $\alpha_g=$ [recorded expression], and $\gamma=$ [recorded expression]. The nominal sum is therefore [recorded sum], subject to the assumptions of the corresponding procedure. The plotted fractions are descriptive certificate frequencies.

Continuous 数据划分确认后：

> The main statistic uses [recorded n1] images in $D_1$, and scale calibration uses [recorded n2] images in $D_2$. These sets are constructed by [literal split rule]. The evaluated reference sizes are [actual K values], with [actual configuration counts] configurations at each size.

Synthetic checkpoint 与 D2 的关系只记录事实。若 D2 labels 曾用于选择checkpoint或温度，不写“完全独立于所有训练决策”；保留正文对first-stage条件的限定。不要为了把理论说得更完整而自行设计新split。

### 8.5 待完成的 Bernoulli Task I：精确填充模板

最终文件到了以后，主文必须说明概率版本。默认脚本 raw，不等于最终运行一定 raw。若两种都运行，原始概率作为主分析仅在原运行计划如此规定时采用；校准版本另列敏感性分析，不挑选更显著的一种。

可机械填充的英文模板如下。方括号都必须来自最终结果或记录；没有就留pending：

> The completed Bernoulli Task I analysis uses [raw / temperature-scaled] probabilities on the same 1,500 paired evaluation images. At the reported nominal level [alpha], [count] of the six `ALL_27_mean_over_aspects` tests reject the one-sided null of a nonpositive self-reference effect. The aggregate estimates are [six values, with their A/B/C identities]. Among the [number of valid aspect-specific tests] aspect-specific tests, [count] reject at that level. [Number] tests are undefined or omitted under the implementation's variance or data-validity rule. These are [unadjusted nominal decisions / decisions under the explicitly recorded correction].
>
> The aggregate and aspect-specific analyses answer different questions: the first averages within each image before computing uncertainty, while the second retains label-level heterogeneity. Neither rejection count establishes a reversal of the model–human ranking or a globally correct evaluation reference.

固定 caption：

> Self-reference effects for 27 binary aspects and six ordered annotator configurations, using [probability version]. The separate aggregate panel uses the mean of 27 contributions within each image. Inference is over 1,500 paired images. [State the actual threshold and multiplicity convention.] Missing or undefined tests are shown separately from non-rejections.

如果结果与scalar不同，显示这个事实即可，不自动生成原因。不得编造“稀有病导致不显著”“温度校准消除了偏差”等未经分析的因果解释。Conclusion 第一段的pending句可替换为第一句和aggregate拒绝数，不改变文章其他结论。

### 8.6 不属于当前缺口的项目

当前无需为了完成初稿新增如下分析：oracle coverage、跨seed重复实验、不同κ敏感性、交叉拟合、患者级重划分、新的临床case。它们可作为以后研究方向，但不能写成已经完成的实验，也不能让排版agent以为它必须完成这些才能生成本地preview。

---

## 9. Quarto presentation：给本地 agent 的具体指令

### 9.1 采用一个 HTML 输出、三个源文件

推荐在现有博客项目内建立以下文件，不新建另一个网站框架：

```text
posts/annotation-bias/index.qmd
posts/annotation-bias/_part-1-self-reference.qmd
posts/annotation-bias/_part-2-continuous.qmd
posts/annotation-bias/_part-3-bernoulli.qmd
posts/annotation-bias/references.bib
posts/annotation-bias/annotation-bias.css
posts/annotation-bias/article-tabs.js       # 仅原生行为不足时使用
posts/annotation-bias/figures/
posts/annotation-bias/data/
```

`index.qmd` 放标题、Summary、Introduction、tabset、Conclusion和统一References。三个下划线开头的include文件分别放三个Part。下划线命名用于避免它们被当作独立文章输出；同时检查现有项目的render配置。

三个include文件不写YAML metadata。资源路径按主 `index.qmd` 的位置解析；这里统一使用 `figures/...` 和 `data/...`。保留Bootstrap主题，不设置 `theme: none`，以免破坏原生tabset和折叠callout的依赖。

Quarto native tabset 解决“选哪部分就只看哪部分”的主体行为。CSS控制外观；跨tab定位、历史记录等行为必要时才用少量JavaScript。**不能通过给CSS一句自然语言指令就让它负责所有导航逻辑。** 本文不要求Vue/React，也不要求三个独立URL页面。

### 9.2 最小骨架（在作者本地生成，不在本交付阶段build）

根据现有 `_quarto.yml` 合并metadata，不覆盖整站配置。下面是结构示例：

``````qmd
---
title: "Who Judges the Model?"
subtitle: "Annotation bias, self-reference, and reliable model–human comparisons"
bibliography: references.bib
format:
  html:
    toc: false
    number-sections: false
    html-math-method: mathjax
    css: annotation-bias.css
---

::: {.article-summary}
[Copy the supplied Summary.]
:::

## Introduction {#introduction}

[Copy Section 2 Introduction, without Chinese agent instructions.]

::::: {.panel-tabset #research-parts}

## I · Self-reference {#part-1}

{{< include _part-1-self-reference.qmd >}}

## II · Continuous {#part-2}

{{< include _part-2-continuous.qmd >}}

## III · Bernoulli {#part-3}

{{< include _part-3-bernoulli.qmd >}}

:::::

## Conclusion {#conclusion}

[Copy Section 6 public prose.]

## References {.unnumbered}

::: {#refs}
:::
``````

把include中的正文小节变为 `###`，不要把交接文件的编号 `3.1/4.1/5.1` 原样全部显示。保留简短有意义的小节名。不要创建第三层、第四层的密集编号。Part标题已经承担大结构的标识。

公式/图/表使用Quarto原生crossref。保留本稿的 `eq-` IDs；图表按第7节命名。正文中“Part I/II/III”可链接对应panel。全局编号可能因隐藏的Part而跳跃，这是合理的；不要给每个tab重复同一组ID。

折叠块示例：

````qmd
::: {.callout-note collapse="true" title="Why the identity holds"}
[Copy the complete corresponding English detail block.]
:::
````

要点、核心假设、结果和结论不能全被放进折叠块；折叠的是推导与复现细节。不是每个段落都做card。

### 9.3 视觉规格：参考研究blog的克制排版

借鉴腾讯ELR页面的窄阅读列、留白、图文相邻和技术细节展开方式；不直接复制其HTML、品牌素材或不相关的组件。这里采用作者偏好的serif正文和约32px居中标题。

| 元素 | 明确设置 |
|---|---|
| 背景 | 纯白；不做整页渐变、纹理或大面积彩色卡片 |
| 阅读列 | 桌面约800px；手机左右20–24px留白；可用Quarto grid配置调整正文列 |
| 正文 | `Georgia, "Times New Roman", serif`；16px；line-height约1.65；优先系统字体 |
| 主标题 | 居中；桌面32px，手机27–29px；weight600–700；line-height约1.2 |
| 副标题 | 居中；18px左右；柔和灰色；不挤在标题下 |
| 元数据 | 作者提供后再填；13–14px灰色；不编造affiliation、日期或reading time |
| 小节标题 | 左对齐；清晰字号阶梯；不要全部大写 |
| Summary | 浅灰背景 `#f6f7f8`；细边或无边；8px圆角；16–20px padding；无重阴影 |
| 页签 | 三个等重要选项；active用深蓝下划线/细边和较深文字；inactive浅灰；不做三个巨大卡片 |
| 链接 | 深蓝；hover/focus有下划线；键盘focus可见 |
| 表格 | 轻水平线；数值右对齐；长表在自身容器横向滚动；单位放header |
| 图 | 中心对齐；通常占正文宽度；图注13–14px；不要整段长caption都斜体 |
| 证明 | 默认闭合；浅灰标题条；展开后正文仍16px；不做难读的小字 |
| 数学 | 标准MathJax；长式先换行align；必要时公式容器可横滚，页面不可横滚 |
| 间距 | 段距约0.8–1em；小节前2–2.5em；避免一屏只有一句话的大留白 |

CSS可以使用以下design tokens；它们是起点，不是宣称已在目标Quarto版本验证的完整主题：

```css
:root {
  --article-ink: #25282b;
  --article-muted: #626970;
  --article-accent: #315c85;
  --article-line: #dfe3e6;
  --article-panel: #f6f7f8;
  --article-radius: 8px;
}
```

`annotation-bias.css`仅挂到这篇文章。调整Quarto正文列，**不要对全站body强行设置max-width:800px**，否则可能破坏导航和布局。字体与标题样式可以在本篇的CSS内设定，但不要修改其他文章的global CSS，除非已有全站样式本来需要统一。

### 9.4 页签与导航行为合同

1. 首次无hash进入默认Part I。Introduction和Conclusion始终在tabset外；切换不会消失。它们不sticky。
2. 三个选项要一眼可见。手机可紧凑换行或纵向三个按钮，不放进看不见选项的下拉菜单。
3. 初版关闭自动全局TOC，避免列出所有隐藏Part的几十个小节。每个Part顶部放本Part的简短锚点导航：Setup / Main result / Experiment / Interpretation。标签可按实际小节调整。
4. 可选右侧TOC若做，必须只显示当前Part和公共Introduction/Conclusion。这是需要同步的行为，不是仅 `toc: true` 即完成。
5. 为每个Part、核心公式、图表设置稳定ID。打开指向隐藏Part内图或公式的URL，必须先激活该Part再定位。若目标在折叠证明内，展开对应块后定位。
6. 先测试目标Quarto版本的原生行为；缺什么补什么。不要重复注册多个hash监听器。必须测试初次加载、refresh、跨Part链接、Back和Forward。
7. 点击主selector切换时，阅读位置应停在selector或新Part开头；不要突然回到文章最上面，也不要落在新Part的半截。精确crossref则滚动到目标。
8. selector可以滚动到顶后成为瘦小sticky条，但不是必需。若做，设置scroll offset，避免挡住标题和公式。
9. 不依赖CSS去模拟点击逻辑；需要时用现有Bootstrap/Quarto tab API，在结构上保留原生语义和keyboard支持。
10. Quarto网站搜索对隐藏tab已有一定支持，但仍要测试当前版本的搜索结果是否能正确显示目标；不能凭假设删除搜索或断言它永远不能进入tab。

### 9.5 打印与长文可访问性

浏览器Print必须包含三个Part，按I→II→III的顺序；不能只打印当前选中的Part。优先实现并检查print CSS：显示所有tab panels、隐藏selector、展开折叠内容并避免截断。若原生markup使这件事不可靠，再用同一组include生成线性print view；不要复制一份以后会分叉的正文。

直接URL、键盘切换、可见focus、图alt text以及手机长公式都属于本地验收。动画最少化；尊重reduced-motion。不要为了视觉效果延迟正文出现。

### 9.6 本地编译与交付标准

由作者的本地agent执行现有项目支持的 `quarto preview` / `quarto render`。本次交付只提供文稿与指令，没有在这里创建或部署网站。

完成排版后需要报告：实际创建/修改的文件；已导入的结果；仍pending/缺asset的条目；本地preview命令。确认以下事项即可，不必替低影响排版另写一套单元测试：

- 三个Part切换正常，Introduction/Conclusion保留；手机和桌面均可读。
- 所有数学在初始隐藏的Part里也正常渲染；crossrefs、bibliography无未解析标记。
- Proof展开正常，链接能到隐藏Part或折叠块中的目标。
- 图中K、prob、aspect含义、分母与CSV匹配；pending结果没有被填造。
- 有数据表或文件供核对，不把certification率写成accuracy。
- Print包含全部Part；页面没有全局横向溢出。
- 保持现有repo可见性；不自行发布、部署或更改权限。

### 9.7 官方文档（给实施agent，不进入学术References）

以下用于验证排版和实现，不能用作统计文献：

- [HTML Basics / Tabsets](https://quarto.org/docs/output-formats/html-basics.html)
- [Includes](https://quarto.org/docs/authoring/includes.html)
- [Callout Blocks](https://quarto.org/docs/authoring/callouts.html)
- [Cross References](https://quarto.org/docs/authoring/cross-references.html)
- [HTML Theming](https://quarto.org/docs/output-formats/html-themes.html)
- [Article Layout](https://quarto.org/docs/authoring/article-layout.html)
- [Figures](https://quarto.org/docs/authoring/figures.html)
- [Citations](https://quarto.org/docs/authoring/citations.html)
- [Website Search](https://quarto.org/docs/websites/website-search.html)
- 视觉参考：[Tencent ELR research page](https://hy.tencent.ai/research/elr)

---

## 10. 编辑及数学审校记录：排版时不可退回的表述

这一节说明为什么初稿的若干句子比理论笔记更保守，不进入公开正文。这里没有更改已提供的实验结果或替作者新增方法。

| 事项 | 本稿采用的写法 | 为什么 |
|---|---|---|
| “continuous”实验 | bounded scalar / 27-indicator average | 值在0,1/27,…,1上；不假装连续临床severity |
| Task I的范围 | scalar与Bernoulli共用Brier identity | BCE训练不改变平方损失比较的代数 |
| Bernoulli平均self-reference | $2E_XVar_r(\mu_r(X))$ | 不能直接用logit bias variance代替概率variance |
| 固定trio | 正负都可能 | 随机annotator的平均正效应不保证每个实现panel都正 |
| Task I的“胜出” | shift、sign reversal、latent superiority分开 | S>0只说明reference切换产生的相对变化 |
| Trained reference | 单独说明误差正交与individual effects分布 | held-out不自动给出正交；平均正交不推出各项iidGaussian |
| Continuous Gaussian | 工作近似 | 有界prediction产生的有界g不可能恰为非退化Gaussian |
| Task II error statement | 随机panel与sample上的marginal false certification bound | 不能写成每个固定坏panel条件下都levelα；也不是认证后正确概率 |
| Error budget | 三项相加 | `prob`的名字没有定义预算分配 |
| Calibration | lower chi-square quantile，full covariance | 共享baseline导致相关；upper scale的反演方向不能写反 |
| Fixed K | 更多items不消除少量annotator带来的不确定性 | 定理fixed-K，不自动推出growing-K一致性 |
| Bernoulli平均reference | 有曲率残余项 | 平均logit居中不等于平均probability无偏 |
| Bernoulli first stage | logit-contrast准确性是额外条件 | probability consistency、温度校准和低BCE都不能替代它 |
| Synthetic κ | generator推出的population upper bound2 | finitepanel经验ratio更小也不能自动用它缩紧定理 |
| Synthetic full-pool PCA | fixed-pool实验设计 | 不宣称inductive held-out feature estimation；也不把人工label生成说成真实诊断 |
| 认证比例 | procedure output frequency | 不是oracle correctness、coverage、false-positive rate或经验证的power |
| 120 configurations | overlapping panel configurations | 不是120个独立datasets/seeds；不随意加binomial error bars |
| any-aspect | ≥1 of27 | 不是all27；也不是单aspect定理的同时保证 |
| 比较target | soft model prediction versus observed human response | 人类response variance包含在Δ*中；不能暗改成两条件均值或临床能力比较 |

如果之后作者希望修改这些建模设定或加强结论，需要新的理论/结果支持。排版agent不能为了“更有说服力”删掉它们。

---

## 11. Related works：使用位置、论点边界与链接

不设一大块独立的literature review来打断blog。Introduction用少量文献定位问题；数据与温度校准文献放在实际用到的位置。下面11项都已在英文正文引用，完整BibTeX见下一节。

| Cite key | 文献与链接 | 放在哪里 / 支持什么 | 不应借此声称 |
|---|---|---|---|
| `rottger2022paradigms` | Röttger et al., 2022. [Two Contrasting Data Annotation Paradigms for Subjective NLP Tasks](https://aclanthology.org/2022.naacl-main.13/)；[PDF](https://aclanthology.org/2022.naacl-main.13.pdf) | Intro：annotation policy与subjective judgments | 所有领域都没有客观truth |
| `davani2022disagreements` | Mostafazadeh Davani et al., 2022. [Dealing with Disagreements](https://aclanthology.org/2022.tacl-1.6/)；[PDF](https://aclanthology.org/2022.tacl-1.6.pdf) | Intro：保留annotator差异、multi-annotator modeling | surrogate自动成为可靠judge |
| `ouyang2022instruction` | Ouyang et al., 2022. [Training Language Models to Follow Instructions with Human Feedback](https://proceedings.neurips.cc/paper_files/paper/2022/hash/b1efde53be364a73914f58805a001731-Abstract-Conference.html)；[PDF](https://proceedings.neurips.cc/paper_files/paper/2022/file/b1efde53be364a73914f58805a001731-Paper-Conference.pdf) | Intro：human feedback进入训练，同时承认其held-out-labeler评估 | 该文忽视annotator泛化或已经展示本项目的bias |
| `rajpurkar2017chexnet` | Rajpurkar et al., 2017. [CheXNet, v3](https://arxiv.org/abs/1711.05225v3)；[PDF](https://arxiv.org/pdf/1711.05225v3) | Intro：真实存在model–human superiority比较 | 本文证明CheXNet结论错误或有self-reference bias；不误写其reference协议 |
| `geva2019annotator` | Geva et al., 2019. [Are We Modeling the Task or the Annotator?](https://aclanthology.org/D19-1107/)；[PDF](https://aclanthology.org/D19-1107.pdf) | Intro：模型能学annotator-specific patterns | 它就是本项目fixed-image多reader实验；原文研究annotator生成文本 |
| `dawid1979observer` | Dawid and Skene, 1979. [Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm](https://doi.org/10.2307/2346806) | Intro/II：latent-label与observer-error建模传统 | 有一个不依赖假设的万能annotator数量 |
| `raykar2010crowds` | Raykar et al., 2010. [Learning From Crowds](https://jmlr.org/papers/v11/raykar10a.html)；[PDF](https://jmlr.org/papers/volume11/raykar10a/raykar10a.pdf) | Intro/II：联合估计predictor与annotator性能 | aggregation已有方法完全没有考虑noise或assumptions |
| `guo2017calibration` | Guo et al., 2017. [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html)；[PDF](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf) | Part I：temperature scaling | 本项目Uτ、chi-square inversion或reference reliability来自该文 |
| `nguyen2022vindr` | Nguyen et al., 2022. [VinDr-CXR data descriptor](https://www.nature.com/articles/s41597-022-01498-w) | 数据来源、原始标注协议 | 27维project representation就是原始dataset完整label ontology |
| `vindr2021data` | [VinDr-CXR v1.0.0 resource](https://physionet.org/content/vindr-cxr/1.0.0/)；[version DOI](https://doi.org/10.13026/3akn-b287) | 明确使用资源版本 | project test split等同原始consensus test |
| `pollard2026physionet` | Pollard et al., 2026. [PhysioNet as a Global Platform for Biomedical Research](https://doi.org/10.1038/s44360-026-00096-z) | 当前数据页要求的平台归属引用；不是理论related work | 将平台文章作为本项目统计定理的依据 |

出处核对说明：CheXNet v3的PDF作者列表含Robyn L. Ball，下面按PDF列；Dawid–Skene原始年份为1979，不用数字化页面的较新timestamp；VinDr数据条目的不寻常姓名大小写按官方BibTeX保留。PhysioNet平台文献按当前数据页给出的引用信息列入。

不宣称“first study”或“previous work overlooked all of this”。本稿的定位已经足够具体：研究某个model–human comparison对reference的依赖，以及在明确模型下如何认证其方向。

---

## 12. 完整 references.bib

把下方代码块完整复制到文章目录的 `references.bib`。保持cite key不变；Quarto按正文引用生成References。不要把本节中文说明或代码围栏复制进 `.bib`。

```bibtex
@inproceedings{rottger2022paradigms,
  author = {R{\"o}ttger, Paul and Vidgen, Bertie and Hovy, Dirk and Pierrehumbert, Janet},
  title = {Two Contrasting Data Annotation Paradigms for Subjective {NLP} Tasks},
  booktitle = {Proceedings of the 2022 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies},
  year = {2022},
  pages = {175--190},
  publisher = {Association for Computational Linguistics},
  doi = {10.18653/v1/2022.naacl-main.13},
  url = {https://aclanthology.org/2022.naacl-main.13/}
}

@article{davani2022disagreements,
  author = {Mostafazadeh Davani, Aida and D{\'i}az, Mark and Prabhakaran, Vinodkumar},
  title = {Dealing with Disagreements: Looking Beyond the Majority Vote in Subjective Annotations},
  journal = {Transactions of the Association for Computational Linguistics},
  volume = {10},
  pages = {92--110},
  year = {2022},
  doi = {10.1162/tacl_a_00449},
  url = {https://aclanthology.org/2022.tacl-1.6/}
}

@inproceedings{ouyang2022instruction,
  author = {Ouyang, Long and Wu, Jeffrey and Jiang, Xu and Almeida, Diogo and Wainwright, Carroll and Mishkin, Pamela and Zhang, Chong and Agarwal, Sandhini and Slama, Katarina and Ray, Alex and Schulman, John and Hilton, Jacob and Kelton, Fraser and Miller, Luke and Simens, Maddie and Askell, Amanda and Welinder, Peter and Christiano, Paul F. and Leike, Jan and Lowe, Ryan},
  title = {Training Language Models to Follow Instructions with Human Feedback},
  booktitle = {Advances in Neural Information Processing Systems},
  volume = {35},
  pages = {27730--27744},
  year = {2022},
  doi = {10.52202/068431-2011},
  url = {https://proceedings.neurips.cc/paper_files/paper/2022/hash/b1efde53be364a73914f58805a001731-Abstract-Conference.html}
}

@misc{rajpurkar2017chexnet,
  author = {Rajpurkar, Pranav and Irvin, Jeremy and Zhu, Kaylie and Yang, Brandon and Mehta, Hershel and Duan, Tony and Ding, Daisy and Bagul, Aarti and Ball, Robyn L. and Langlotz, Curtis and Shpanskaya, Katie and Lungren, Matthew P. and Ng, Andrew Y.},
  title = {{CheXNet}: Radiologist-Level Pneumonia Detection on Chest {X}-Rays with Deep Learning},
  year = {2017},
  eprint = {1711.05225},
  archivePrefix = {arXiv},
  primaryClass = {cs.CV},
  doi = {10.48550/arXiv.1711.05225},
  note = {Version 3; author list follows the PDF},
  url = {https://arxiv.org/abs/1711.05225v3}
}

@inproceedings{geva2019annotator,
  author = {Geva, Mor and Goldberg, Yoav and Berant, Jonathan},
  title = {Are We Modeling the Task or the Annotator? An Investigation of Annotator Bias in Natural Language Understanding Datasets},
  booktitle = {Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing and the 9th International Joint Conference on Natural Language Processing (EMNLP-IJCNLP)},
  year = {2019},
  pages = {1161--1166},
  publisher = {Association for Computational Linguistics},
  doi = {10.18653/v1/D19-1107},
  url = {https://aclanthology.org/D19-1107/}
}

@article{dawid1979observer,
  author = {Dawid, A. P. and Skene, A. M.},
  title = {Maximum Likelihood Estimation of Observer Error-Rates Using the {EM} Algorithm},
  journal = {Journal of the Royal Statistical Society Series C: Applied Statistics},
  volume = {28},
  number = {1},
  pages = {20--28},
  year = {1979},
  doi = {10.2307/2346806},
  url = {https://doi.org/10.2307/2346806}
}

@article{raykar2010crowds,
  author = {Raykar, Vikas C. and Yu, Shipeng and Zhao, Linda H. and Hermosillo Valadez, Gerardo and Florin, Charles and Bogoni, Luca and Moy, Linda},
  title = {Learning From Crowds},
  journal = {Journal of Machine Learning Research},
  volume = {11},
  number = {43},
  pages = {1297--1322},
  year = {2010},
  url = {https://jmlr.org/papers/v11/raykar10a.html}
}

@inproceedings{guo2017calibration,
  author = {Guo, Chuan and Pleiss, Geoff and Sun, Yu and Weinberger, Kilian Q.},
  title = {On Calibration of Modern Neural Networks},
  booktitle = {Proceedings of the 34th International Conference on Machine Learning},
  series = {Proceedings of Machine Learning Research},
  volume = {70},
  pages = {1321--1330},
  publisher = {PMLR},
  year = {2017},
  url = {https://proceedings.mlr.press/v70/guo17a.html}
}

@article{nguyen2022vindr,
  author = {Nguyen, Ha Q. and Lam, Khanh and Le, Linh T. and Pham, Hieu H. and Tran, Dat Q. and Nguyen, Dung B. and Le, Dung D. and Pham, Chi M. and Tong, Hang T. T. and Dinh, Diep H. and Do, Cuong D. and Doan, Luu T. and Nguyen, Cuong N. and Nguyen, Binh T. and Nguyen, Que V. and Hoang, Au D. and Phan, Hien N. and Nguyen, Anh T. and Ho, Phuong H. and Ngo, Dat T. and Nguyen, Nghia T. and Nguyen, Nhan T. and Dao, Minh and Vu, Van},
  title = {{VinDr-CXR}: An Open Dataset of Chest {X}-Rays with Radiologist's Annotations},
  journal = {Scientific Data},
  volume = {9},
  number = {1},
  pages = {429},
  year = {2022},
  doi = {10.1038/s41597-022-01498-w},
  url = {https://www.nature.com/articles/s41597-022-01498-w}
}

@article{vindr2021data,
  author = {Nguyen, Ha Quy and Pham, Hieu Huy and {tuan linh}, le and Dao, Minh and khanh, lam},
  title = {{VinDr-CXR}: An Open Dataset of Chest {X}-Rays with Radiologist Annotations},
  journal = {PhysioNet},
  year = {2021},
  month = jun,
  note = {Version 1.0.0},
  doi = {10.13026/3akn-b287},
  url = {https://physionet.org/content/vindr-cxr/1.0.0/}
}

@article{pollard2026physionet,
  author = {Pollard, Tom and Moody, Benjamin E. and Lehman, Li-wei H. and Gow, Brian J. and Fernandes, Chrystinne and Xie, Chen and Johnson, Alistair and Mark, Roger G. and Heldt, Thomas},
  title = {{PhysioNet} as a Global Platform for Biomedical Research},
  journal = {Nature Health},
  volume = {1},
  number = {8},
  pages = {792--795},
  year = {2026},
  doi = {10.1038/s44360-026-00096-z},
  url = {https://www.nature.com/articles/s44360-026-00096-z}
}
```
