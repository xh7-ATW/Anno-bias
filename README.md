# Is Your Annotator Reliable?

This repository is the supporting material for the blog post
**[Is Your Annotator Reliable? Statistical inference for annotation bias and reliability](https://anno-bias.netlify.app/)**
by Xuhe Zhang and Ying Jin.

It contains the source of the post and the result files behind its figures and interactive tables. To read the article, follow the link above.

## How the files support the post

| File or folder | Role in the post |
|---|---|
| `annotation-bias.qmd` | The post itself: introduction, conclusion, and the Part I/II/III tabs. |
| `annotation-bias/_part-1-self-reference.qmd` | Part I: the self-reference effect and its test. |
| `annotation-bias/_part-2-continuous.qmd` | Part II: testing whether a reference is reliable, for aggregate scores. |
| `annotation-bias/_part-3-bernoulli.qmd` | Part III: the same test for binary labels, with the semi-synthetic experiment. |
| `data/part1-aggregate/`, `data/part1-binary/` | Results of Part I (Figures 1 and 2). |
| `data/part2-aggregate/` | Results of Part II. |
| `data/part3-semisynthetic/` | Results and data-generation setting of Part III. |
| `data/results-data.js` | The single data file read by the interactive figures and tables; see [`data/README.md`](data/README.md) for how it is built. |
| `results.js` | Draws the interactive figures and tables. |
| `article-tabs.js` | Lets links open the right Part tab. |
| `annotation-bias.css` | Page style. |
| `references.bib` | Bibliography. |
| `theory/` | Theory derivations behind the tests (PDF). |
| `.github/workflows/deploy-pages.yml` | Rebuilds the post and deploys it to GitHub Pages on every push to `main`. |
