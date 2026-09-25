# Blog results presentation — 给 Claude 的补充指令

日期：2026-09-25。适用对象：现有单文件 Quarto 博客及其本地排版 agent。

## 1. 本次修改的目标与优先级

这是研究博客。读者应该先通过文字和默认展示看懂发现，再通过少量交互查看自己感兴趣的结果。所有控件都服务于文章正在回答的问题。

本文是此前 `annotation-bias-draft-and-agent-instructions.md` 的**结果展示与结果文案补丁**，配合本次包含 11 个 CSV/JSON 区块的结果文件使用。保留原稿的理论、related works、BibTeX 和总体论证；涉及下列内容时，以本文件和作者最新说明为准：

1. **真实 Bernoulli Task I 已经有最终结果。** 删除旧稿中该实验“待完成”的表述，更新正文、导读和 Conclusion 中相应描述。
2. **Synthetic Bernoulli Task II 最终报告 K = 16, 24, 32。** 删除旧稿关于 K 网格不一致、无法确认 K24、以 K8 为主结果的说明。原始运行目录的命名属于实现历史，不进入博客叙事。
3. **只有 synthetic setting 保留 empirical power 的位置。** 当前上传数据包含 rejection 汇总，没有 power 结果；作者之后补数据。Continuous Task II 始终使用 rejection percentage，不把认证比例写成正确率或 power。
4. 用基于真实数据的 HTML/SVG 组件替换结果图片引用。简单结果直接用排版良好的 HTML 表格，不必全部交互化。

交付范围是修改本地博客内容和展示。沿用现有单文件 `.qmd`，不要求恢复 `_quarto.yml`，不重跑实验，不改变统计程序，不自动发布网站。

## 2. 页面节奏：保留文章结构，每个结果紧跟对应解释

沿用：**Introduction → 三个 Part 选项 → 当前 Part → Conclusion → References**。Introduction 和 Conclusion 位于正常文档流中，切换 Part 时保留；“常驻”不等于固定占据屏幕。

| 位置 | 读者的问题 | 主展示 | 进一步查看 |
|---|---|---|---|
| Part I · General/scalar Task I | 更换 reference 会怎样改变比较？ | 六行小表，直接展示全部比较 | 精确估计、其他 nominal levels |
| Part I · Real Bernoulli Task I | 不同 aspect 中，这个变化是否相同？ | 可切换 aspect 的六行配对点图 | 某个实例、完整数值表 |
| Part I · Calibration 注释 | 概率预测做过什么校准？ | 正文一句说明 | 收起的三行校准表 |
| Part II · Continuous Task II | 多大的参考集合能通过判定？ | K × prob 的 3 × 4 小表 | 按模型—人组合查看具体参考集合 |
| Part III · Synthetic Bernoulli Task II | K 和 prob 改变时，各 aspect 的拒绝比例怎样变化？ | aspect + prob 控制的三条横向数据条 | 展开全部 27 个 aspect |
| Part III · Empirical power | 已知真相后，备择下的检验表现如何？ | 目前一行待补说明 | 作者提供数据后接入 |

**General/scalar 和 Bernoulli 仍分开讲。Task I 的两个实验都必须保留。** 不把它们包装成一个会混淆评价量的“数据集切换器”。

每处结果按固定阅读顺序组织：

1. 一小段直接回答科学问题的文字。
2. 一块默认状态已经有解释力的结果。
3. 两三句解读，必要时附一个能切换到具体实例的正文链接。
4. 收起的细节和数据下载入口。

不要为每个结果增加一层页签。中间已有三个 Part；结果内部主要使用下拉框、离散按钮和普通折叠块。

## 3. Part I：reference 如何改变比较

### 3.1 Scalar Task I：六行表就够了

源区块：`SCALAR_TASK_I_SUMMARY`。

24 行数据是六组 ordered triples × 四个 nominal levels，效应与 p 值在不同 level 下重复。主文按 `alpha = 0.05` 取六行；不要把 24 行当作 24 个独立实验展示。

标题：**Changing the reference changes the comparison**。

默认表列为 `Model trained on A`、`Compared human B`、`External reference C`、`Estimated shift S`、`One-sided p`。用最后一列的小符号或简短文字表示 `S > 0 detected`，不要用一整列大色块。

