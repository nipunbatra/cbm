# CBM lecture: outline (one line per slide)

1. Title
    1. Concept Bottleneck Models. From black-box predictions to interpretable, editable concepts.
2. The black box
    2. Can a person inspect, and correct, the evidence a network used?
    3. A real photograph and a real model, CLIP
    4. CLIP compares the photo with one sentence per species
    5. The photo goes in, a score for every species comes out
    6. The answer is right. What made the model prefer it?
    7. Occlusion: grey out one patch, measure the score drop
    8. The largest drops sit on the bill and the head
    9. Which property did the model recognise there?
    10. The map shows where the score is sensitive, not which property
    11. What we want: evidence stated as named properties
3. Post-hoc or interpretable by design?
    12. Two routes: explain a model afterwards, or build one you can read
    13. Post-hoc: a method explains a trained model on one input
    14. Saliency: how much does each pixel move the class score?
    15. Occlusion: grey out a patch and measure how far the score drops
    16. TCAV: find the direction that separates stripes from no stripes
    17. TCAV score: how often the zebra score rises along stripes
    18. Limit 1: a map can look convincing without reflecting the model
    19. Limit 2: an explanation can expose a shortcut, but it cannot remove it
    20. Limit 3: the map speaks in pixels, an expert speaks in findings
    21. Ante-hoc: the prediction is computed from quantities a person can read
    22. The case for models that are interpretable by design
    23. A concept bottleneck predicts concepts first, then the answer
    24. The same path in symbols
4. Introducing the concept bottleneck
    25. Here is that idea on a real photograph
    26. A concept predictor fills the layer, a task head reads it
    27. The concept vector has five named entries
    28. The rule: the task head reads only these five numbers
    29. A strict CBM predicts the concepts first, then the answer from them alone
    30. The values and the head on these slides are written by hand
    31. The model believes the wingtips are grey, so it says glaucous-winged gull
    32. The wingtips are black: an observer corrects the wing colour
    33. The same task head recomputes, and herring gull now leads
    34. An edited belief, a new prediction
    35. Multi-task learning puts a concept head beside the class head
    36. There, an edit to the concepts changes nothing
    37. In a CBM, the concepts lie on the path to the prediction
5. The CUB benchmark
    38. The standard benchmark for concept bottlenecks is a bird dataset
    39. Many photographs of many similar species
    40. Every photograph is described by the same attributes
    41. Each attribute is a yes-or-no question
    42. Annotators also recorded how sure they were
    43. Single photos are noisy: take a vote within each species
    44. Keep only the attributes that many species share
    45. One training record has three parts
    46. The same record in symbols
6. What is a concept?
    47. A concept is a claim that a person can check
    48. Meaning: a definition that an expert can apply
    49. Grounding: the evidence sits in one region of the photo
    50. Representation: the simplest concept is binary
    51. A soft concept turns a logit into a value between 0 and 1
    52. A soft score is not automatically a probability
    53. Categorical: one value from a list, with scores that sum to 1
    54. Continuous: a measurement, such as bill length
    55. Richer concepts: a vector or a whole distribution
    56. Unknown: not visible is different from absent
    57. Six ways to store a concept as a number
    58. The same pattern in a sleep EEG recording
    59. A spindle is a brief burst of brain waves
    60. The same pattern in a customer message
    61. Each concept is a named claim that a specialist can check
7. From concepts to predictions: the arithmetic
    62. After the concepts, the task head is arithmetic you can do by hand
    63. Three classes and three concepts
    64. The concept vector ĉ holds one value per concept
    65. The task head keeps one row of weights for each class
    66. The full weight matrix W: rows are classes, columns are concepts
    67. A class score is one row of weights times the concept values
    68. Every row gives one score: s = Wĉ
    69. The largest score wins, and a softmax turns scores into shares
    70. A person edits one concept value: stripes 0.1 to 1
    71. Same matrix, new concept vector: recompute the scores
    72. After the edit, zebra leads
    73. The scores moved by 0.9 times the stripes column of W
    74. A person corrected a belief of the model, and nothing was retrained
8. How does the model learn the concepts?
    75. Where do the concept values come from?
    76. Each training example carries three things
    77. The concept loss compares each predicted concept with its label
    78. One term of the concept loss, worked out
    79. The task loss compares the prediction with the task label
    80. A weighted sum combines the two losses
    81. Three ways to train the concept predictor and the task head
    82. Independent: each part is trained on its own labels
    83. Sequential: freeze the predictor, then train the head on its outputs
    84. Joint: train the whole system at once, with both losses
    85. In joint training, the task loss also shapes the concept predictor
    86. A concept score can be pulled two ways
    87. Our measured run: joint training, λ_c = 2, λ_y = 1
