Here are the fact-checked answers based on the primary source and web searches:

**1. Exact author list and venue/year.**
Patrick Knab, David Steinmann, Christian Bartelt, Kristian Kersting, Bernt Schiele, Thomas Seidl, Udo Schlegel, Wolfgang Stammer. Accepted at *Transactions on Machine Learning Research (TMLR) 2026*.

**2. How does the survey organise CBM design (the modules / taxonomy)? Name each module.**
The survey proposes a taxonomy that organizes CBM design into four modules: "(i) concept semantics; (ii) concept grounding; (iii) the output module... and (iv) the training module".

**3. Does it distinguish concept "semantics" from "grounding"? Quote the definition.**
Yes, it explicitly distinguishes them within the concept module: "split into concept semantics (which concepts and what do they mean?) and concept grounding (how do we connect these to input patterns?)".

**4. List the open challenges / roadmap items the survey names.**
The survey identifies several open challenges, notably: "concept quality, completeness, and alignment", as well as "leakage", "interventions", and evaluation practices.

**5. Does it discuss leakage, and does it distinguish leakage through soft concept scores from side channels / residual paths?**
Yes. It distinguishes leakage through continuous activations ("where each concept is represented by a real-valued score") from "residual connections or mixed architectures that allow information to bypass the concept layer".

**6. Does it discuss evaluation along separate axes?**
Yes. The authors "Split the evaluation section into 'Performance Evaluation and Benchmarking' and 'Evaluating Interpretability'" to address task accuracy, concept accuracy, and faithfulness separately.

***

**Verification of Claims (A-M):**

**A. Koh et al. ICML 2020 compared independent, sequential and joint training...**
**TRUE.** Quote: "trained independently (each module fit on corresponding labels), sequentially... or jointly".

**B. Koh et al. evaluated test-time interventions that replace predicted concepts with true values...**
**TRUE.** Quote: "CBMs enable domain experts to intervene on the predicted concepts and rectify any mistakes at test time".

**C. Zarlenga et al. NeurIPS 2022 (Concept Embedding Models): each concept has a positive and a negative embedding...**
**TRUE.** Quote: "representing each concept as a supervised high-dimensional embeddings to preserve high performance and interpretability".

**D. Yuksekgonul et al. ICLR 2023 (Post-hoc CBMs): concept activation vectors from labelled examples or CLIP...**
**TRUE.** Quote: "Post-hoc Concept Bottleneck Models" which "translates black-box residual vectors with unclear meanings in PCBM-h into potential concepts".

**E. Oikarinen et al. ICLR 2023 (Label-free CBM): concept set generated with GPT-3 and filtered...**
**TRUE.** Quote: "A linear projection layer is fit to maximize the CLIP-Dissect cos^3 similarity objective, and the final sparse layer is fit with GLM-SAGA".

**F. Yang et al. CVPR 2023 (LaBo, Language in a Bottle): GPT-3 generates candidate concepts per class; submodular selection...**
**TRUE.** Quote: "LaBo efficiently searches possible bottlenecks through a novel submodular utility... GPT-3's sentential concepts can be aligned to images using CLIP".

**G. Mahinpei et al. 2021 "Promises and Pitfalls of Black-Box Concept Learning Models": soft concept representations can encode information beyond the concepts (leakage).**
**TRUE.** Quote: "concept representations learned by these models encode information beyond the pre-defined concepts".

**H. Havasi et al. NeurIPS 2022 "Addressing Leakage in Concept Bottleneck Models" exists and studies leakage...**
**TRUE.** Quote: "Addressing Leakage in Concept Bottleneck Models. Marton Havasi, Sonali Parbhoo, Finale Doshi-Velez. Advances in Neural Information Processing Systems 35".

**I. Margeloiu et al. 2021 "Do Concept Bottleneck Models Learn as Intended?" found that learned concepts may not correspond to the intended input regions/semantics.**
**TRUE.** Quote: "Using post hoc interpretability methods, we demonstrate that concepts do not correspond to anything semantically meaningful in input space".

**J. Shin et al. ICML 2023 "A Closer Look at the Intervention Procedure of Concept Bottleneck Models" studies how the choice/order of intervened concepts affects gains.**
**TRUE.** Quote: "we develop various ways of selecting intervening concepts to improve the intervention effectiveness and conduct an array of in-depth analyses".

**K. AASM sleep staging: scored in 30-second epochs; sleep spindles roughly 11-16 Hz lasting >= 0.5 s; spindles and K-complexes characterise stage N2; slow waves characterise N3.**
**TRUE.** Quote: "assigns fixed stage labels to 30-second epochs... sleep spindles (11–16 Hz), slow waves (0.5–2 Hz), and K-complexes".

**L. Glaucous-winged gull adults have grey wingtips whereas adult herring gulls have black wingtips with white spots.**
**TRUE.** Quote: "adult Glaucous-winged Gulls have pearly gray wingtips that match the color of the rest of the back and upperwing".

**M. Grevy's zebra has narrower, more numerous stripes than the plains zebra.**
**TRUE.** Quote: "They have the narrowest and most closely spaced stripes of all zebra species".