| A | B | C | S | One-sided p | S > 0 detected at α = .05 |
|---|---|---|---:|---:|---|
| R8 | R9 | R10 | 0.0008508403 | 8.475 × 10⁻⁹ | Yes |
| R8 | R10 | R9 | 0.0008171825 | 1.880 × 10⁻⁹ | Yes |
| R9 | R8 | R10 | 0.0009083236 | 3.463 × 10⁻¹¹ | Yes |
| R9 | R10 | R8 | 0.0004557486 | 0.0005033 | Yes |
| R10 | R8 | R9 | −0.0004828480 | 0.9999211 | No |
| R10 | R9 | R8 | −0.0005919439 | 0.9999952 | No |

实际页面可用科学计数法压缩 S 列，不必使用表中这么多小数。完整精度放在收起的数值表或 CSV 中。这里不需要 alpha 滑块：四个已报告 level（.001、.01、.05、.10）的判定相同。

可直接使用的英文正文：

> Across the six ordered model–human–reference comparisons, four show a positive self-reference shift at every reported nominal level. These are the comparisons involving models trained on R8 or R9. The two comparisons involving the R10-trained model have negative estimated shifts and do not reject the one-sided null. The result identifies a reference effect in particular comparisons; it does not establish which annotator is clinically correct.

Caption：

> Each row uses 1,500 test images. The shift is S = Δ_external − Δ_self, with Δ defined as model loss minus human loss. Tests are one-sided and reported at nominal α = 0.05; the decisions are unchanged at the other reported levels.

### 3.2 Real Bernoulli Task I：一个 aspect 选择器，一眼看完六组比较

源区块：`REAL_BERNOULLI_TASK_I_SUMMARY`。共 504 行：六组三元组 ×（27 个 aspect + 一个 across-aspect mean）× 三个 alpha。

标题：**The same comparison, judged by two references**。

**主展示采用配对点图。** 六行对应六个 ordered triples；每行用一条细线连接两个点：

- 灰色圆点：self-reference A 下的 `delta_self_ref_A`。
- 蓝色菱形：external reference C 下的 `delta_external_ref_C`。
- 共享横轴：model loss minus human loss。始终显示零线；左侧负值有利于模型，右侧正值有利于人。
- 行尾简洁显示 S 和 one-sided p；通过文本或符号提示是否检出正向 shift。
- 点之间的距离是估计 shift，**不是置信区间**。不要把连接线画成误差条。

控件放在图标题与图之间，只占一行：

| 控件 | 选项 | 默认 |
|---|---|---|
| Aspect | `Average across 27 aspects` + 27 个真实名称 | `Average across 27 aspects` |
| Nominal α | .01 / .05 / .10 | .05 |

不要另加 A、B、C 三个筛选器：六行同时展示更容易理解 reference 的角色，也不需要读者先配置一组实验才能看到内容。

平均结果直接使用 `scale = mean_over_aspects` 的行；不要自行平均 27 个 p 值，也不要用 aspect-level rejection 的平均值代替总体检验。

默认状态的关键结果：六个 S 都为正，其中四个在 α = .05 下拒绝。六行的 self/external loss gap 都仍为负，即平均结果中没有观察到比较方向翻转。

| A / B / C | Mean S | One-sided p | α = .05 |
|---|---:|---:|---|
| R8 / R9 / R10 | .002886660 | .00812758 | Reject |
| R8 / R10 / R9 | .003402628 | .00233229 | Reject |
| R9 / R8 / R10 | .003877082 | .000449603 | Reject |
| R9 / R10 / R8 | .003670215 | .00110450 | Reject |
| R10 / R8 / R9 | .001706649 | .0695997 | Do not reject |
| R10 / R9 / R8 | .001398718 | .123473 | Do not reject |

可直接使用的主文：

> For binary findings, changing from the training annotator to an external reference shifts the average Brier-loss comparison in the positive direction in all six ordered triples. Four shifts are significant at nominal α = 0.05. The average loss gap remains negative under both references in every triple, so an average shift should not be confused with an average ranking reversal. Selecting an individual finding reveals variation that the across-aspect average hides.