9. The three schemes on CUB
    88. Does the training scheme matter on real photographs?
    89. Our setup: frozen CLIP features → 112 concepts → 200 species
    90. One photo through the model: features, then concepts, then species
    91. Joint training is the most accurate, independent the least
    92. An intervention replaces predicted values with true values
    93. As more groups are corrected, the independent model gains most
    94. Why joint gains least: its head reads detail in the soft scores
    95. Fully trained networks show the same pattern
10. Human interventions
    96. A person can fix a concept the model got wrong
    97. An intervention has four steps
    98. Wing colour is one group: correct it together
    99. Changing only one value could leave an impossible state
    100. Same head, new values: herring gull rises
    101. The same mechanism works on a signal
    102. The concept predictor gives spindle a low value
    103. An illustrative stage head favours other stage
    104. A sleep expert marks the spindle as present
    105. Same head, new input: N2 candidate rises
    106. A demonstration of the mechanism, not a clinical result
11. A correct edit can still hurt
    107. Does a correct edit always help?
    108. A support message that belongs in billing
    109. The concept predictor reads two concepts from the message
    110. The task head, in words
    111. The same head in symbols
    112. Before the edit, the message goes to billing
    113. A reviewer correctly sets duplicate charge to 1
    114. After the edit, the message leaves billing
    115. The fault is in the head: a weight with the wrong sign
    116. Correcting a concept does not repair the decision rule
    117. A constructed case: the failure can happen
12. What if the concepts are incomplete?
    118. The bottleneck can pass on only what the vocabulary names
    119. Two objects from two different classes
    120. The vocabulary names only colour and size
    121. Both objects get the same concept vector
    122. Shape never reaches the task head
    123. The same input to the head gives the same output
    124. The best possible accuracy is one half
    125. Sufficiency: the concepts say all the input says about the label
    126. Sufficiency in symbols
    127. A strict CBM guarantees something weaker
    128. The fix is a richer vocabulary: add shape
13. Concept leakage
    129. What exactly travels through a concept value?
    130. Leakage: the value carries more than one answer, and the head uses it
    131. Two zebras with the same binary label
    132. A soft score is a number, not a bit
    133. Same meaning, different values
    134. The head learns a threshold on the score
    135. The stripes value also carries stripe density
    136. Correct a plains zebra's stripes value
    137. A correct edit gives the wrong species
    138. Implicit leakage hides inside a continuous score
    139. Explicit leakage takes a side path around the concepts
    140. With a side path, an edit no longer controls the head
    141. Not every variation in a score is leakage
14. Leakage in a trained model
    142. Does a real trained model leak?
    143. The shape model has a size concept: large
    144. The score for large rises smoothly with the true radius
    145. Position and shade: the scores carry almost nothing
    146. To look for leakage, probe the concept scores
    147. Remedy 1: hard concepts pass only 0 or 1
    148. On CUB, hard concepts cost accuracy
    149. Remedy 2: fit the head on true concepts
    150. Remedy 3: remove side paths, or report them
    151. Above all, measure
15. Modern concept bottleneck architectures
    152. Labelling every concept on every image is the main cost
    153. One training record: an image, its concept labels and a class
    154. Rung one: images, concept labels and classes
    155. Rung two: drop the concept labels
    156. Rung three: drop training altogether
    157. A variant can change four things
    158. One running example: photographs of zebras, horses and giraffes
    159. For each variant: how the path from image to concepts to class changes
16. Concept embedding models
    160. One number per concept is a narrow channel
    161. Each concept gets two embeddings: active and inactive
    162. The model also predicts the probability p that the concept is present
    163. The concept embedding mixes the two, weighted by p
    164. With p = 0.1, the mixed vector sits close to inactive
    165. The head reads all three mixed vectors and favours horse
    166. To intervene, a person sets p
    167. Training with random interventions (RandInt)
    168. Gain: a vector carries more than one number
    169. Cost: the coordinates of the vector have no names
    170. Concept embedding models in symbols
17. Post-hoc concept bottleneck models
    171. Reuse a pretrained encoder; no concept labels needed
    172. A frozen image encoder turns each photo into 512 numbers
    173. A concept bank: eight phrases, each a direction
    174. A concept score is a projection onto a direction
    175. For this zebra, stripes scores highest
    176. A sparse linear head is trained with the class labels
    177. Only 4 of 24 weights are non-zero
    178. The prediction for this photo: zebra
    179. Edit the stripes score, and zebra falls
    180. PCBM-h adds a residual that reads the raw features
    181. The residual is a side path that an edit cannot reach
    182. Post-hoc concept bottleneck models in symbols
