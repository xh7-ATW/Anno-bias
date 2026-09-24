This is a draft for the blog. Please organize your contents based on this draft. All the theories you need and the experimental (setting/results) you need are provided in the folder references. This is not a paper, but a blog. High-level ideas and results are more important than derivation steps and experimental details.

Part 1. Introduction (In this part, you should find related works)
    -- background [In this age, AI/ML models are being used increasingly ; for many tasks (you should list what tasks in which fields), there're no golden truth, AI/ML models need be trained/evaluated on subjective annotators.]
    -- problem [A central problem is the evaluation of a trained model (suppose the model is trained on human annotator A), especially whether its performance has exceeded a human annotator B. Many models would claim that (I hope so, you should find evidence); however, is A a justified judge for the model-human (B) comparison?]
    -- analyze the problem [In many tasks, annotators can be biased, and model would learn the biases if trained using these annotators' answers (you should find evidence). This is called annotation bias. Then, to answer the problem above, when it's claimed that the model beats B, a possible case is that the model, compared to B, is closer to A; in other words, the model is biased by A. This is not equivalent to saying that the model is better than B.]
    PS. during this analysis, you can borrow some key equations/results in the theory to explain our intro, as long as it makes sense.
    -- go on analyzing the problem [If we use another annotator C to evaluate, maybe the comparison between B and the model (trained by A) can reverse! However, is C a reliable evaluator?]
    -- find a solution [Without preliminary knowledge on the annotators, we can never say that an annotator is reliable without question. Then, when can we say an annotator is reliable? Another method is to increase the number of annotators (find related works, there might be). Good point, but until how large? See our theory!]
    PS. during the analysis till now, it is always good to find related works that give answers to our questions. We need to point out their constraints as we go on our introduction. This will be more convincing, showing that our works are significant
    -- another problem [Do we really need a number of annotators' answers on the test set? No, see how we use a trained checkpoint as a surrogate. This does not necessarily save cost, but provides flexibility.]
    -- Summarize our methods and results here [I'll leave this to you. Be sure to mention that we provide results for both 'the existence of annotation bias' and 'the method of finding a reliable annotator'.]
    -- Summarize main contributions with bullets.

Part 2. Show the modeling setup, experimental setting/results for the annotation bias.
    -- Introduce both the modeling of a continuous bounded variable and a 0/1 bernoulli variable (see the theory)
    -- Establish the quantities to be compare, the statistics, and tests. Put the proof and derivations (as long as the storyline is readable without them) in the toggle as in the demo. Put the ERM analysis also in a remark/toggle. The interpretation part in 4.1 (of Anno_bias_theory) is important, which gives a understandable analysis of anno-bias besides the observationals; be sure to keep it in the main text. Till now, the theory covered is Section 1 - 4.
    PS. I am not sure if the continuous variable and the bernoulli variable have different format/interpretation for the theory part. If so, please elaborate simultaneously.
    -- Briefly explain the experimental setting (what dataset, how the data are processed, what annotators and their roles, what are the variables of interest), including both the continuous bounded variable and the 0/1 bernoulli variable (You can see this in the references, the data are from https://physionet.org/content/vindr-cxr/1.0.0/).
    -- Visualize the results of both cases and explain them, be sure to justify the claim that annotation bias really exists.

Part 3. Identify reliable annotators for the continuous variable (See this in Section 5.)
    -- A major contribution here is described in Section 8: an annotator can be considered as a reference as long as it can be trained upon. Otherwise, it is difficult to obtain so many annotators on the same test set (Our datasets already show this difficulty). Different from the theory, you can discuss this in the very beginning of this part, and then use this throughout. But remember to discuss the relevant assumptions.
    -- Same as the previous part, establish the quantities to be compare, the statistics, and tests. Put the proof and derivations (as long as the storyline is readable without them) in the toggle as in the demo. Be sure to demonstrate clearly.
    -- You can keep the discussion in Section 6 either in a remark or in the main context.
    -- Explain the experimental setting briefly. The annotators used here are different from previously. A thing you should know is that, the data annotated by R8-R10 have similar distribution, while the data annotated by R11-R16 have another distribution (these data are mostly negative). So in this task, we use R11-R16, so that K can be selected to be 4. (You don't need to tell every detail, but you should let readers know we've changed the annotators, and convey why we do this.)
    -- Visualize the results for the continuous variable, and explain accordingly. Be clear about the calibration setting.

Part 4. Identify reliable annotators for the bernoulli variable (See this in the pdf Bernoulli_version_Sept). 
    -- Point out the reason why we need a new framework. Then establish the quantities to be compare, the statistics and tests. Put the proof and derivations (as long as the storyline is readable without them) in the toggle as in the demo. Be clear on the differences between this case and the continuous case.
    -- The bernoulli framework makes the rejection much harder (the rejection was already hard because the data are mostly negative). So we use need synthetic data for more annotators and more positive data (see the pdf Task_II_Synthetic_Data_Gen, describe how this is generated, briefly. This is not the main storyline of our paper.)
    -- Visualize the results for the bernoulli variable, and explain accordingly.

Part 5. Conclusion