图后添加一个轻量的正文链接：**See an observed reversal for Atelectasis**。点击后设置 aspect = Atelectasis、α = .05，并强调 R8 / R9 / R10 行；不要打开新页面或弹窗。

这个实例的真实数值：

- Self-reference gap：−0.0061689631。
- External-reference gap：+0.0006133821。
- S：0.0067823452；one-sided p：0.02949355。

实例说明可用：

> For Atelectasis, the R8-trained model has a negative observed loss gap against R9 when judged by R8, but a positive gap when judged by R10. The observed ranking therefore reverses. The one-sided test detects a positive shift (p = 0.0295); it does not separately certify the sign of each gap or establish that R10 supplies the ground truth.

实例是引导读者探索的入口，默认仍显示 across-aspect mean，避免把某个有利案例当作总体结果。

图下保留一句：`1,500 test images · Unadjusted, nominal tests`。对 27 个 aspect × 六组三元组的检验没有给定多重比较校正，不能宣称整体错误率已被控制。必要细节放在折叠内容里，不要把这一句扩成抢占正文的警告块。

实现细节：

- 切换 alpha 只改变判定和对应阈值；同一 aspect 的 S、p 和点位置不应改变。
- 每次切换 aspect，六行共用同一横轴范围且包含零。可以按当前 aspect 调整范围，但明确标注 `Axis rescales by aspect`；不能对每一行独立缩放。
- n = 1,500 是图像数。Across-aspect mean 的检验单位仍是图像，不是 1,500 × 27 个独立样本。
- 训练损失为 unweighted BCEWithLogitsLoss；这里展示的测试量为 Brier/squared loss。避免把训练和检验都叫 BCE。
- 完整数值表按当前选择输出六行即可；原始全部结果另给下载链接，不把 504 行铺在正文中。

### 3.3 Temperature calibration：放在方法说明之后的折叠块

使用三个 `REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_*` 区块及其 JSON 元数据。展示位置在 Bernoulli 预测模型的简短说明之后，不作为独立主结果。

公开折叠标题：**Probability calibration details**。

主文只需：

> A separate validation analysis fitted one global temperature per annotator-specific model. Calibration diagnostics are available below.

展开后放三行表，列为 model、validation n、T、ECE before → after、Brier before → after。BCE 可放完整数值表中。

| Model | Validation n | Global T | ECE before → after | Brier before → after |
|---|---:|---:|---|---|
| R8 | 636 | 1.073601 | .00419015 → .00385771 | .02813323 → .02814849 |
| R9 | 579 | 1.028285 | .00426010 → .00366102 | .04517973 → .04518668 |
| R10 | 621 | .999127 | .00262634 → .00261164 | .03141643 → .03141619 |

若读者确实需要 aspect 细节，可在这一个折叠块里提供 aspect 选择器，始终只显示三个模型。81 行 per-aspect 表不是 81 次独立拟合：同一模型只有一个全局 T。

不要写“所有校准指标都改善”：R8、R9 的 Brier 略有增加。不要提供 raw/calibrated Task I 结果切换开关，因为这次没有提供两套对照检验表。不要生成 reliability diagram，因为没有相应分箱数据。这是预测概率的 temperature calibration，和 Task II 的 Uτ calibration 分开说明。

## 4. Part II：十二个数直接展示，具体配置再展开

主表源区块：`CONTINUOUS_TASK_II_TRUE_RATE_BY_K_PROB`。
详细源区块：`CONTINUOUS_TASK_II_EXHAUSTIVE_SUMMARY`、`CONTINUOUS_TASK_II_METADATA`。

标题：**How often does the procedure certify a comparison?**

主文中直接展示一个 3 × 4 表。每格以百分比为主，下一行用更小字号显示 numerator / denominator。使用细横线和充足留白，不需要把十二个数转换成复杂的热图。

| K | prob = .01 | prob = .05 | prob = .10 | prob = .20 |
|---|---:|---:|---:|---:|
| 2 | 0.56% · 1/180 | 1.67% · 3/180 | 4.44% · 8/180 | 10.00% · 18/180 |
| 3 | 0.83% · 1/120 | 3.33% · 4/120 | 6.67% · 8/120 | 23.33% · 28/120 |
| 4 | 0.00% · 0/30 | 10.00% · 3/30 | 16.67% · 5/30 | 46.67% · 14/30 |