18. Label-free concept bottleneck models
    183. Concept labels are expensive: can a bottleneck do without them?
    184. Step 1: ask a language model about each class
    185. Three questions for three classes give 59 candidate concepts
    186. Step 2: drop class names, duplicates and unseen phrases
    187. Step 3: CLIP scores every image against every concept
    188. Step 4: a linear layer maps features to concept activations
    189. Train W_c so each activation rises and falls with its CLIP score
    190. Step 5: a sparse final layer keeps 6 of 102 weights
    191. Three of the six concepts describe the setting
    192. Label-free is not unsupervised
    193. LF-CBM in symbols
19. Language in a Bottle
    194. LaBo keeps CLIP itself as the concept detector
    195. Step 1: a language model describes each class in sentences
    196. Step 2: prefer sentences that match their own class best
    197. A greedy rule balances discriminability and coverage
    198. The greedy picks for zebra, in order
    199. Three sentences per class, nine in all
    200. Step 3: CLIP scores the image against each chosen sentence
    201. Step 4: a language prior links each class to its sentences
    202. Training with the class labels adjusts the weights
    203. Do the zebra sentences detect the ears, or stripes anywhere?
    204. LaBo in symbols
20. Grounding the concepts
    205. Nothing checks that a concept is really in the image
    206. Three ways a concept can fail
    207. A head on random words does almost as well
    208. VLG-CBM asks a detector to find each concept
    209. A box means 1, no box means 0
    210. The grounded labels train the concept layer with a loss
    211. Count the non-zero weights in each class's row
    212. Five concepts per class can actually be read
    213. VLG-CBM in symbols
21. Classification by description
    214. The last rung: no training data at all
    215. A language model describes every class
    216. CLIP scores the photo against each descriptor
    217. The same rule in symbols
    218. Every score comes with its reasons
    219. Slaty-backed gull edges ahead
    220. On all of CUB, descriptors help only slightly
    221. A descriptor can be wrong
    222. Classification by description in symbols
22. Comparing the variants
    223. Side by side: the supervision each variant needs
    224. Most variants drop the concept labels
    225. Where the concepts come from instead
    226. What reaches the task head
    227. What is trained
    228. Naming a concept does not ground it
23. How should we evaluate a CBM?
    229. Accuracy alone hides most of what a concept bottleneck promises
    230. Task accuracy: are the predictions correct?
    231. Concept accuracy and grounding: right concepts, right evidence?
    232. Faithfulness: does the output really depend on the concepts?
    233. Intervention utility: do corrections help, and at what cost?
    234. A controlled test: synthetic shapes with known concepts
    235. Three models share one small CNN
    236. Task accuracy: the three models are close
    237. Concept accuracy: most concept values are right
    238. One edit to one concept changes the prediction
    239. Oracle corrections: fix the worst concept first
    240. Random corrections help more slowly
    241. In the multi-task model, a concept edit changes nothing
    242. Read these numbers with care
    243. Similar accuracy, very different intervention utility
24. Beyond images
    244. Where else do concept bottlenecks fit?
    245. Medicine: a knee X-ray → clinical findings → a severity grade
    246. Language: a review → four aspects → a star rating
    247. Intensive care: vital signs → summary concepts → vasopressor onset
    248. Wearables: sensor signal → simple activities → complex activity
    249. Sleep: an EEG → the patterns scorers use → a sleep stage
    250. One recipe in every domain
25. An interpretable interface is not the end of the story
    251. Follow the path from photo to concepts to answer: what can fail?
    252. 1 · Encoder: distribution shift
    253. 2 · Concept detector: wrong grounding
    254. 3 · Vocabulary: missing information
    255. 4 · Task head: the wrong relationship
    256. 5 · Intervention: wrong, or too costly
    257. Five questions for any concept bottleneck
    258. A 2026 survey maps the field onto the same parts
26. Final replay
    259. One last time: a black box maps the photo to a species
    260. Open it: named concepts sit on the path to the prediction
    261. A person corrects one concept, and the prediction follows
    262. The interface is only as good as its parts
    263. Concepts that can be inspected, evaluated and corrected
    264. The interface must carry what the prediction depends on
    265. What to remember
27. End card
    266. Concept Bottleneck Models. Predicting through interpretable concepts.
