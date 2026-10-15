I am fact-checking narration for a graduate lecture video on Concept Bottleneck Models. Use Google Search. Primary source:
Knab et al., "What's in the Bottle? A Survey and Roadmap of Concept Bottleneck Models", TMLR 2026
(https://openreview.net/forum?id=IF5vnqxBEW ; companion site https://patrick-knab.github.io/whats-in-the-bottle/ ;
DFKI PDF https://www.dfki.de/fileadmin/user_upload/import/17340_7700_What_s_in_the_Bottle_A_Su.pdf).

Answer each question with a short verbatim quote (under 25 words) and where it appears. Say "not found" rather than guessing.
1. Exact author list and venue/year.
2. How does the survey organise CBM design (the modules / taxonomy)? Name each module.
3. Does it distinguish concept "semantics" from "grounding"? Quote the definition.
4. List the open challenges / roadmap items the survey names (e.g. concept quality, leakage, interventions, evaluation, completeness...).
5. Does it discuss leakage, and does it distinguish leakage through soft concept scores from side channels / residual paths?
6. Does it discuss evaluation along separate axes (task accuracy, concept accuracy, faithfulness/interpretability, intervention effectiveness)?

Then verify these claims about primary papers, each TRUE / FALSE / PARTLY with a quote:
A. Koh et al. ICML 2020 (Concept Bottleneck Models) compared independent, sequential and joint training; in independent training the task head is trained on true concepts.
B. Koh et al. evaluated test-time interventions that replace predicted concepts with true values (e.g. on CUB and OAI).
C. Zarlenga et al. NeurIPS 2022 (Concept Embedding Models): each concept has a positive and a negative embedding computed from the input, mixed by a predicted probability p: c = p c+ + (1-p) c-; interventions set p.
D. Yuksekgonul et al. ICLR 2023 (Post-hoc CBMs): concept activation vectors from labelled examples or from CLIP text embeddings; features of a frozen backbone are projected onto concept vectors; sparse linear predictor; PCBM-h adds a residual predictor on the embeddings.
E. Oikarinen et al. ICLR 2023 (Label-free CBM): concept set generated with GPT-3 and filtered; a projection layer is learned so concept activations match CLIP image-text similarity (CLIP-Dissect, cos^3 similarity); final sparse layer trained with task labels (GLM-SAGA).
F. Yang et al. CVPR 2023 (LaBo, Language in a Bottle): GPT-3 generates candidate concepts per class; submodular selection; CLIP image-text similarity as the bottleneck; linear layer initialised from language priors.
G. Mahinpei et al. 2021 "Promises and Pitfalls of Black-Box Concept Learning Models": soft concept representations can encode information beyond the concepts (leakage).
H. Havasi et al. NeurIPS 2022 "Addressing Leakage in Concept Bottleneck Models" exists and studies leakage with soft/hard concepts and side channels.
I. Margeloiu et al. 2021 "Do Concept Bottleneck Models Learn as Intended?" found that learned concepts may not correspond to the intended input regions/semantics.
J. Shin et al. ICML 2023 "A Closer Look at the Intervention Procedure of Concept Bottleneck Models" studies how the choice/order of intervened concepts affects gains.
K. AASM sleep staging: scored in 30-second epochs; sleep spindles roughly 11-16 Hz lasting >= 0.5 s; spindles and K-complexes characterise stage N2; slow waves (0.5-2 Hz, >75 microvolts) characterise N3.
L. Glaucous-winged gull adults have grey wingtips (similar in tone to the mantle) whereas adult (American) herring gulls have black wingtips with white spots (mirrors).
M. Grevy's zebra has narrower, more numerous stripes than the plains zebra.