公开指标名：**Rejection percentage**。解释这里 rejection 对应程序成功认证比较方向。CSV 的 `n_true`、`true_percent` 是布尔判定为 True 的计数与比例，不是“认证正确的个数”和“正确率”。`B_true` 是所比较的人类 annotator 标识，也不是 latent ground truth。

可直接使用的正文：

> Certification is uncommon at the smallest reported probability budget. Across all 330 configurations, the rejection percentage rises from 0.61% at prob = 0.01 to 18.18% at prob = 0.20. At prob = 0.20, the percentages are 10.00%, 23.33%, and 46.67% for K = 2, 3, and 4. These are descriptive rates over enumerated configurations, which reuse annotators and images. They measure how often the procedure reaches a certification decision, not its accuracy against known ground truth.

这些 K 组包含不同数量、不同组成的参考集合；不要把表述扩大为每个单独比较在增加 K 后都会通过，也不要推断为独立重复抽样的因果效果。

Caption：

> Each probability setting evaluates 330 configurations: 180 with K = 2, 120 with K = 3, and 30 with K = 4. The split-total calibration allocates prob / 3 to each of αδ, αg, and γ. Numerators count certification decisions.

完整汇总若需要写在细节中：四个 prob 下分别是 2/330、10/330、21/330、60/330。跨 K 总比例按总计数算，不能对三行百分比作无权平均。

### 可选的折叠交互：Inspect one comparison

这部分默认收起，目的是解释“为什么这组通过、另一组没通过”，不是增加一个数据分析后台。

- 一个 ordered model–human pair 下拉框：A ≠ B，共 30 个组合。
- 一行 prob 按钮：.01 / .05 / .10 / .20。
- 默认 A = R13、B = R11、prob = .05。
- 显示该组合的全部 11 个 reference panels，按 K 分三组：K2 有 6 个、K3 有 4 个、K4 有 1 个。
- 每行先显示实际 reference 名称，再显示 `Observed gap magnitude`、`Required bound` 和结果。
- 点击一行，下面用一句文字解释 `|Δ̂ref| > bound` 是否成立；不再增加多张图。

例如默认 pair 中，references = R12, R14, R15, R16，K = 4：

- Observed gap magnitude：0.0003145104。
- Required bound：0.0002655212。
- Margin：0.0000489893，因此通过判定。
- 原始 Δ̂ref 为负，在该损失比较及理论假设下认证的方向有利于模型。

`Not certified` 的含义是此程序未能给出结论，不等于相反方向成立，也不等于该 reference 已被证明不可靠。

正文中保持十二格表即可；详细交互做得简洁时才加入。不得把 1,320 行 exhaustive CSV 放进主文。

## 5. Part III：最适合做交互的 synthetic Bernoulli 结果

源区块：`SYNTHETIC_BERNOULLI_TASK_II_FINAL_K16_K24_K32_SUMMARY`。
243 行 = 27 aspects × 三个 K × 三个 prob。每个 aspect、K、prob 的 `n_tests = 120`。

### 5.1 默认呈现：两个控件，三个 K 同时看

标题：**More references, more opportunities to certify**。

标题之前先放结论段落。标题之下是一行控件，再往下是三条横向条形图，分别代表 K = 16、24、32。三个 K 必须保持可同时比较，不要把 K 也做成第三个筛选器。

| 控件 | 选项 | 默认 |
|---|---|---|
| Aspect | `Average across 27 aspects` + 27 个 aspect 名称 | `Average across 27 aspects` |
| prob | .05 / .10 / .20 | .10 |

横轴固定为 0–100%。同一主色，长度编码比例；末端显示精确百分比，旁边小字显示计数。0% 的条仍保留名称、0% 和 0/120，不让它消失；100% 不溢出组件。

默认视图应立即显示：

| K | Average rejection percentage at prob = .10 |
|---|---:|
| 16 | 0.00% |
| 24 | 18.77% |
| 32 | 100.00% |

默认 caption：

> Average rejection percentage across 27 aspects. Each aspect contributes 120 trial decisions per K and prob setting. Trial configurations are shared across aspects.

平均值定义为 27 个 aspect 的 rejection percentage 的等权平均。当前每个 aspect 分母相同，因此也等于合计拒绝数 / 3,240。平均视图可以在小字中显示 pooled count，但必须写成 `aspect–trial decisions`；**不要说 3,240 independent trials 或 3,240 datasets**。

选中具体 aspect 后，caption 自动改为：

> Rejection percentage for [aspect], over 120 trials per K at prob = [prob].

可直接使用的默认主文：

> In the synthetic Bernoulli experiment, the reported rejection percentages vary sharply with the number of references and the probability setting. At prob = 0.10, the average across 27 aspects is 0.00% for K = 16, 18.77% for K = 24, and 100.00% for K = 32. The intermediate setting is especially revealing: its average rises from 0.22% at prob = 0.05 to 90.99% at prob = 0.20. Use the controls below to see how this pattern varies by finding.

`prob` 暂时使用该名称或 `Reported probability setting`，不要擅自改成 `Bernoulli probability`、`p-value` 或 `Significance level α`。生成机制的 positive probability ≈ .5 是另一个量。Continuous 的 split-total 元数据不能直接移植为 synthetic 的校准说明。

### 5.2 图后一个实例链接，比增加更多默认控件更有用

添加正文链接：**Explore Lung Opacity**。点击选择 Lung Opacity，保留当前 prob；附近说明针对某个固定 prob 的句子必须明确标出该值。

例如正文可写：

> The across-aspect average also hides heterogeneity. For Lung Opacity at prob = 0.10, the rejection percentage is 0% for both K = 16 and K = 24, while it is 100% for K = 32. At prob = 0.20, the K = 24 percentage reaches 98.33% (118/120).

不要让动态说明文字在切换后仍显示默认状态的数字。固定正文可以描述固定 setting；组件 caption 和实例说明若宣称“当前选择”，必须与当前状态同步。

### 5.3 全部 aspect 放在一个可展开的总览中

在三条数据条下面放 **Compare all 27 aspects**，默认收起。

展开后是 27 行 × 三列 K 的精简表，受上面同一个 prob 选择控制。每格显示百分比，可用非常浅的单色背景条辅助比较。行按源数据 `aspect_index` 排序，不默认按结果大小排序。

- 点击 aspect 行，更新主展示并标记选中行。
- 大屏显示 aspect 与三个 K；窄屏保留横向滚动区域，不让整页横向溢出。
- 只有需要跨全部 aspect 查阅的读者才会展开。无需再加搜索框、排名榜或结果导出工具栏。
- 原始 CSV 的下载链接可以放在折叠块底部。

下面是供 agent 对照的**完整跨-aspect 汇总**；不要求再复制一遍进入主文，以免和交互展示重复：

| prob | K = 16 | K = 24 | K = 32 |
|---|---:|---:|---:|
| .05 | 0.00% · 0/3240 | 0.22% · 7/3240 | 63.21% · 2048/3240 |
| .10 | 0.00% · 0/3240 | 18.77% · 608/3240 | 100.00% · 3240/3240 |
| .20 | 0.31% · 10/3240 | 90.99% · 2948/3240 | 100.00% · 3240/3240 |

### 5.4 Power 的位置和数据约定

在 rejection 展示和解读之后，保留一个小标题 **Empirical power**，下面暂时只有一句平静的说明：

> Empirical power results based on the known synthetic ground truth will be added here.

源文件保留标记 `[[PENDING:SYNTHETIC_TASK2_POWER]]`，公开页面不要显示这个内部 token。

当前不放空坐标轴、假数字、加载动画或可点击却没有内容的 Power 按钮。作者提供结果后，可以沿用同一个 aspect 和 prob 的选择状态，在相邻位置展示 power；若两套结果具有一致的维度，可以再添加 `Rejection percentage / Empirical power` 指标切换。

数据到齐之前不得把现有 `rejection_percent` 复制到 power。两者在某些全部为备择的设计下可能相同，但当前汇总没有用于核对该条件的真相标签。后续导入的 power 数据应说明对应备择、合格 trial 分母和拒绝计数；若只交付已算好的 power，则保留作者定义和分母说明。

**Continuous Task II 不添加 Power 栏、Power tab 或 Power 占位。**

### 5.5 Synthetic setting：短说明和折叠详情即可

使用 `SYNTHETIC_GENERATION_METADATA` 与 `SYNTHETIC_GENERATION_CONFIG` 支撑原有生成机制段落，不制作参数调节器。

主文简短列出 34 个 annotators、27 个 aspects、test n = 1,813 和最终 K = 16/24/32 即可。Train/validation/test 的 2,887 / 738 / 1,813、5,438 unique images、PCA 10、embedding 1,376 等放折叠详情。

若正文使用 κ，区分理论 population bound κ = 2 与有限 annotator pool 的诊断统计（约 1.23866–1.31080）；不能相互替代。生成 config 的 `reference_k = 32` 不覆盖这次最终实验报告的三个 K。

## 6. 视觉方向：让交互自然地长在文章里

### 排版与留白

- 延续研究博客的白底、深色正文、衬线阅读字体。正文宽度约 760–820px，图表可适度放宽至 900–960px；先适配现有主题，不为组件重做整个页面。
- 正文字号约 17–18px、行距 1.6–1.75。图表标签和控件使用清楚的无衬线字体，数字使用 tabular numerals。
- 结果标题是一句有意义的问题或发现，不用 `Dashboard`、`Analytics`、`Data Explorer` 等后台界面标题。
- 图表直接嵌入正文。优先使用上下留白和一条浅分隔线；避免每个数都放进带阴影的圆角卡片。
- 每个主组件只保留一行控件。解释性文字放在图前和 caption 中，不在组件顶部堆大段说明。

### 颜色与动效

- 主色使用与现有博客协调的沉稳蓝色，灰色用于对照和辅助信息。
- Synthetic 三个 K 用同一种颜色，长度负责比较。Bernoulli Task I 用颜色加点形状区分 reference。
- 判定必须有文字或符号，不依赖红绿颜色。未拒绝不渲染成报错状态。
- 不自动播放、不轮播、不自动切换 aspect。状态切换尽量即时；如需过渡，150–200ms 即可，并尊重 reduced-motion。
- 不默认出现 Plotly 式放大、框选、截图等悬浮工具条；这些结果的主要操作是选择和比较。

### 阅读与响应式

- 主结果和结论无需点击即可理解。折叠内容只是增量信息。
- 不使用 hover 作为精确值的唯一入口；触屏和键盘也应能读到值。
- 所有 select/button 有明确 label；选中状态可见，键盘可操作。
- 切换结果不能刷新整个页面或把读者滚回顶部。
- 切换三个 Part 时保留该 Part 内的选择状态。避免隐藏 panel 首次显示时图宽为 0；在 panel 可见后重新测量，或使用响应式 SVG viewBox。
- 窄屏中控件允许换行，长 aspect 名称不截到无法区分；数值和计数优先保留。
- 打印或 JavaScript 不可用时，至少保留主结论和默认状态的结果表。无脚本情况下三个 Part 的正文应仍可读，不应只剩一个空容器。

## 7. 给实现 agent 的数据接入约定

### 7.1 数据角色与字段映射

区块名称是本次结果文件中的标题，不是公开页面上的标题。可以把区块拆成 CSV/JSON，放在现有项目合适的数据目录；不要求作者整理服务器代码之后才能做展示。

| 区块 | 展示用途 / 关键字段 |
|---|---|
| `SCALAR_TASK_I_SUMMARY` | 静态六行表；A/B/C、S_hat、p_value_one_sided_H1_S_gt_0、alpha、reject_H0_S_le_0 |
| `REAL_BERNOULLI_TASK_I_SUMMARY` | 以 scale/aspect/alpha 选择六行；配对点取 delta_self_ref_A 与 delta_external_ref_C；S、p、判定从对应行读取 |
| `REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_JSON` | 校准说明、每个模型一个 global T 的元数据 |
| `REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_SUMMARY` | 三行 before/after 校准表 |
| `REAL_BERNOULLI_TASK_I_TEMPERATURE_CALIBRATION_PER_ASPECT` | 收起的 aspect 校准详情 |
| `CONTINUOUS_TASK_II_TRUE_RATE_BY_K_PROB` | 12 格主表；n_true / n_experiments = true_percent / 100；前台重命名为 rejection |
| `CONTINUOUS_TASK_II_EXHAUSTIVE_SUMMARY` | 按 A_model、B_true、prob 选择配置；reference_annotators、K、abs_Delta_hat_ref、total_rejection_boundary_abs、certification_margin、certify_same_nonzero_sign |
| `CONTINUOUS_TASK_II_METADATA` | split-total calibration 与配置含义 |
| `SYNTHETIC_BERNOULLI_TASK_II_FINAL_K16_K24_K32_SUMMARY` | aspect、aspect_index、K、prob、n_tests、n_rejections、rejection_percent |
| `SYNTHETIC_GENERATION_METADATA` | 样本数与实际生成统计 |
| `SYNTHETIC_GENERATION_CONFIG` | 生成设置；不替代实验结果网格 |

### 7.2 数据处理边界

- 全部交互只读取预计算结果，在浏览器中筛选和绘制。无需浏览器连接服务器、启动 Shiny 服务或重新运行 Python 模型。
- 优先使用现有项目已经采用的轻量绘图方式。若尚未采用库，native HTML controls + SVG 足够完成这几处展示；也可使用 Quarto 原生支持的 Observable JS。不要为几个选择器引入一个完整前端框架。
- 用同一份数据更新图、caption、计数和详情表，避免分别硬编码造成不一致。
- CSV 数值须显式转换。特别注意布尔字符串 `False` 不能直接当成 JavaScript truthy 值。
- `prob` 与 `alpha` 用规范化的离散值匹配；不要做连续滑块，也不要在未实验的 .075 等值之间插值。
- 保留源数据完整精度，显示时再格式化。百分比通常两位小数；p 很小时使用科学计数法，不能显示为 p = 0。
- 空值展示为 `Not available`，不要写成 0。没有 power 数据就是没有，不能从图片读取或从 rejection 边际比例反推。
- 不从 marginal rejection 汇总推导“至少一个 aspect 拒绝”或“全部 aspect 拒绝”的比例；这些需要 trial 层面的联合结果。
- 不默认添加置信区间：特别是多个 aspect 和配置复用了 trials、images、annotators，不能把所有决定当成独立 Bernoulli 样本来画普通二项置信带。
- 使用相对资源路径，或将整理后的 JSON 安全嵌入页面；本地预览和已部署静态页面均应能读取。不要引用作者电脑或服务器的绝对路径。
- 替换旧图片及其 caption 时一并修复文内交叉引用。每个交互组件保留稳定 anchor，例如 `result-real-bernoulli-task1`、`result-synthetic-bernoulli-task2`。

技术参考仅供排版 agent：

- Quarto interactive documents: https://quarto.org/docs/interactive/
- Quarto Observable JS: https://quarto.org/docs/interactive/ojs/

这是展示层修改，不新增 related works。保留原初稿的引用键、文献链接和 BibTeX。

## 8. 完成判据

在本地渲染后，检查这些与读者体验和统计含义直接相关的事项即可：

1. 不操作控件，也能看懂四处主要实验的发现；Scalar 与 Bernoulli Task I 都存在。
2. 真实 Bernoulli 默认显示六行平均结果，α = .05 时四行检出正向 shift；Atelectasis 实例数值与本文件一致。
3. Synthetic 默认 prob = .10 的平均结果为 0.00%、18.77%、100.00%，K 始终是 16、24、32。
4. Synthetic 切换为 Lung Opacity、prob = .20 后，K24 显示 98.33% 和 118/120。
5. Continuous 主表的 K4、prob = .20 显示 46.67% 和 14/30；所有名称均为 rejection/certification decision，而非 accuracy/power。
6. 只在 synthetic 下保留 power 待补说明。旧稿的 Bernoulli Task I 待完成及 K 网格争议说明已删除。
7. 切换 Part、aspect 和 prob 后，图表、数字、caption 保持一致；窄屏可读，页面不跳动，不出现整页横向溢出。

最终效果应当是一篇有清晰叙事、少量可探索结果的研究博客。每一个控件都让读者更容易理解一个发现，而不是让读者承担分析全部数据的工作。
