# Narration

Voice: Gemini TTS `gemini-3.8-flash-tts`, voice **Orus**, direction `[calm] [clear, steady pace of an experienced university lecturer]`, tempo 1.12.
Running time 66:42.00. Source: `narration/order.txt` + `narration/scenes/*.txt` (one line per beat). Timecodes are film time.

## 00:00.00  s00  Title

`00:01.00`  Concept Bottleneck Models. From black-box predictions to interpretable, editable concepts.  

## 00:09.10  s01  The black box

`00:09.50`  A neural network makes a prediction. How can a person inspect, and correct, the intermediate evidence it used?  
`00:16.77`  Here is a photograph of a gull, and a real model, CLIP.  
`00:21.46`  It is asked to choose among six gull species, by comparing the image with a short description of each.  
`00:27.83`  Image in, an encoder, and a score for every species. It prefers American herring gull, with a softmax share of 0.54. Glaucous-winged gull comes second, at 0.21.  
`00:41.24`  The answer happens to be right. But what made the model prefer it?  
`00:46.14`  A common response is a heatmap. This one is computed: we grey out one patch of the photograph at a time, and measure how much the herring gull score drops.  
`00:55.99`  The largest drops sit on the bill and the head.  
`00:59.42`  So what did the model recognise there? The yellow bill? The red spot near its tip? The shape of the head? Or the blue water just behind it?  
`01:08.68`  The map marks where the score is sensitive. It does not say which property the model detected, and it gives a person nothing specific to correct.  
`01:19.00`  Suppose instead the model had to state its evidence as named properties: wingtip colour, bill shape, head colour. Each claim could then be checked.  

## 01:30.27  s21  Post-hoc or interpretable by design?

`01:30.67`  There are two ways to get an explanation from a model. You can train a black box and explain it afterwards, which is called post-hoc. Or you can build the model so that its reasoning can be read from the start, which is called ante-hoc, or interpretable by design.  
`01:46.21`  Start with post-hoc. The model f is already trained. An explanation method takes the model and one input, and returns some evidence about the prediction.  
`01:57.01`  One family asks which pixels mattered. A saliency map takes the gradient of the class score with respect to each pixel: how much the score would change if that pixel changed.  
`02:08.31`  A second family changes the input. Grey out one patch, run the model again, and measure how much the score drops. That is the occlusion map we computed for the gull in Part 1.  
`02:20.19`  A third family asks about concepts directly. Testing with concept activation vectors, or TCAV, asks a question like this one: does the model use grey wings when it says herring gull? Here the model is CLIP, the black box from Part 1.  
`02:35.16`  The first step is to collect example photos: some birds with grey wings, and some without, here from a labelled bird dataset. None of them is a herring gull.  
`02:44.33`  Pass every photo through the model and look at its internal activations. Fit a line that separates the two groups. The direction across that line is the concept activation vector: moving along it means more grey wing.  
`02:57.67`  Now take a herring gull photo and ask: if its activation moved a little in the grey wing direction, would the herring gull score go up? The gradient of the score, times the direction, gives the answer as a sign.  
`03:11.97`  The TCAV score is the share of herring gull photos where the score goes up. For grey wings, it went up for almost all 60 photos, in each of 10 repeats with different example photos.  
`03:24.52`  A direction that separates two random sets of photos gives scores that jump between zero and one. So a concept counts only when its score is steady and different from random ones. And even then, TCAV says what the model responds to. It gives no way to correct it.  
`03:42.16`  These methods are useful, and they have limits. The first is a sanity check. If an explanation really describes the model, it should change when the model changes. Adebayo and colleagues tested this by randomising a trained network's weights, layer by layer, until it had learned nothing.  
`03:59.55`  Some saliency methods, such as guided backpropagation, still produced almost the same maps for the randomised network. Those maps mostly trace the edges in the image, like an edge detector. So a convincing map is not, on its own, evidence about the model. Plain gradients and Grad-CAM did pass this test.  
`04:17.21`  The second limit is about shortcuts. Zech and colleagues trained a pneumonia detector on chest X-rays from two hospital systems. At one hospital about a third of the patients had pneumonia, and at the other about one in a hundred.  
`04:29.57`  A network could tell which hospital an X-ray came from almost perfectly, from markers and scanner details rather than from the lungs. Since the hospital predicts pneumonia, the detector could use the hospital as a shortcut.  
`04:42.67`  A heatmap might light up the hospital marker in the corner, and expose the shortcut. But it cannot remove it. On X-rays from a third hospital, the detector did worse. The only fix was new data and retraining.  
`04:55.84`  The third limit is vocabulary. A heatmap says where the score was sensitive. It does not say what the model saw there. On the gull: the yellow bill, the red spot, or the shape of the head?  
`05:08.84`  Experts reason in named findings: a narrowed joint space, a bone spur, black wingtips. Even when an expert spots the mistake, the model has no named part to correct. There is no setting for wingtip colour that a person could switch from grey to black.  
`05:25.11`  Ante-hoc models take the other route. The prediction is computed from quantities a person can read. A sparse linear model on named features is one example. A short decision tree is another. Prototype networks compare parts of an image with stored example parts.  
`05:40.49`  Rudin argued that for high-stakes decisions we should prefer models like these over black boxes explained afterwards.  
`05:47.95`  A concept bottleneck model is an ante-hoc model for deep networks. First, predict named properties of the photo, its concepts. Then predict the answer from those concepts alone.  
`05:59.04`  In symbols: x is the input, c hat is the vector of predicted concepts, and y hat is the prediction. A concept predictor, g, maps x to c hat. A task head, f, maps c hat to y hat.  

## 06:16.50  s02  Introducing the concept bottleneck

`06:16.90`  Here is that idea on a real photograph, with numbers small enough to follow. Between the image and the answer, we insert a layer of named variables.  
`06:26.09`  A concept predictor, g theta, maps the image to a vector of concept values, c hat. A task head, f phi, maps those values to the prediction, y hat.  
`06:38.28`  Here the concepts are wingtip grey, wingtip black, bill pointed, head white, and tail rounded. Each receives a value between 0 and 1.  
`06:49.10`  The essential rule: the task head receives only these five numbers. No other path from the image reaches it. That narrow interface is the bottleneck.  
`06:58.80`  A black box maps the image straight to an answer. A strict concept bottleneck model, or CBM, first predicts the concepts, then predicts the task from the concepts alone.  
`07:10.68`  These concept values and this head are written by hand, for teaching.  
`07:15.91`  This model believes the wingtips are grey, at 0.8, and black, at only 0.2. So it ranks glaucous-winged gull first, 0.71 against 0.29.  
`07:28.27`  Look at the photograph: the wingtips are black. An observer corrects the wing colour concepts. Grey becomes 0, and black becomes 1.  
`07:38.12`  The task head is unchanged. It simply recomputes, and American herring gull now receives 0.91.  
`07:47.11`  A person edited an intermediate belief, and the prediction followed.  
`07:51.71`  Compare multi-task learning, where a concept head sits beside the class head.  
`07:57.01`  Editing that concept output changes nothing, because the class head never reads it.  
`08:02.06`  In a concept bottleneck, the concepts lie on the path to the prediction.  

## 08:08.27  s22  The CUB benchmark

`08:08.67`  The gull is not a random choice. The standard benchmark for concept bottlenecks is a bird dataset: Caltech-UCSD Birds, or CUB.  
`08:17.83`  It has 11,788 photographs of 200 species. Eight of the species are gulls.  
`08:25.19`  People annotated every photograph with 312 yes-or-no attributes, in 28 groups: bill shape, wing colour, wing pattern, eye colour, and so on.  
`08:36.88`  Each attribute is a question with a yes or no answer. Does this bird have a hooked bill? Is its wing grey? Yes is a one, and no is a zero.  
`08:48.39`  Annotators also recorded how sure they were: definitely, probably, guessing, or not visible. About one label in ten is not visible.  
`08:58.15`  Labels on single photos are noisy, so Koh and colleagues took a majority vote within each species. After the vote, every photo of a herring gull has the same labels.  
`09:08.95`  They then kept the 112 attributes that are present in at least ten species.  
`09:14.10`  One training record is a photograph, 112 zeros and ones, and a species.  
`09:20.60`  In symbols, the concept labels c form a vector with 112 entries, each zero or one, and the label y is one of 200 species. The model predicts c hat, a value between zero and one for each concept.  

## 09:36.97  s03  What is a concept?

`09:37.37`  Let us slow down. What exactly is a concept? It is more than a neuron with a name attached: it is a promise that a person can check the claim in the input.  
`09:48.64`  Three things must be in place. The first is meaning: a definition that a domain expert can apply. For example, grey wingtip: the tips of the folded flight feathers are grey, not black.  
`10:00.04`  The second is grounding: where in the input is the evidence? For wingtip colour, it is this region. The estimate should depend on these feathers, and not on the water or the rock.  
`10:11.97`  The third is representation: how the concept becomes a number. The simplest is binary: c j is zero or one.  
`10:20.72`  A soft concept passes a logit, z, through the sigmoid, giving a value between zero and one. A logit of 1.4 gives 0.80.  
`10:31.71`  A soft score of 0.8 is not automatically a calibrated probability. Whether eighty percent of such cases really have grey wingtips has to be checked on data.  
`10:43.70`  Some concepts are categorical. Wing colour takes one value from a list, so its scores form a softmax over the options, and they sum to one.  
`10:53.21`  Others are continuous, such as bill length in millimetres, predicted by regression.  
`10:59.02`  Richer models give each concept a vector, an embedding, or a whole probability distribution. We will meet these in Part 10.  
`11:07.79`  And sometimes the evidence is missing. In CUB, a wingtip hidden behind a rock is labelled not visible. Unknown is not the same as absent, and the representation should be able to say so.  
`11:20.51`  So a concept can be stored in six ways: binary, soft, categorical, continuous, a vector or distribution, and unknown.  
`11:31.76`  The same pattern applies across sensors. In a sleep EEG recording, a concept might be: sleep spindle present.  
`11:39.36`  A spindle is a brief burst of brain waves, about 11 to 16 cycles per second, lasting roughly half a second to two seconds. Sleep scorers treat spindles as a sign of stage two sleep.  
`11:52.14`  In a customer message, a concept might be: duplicate charge reported, meaning the customer says one purchase was billed twice.  
`12:00.14`  Each is a named claim about the input that a specialist could check.  

## 12:05.67  s04  From concepts to predictions: the arithmetic

`12:06.07`  How do concept values become an answer? In the simplest case, the task head is arithmetic small enough to do by hand.  
`12:13.58`  Three classes: zebra, horse, and giraffe. Three concepts: stripes, horse-like shape, and long neck.  
`12:22.39`  Given this low-contrast photograph, the concept predictor reports stripes 0.1, horse-like shape 0.9, and long neck 0.1. Stacked in a column, they form the concept vector, c hat.  
`12:36.18`  The task head is a weight matrix, W, with one row per class. The zebra row holds 3 for stripes, 1 for horse-like shape, and 0 for long neck.  
`12:47.27`  With all three rows: stripes count toward zebra, a long neck toward giraffe, and horse-like shape mostly toward horse.  
`12:56.30`  To score zebra, multiply each weight by its concept value, and add. 3 times 0.1 is 0.3, 1 times 0.9 is 0.9, and 0 times 0.1 is 0. Zebra scores 1.2.  
`13:14.33`  Horse: minus 0.1, plus 1.8, minus 0.1, giving 1.6. Giraffe: minus 0.1, plus 0, plus 0.3, giving 0.2. These are the class scores, or logits.  
`13:30.58`  The largest score is 1.6, so the model says horse. A softmax turns the scores into shares that sum to one: horse gets about 0.52.  
`13:41.99`  Now an observer looks at the image and sees stripes. They change one coordinate: stripes, from 0.1 to 1.  
`13:50.93`  Recompute with the same matrix. Zebra: 3, plus 0.9, plus 0, which gives 3.9. Horse: minus 1, plus 1.8, minus 0.1, giving 0.7. Giraffe: minus 1, plus 0, plus 0.3, giving minus 0.7.  
`14:11.13`  After the softmax, zebra leads, with a share of about 0.95.  
`14:17.25`  The image did not change, and neither did the matrix. Each concept value scales its own column of W. Only stripes moved, by 0.9, so the scores moved by 0.9 times the stripes column: plus 2.7 for zebra, and minus 0.9 for the other two.  
`14:34.56`  So a person corrected one of the model's beliefs, and nothing had to be retrained.  

## 14:40.53  s05  How does the model learn the concepts?

`14:40.93`  So far the concept values were given. Where do they come from? The concept predictor learns them from labelled examples.  
`14:48.65`  Each training example carries three things: an input x i, concept labels c i, and a task label y i. For a herring gull in CUB: the photo, zeros and ones, and the species.  
`15:03.11`  The concept loss, L c, compares the predicted concepts with the labels: typically a binary cross-entropy for each concept, averaged.  
`15:13.66`  One term: grey wing has label 1; suppose the predictor says 0.8. The term is minus log 0.8, about 0.22. Closer to 1 costs less.  
`15:26.70`  The task loss, L y, is typically a cross-entropy over the classes: minus the log of the share given to the correct class.  
`15:35.80`  A weighted sum combines the two; lambda c and lambda y set how much each counts.  
`15:42.02`  In the original paper, Koh and colleagues compared three ways to train.  
`15:46.98`  Independent: fit the predictor to the concept labels, and separately fit the head on the true concepts. At test time, though, the head receives predicted concepts.  
`15:57.97`  Sequential: fit the predictor, freeze it, then fit the head on the concepts it predicts. The head learns from the predictor's actual mistakes.  
`16:06.79`  Joint: train the whole system at once, with both losses.  
`16:11.20`  In joint training, the task loss sends its gradient back through the head and the concept values into the predictor, which is then shaped by what helps the task.  
`16:20.70`  That can improve task accuracy. It can also hurt concept fidelity, if a concept score drifts toward whatever helps the classifier. That has to be measured.  
`16:30.70`  The experiment we will meet later used joint training, with the concept loss weighted 2 and the task loss weighted 1.  

## 16:39.43  s23  The three schemes on CUB

`16:39.83`  Part 5 described three training schemes. Does the choice matter on real photographs? We ran a small version on CUB.  
`16:48.17`  Each photo goes through a frozen CLIP image encoder, giving 512 features. A linear concept predictor maps them to 112 concepts, and a linear task head maps those to 200 species.  
`17:02.79`  For our gull photo, the predictor is sure the throat is white and the wings are grey. The head spreads its probability over several gull species.  
`17:12.80`  Joint training is the most accurate, close to a standard model with no bottleneck. Sequential falls in between, and independent training is the least accurate.  
`17:23.03`  Now intervene. Pick a few attribute groups, replace their predicted values with the true values, and let the same head recompute.  
`17:32.03`  The independent model improves fastest. Its head was trained on true concepts, so it trusts corrected ones. The joint model improves least.  
`17:41.35`  Its head learned to read fine detail in the soft scores, beyond what the concepts mean, so a corrected value helps it less. We will meet this again as leakage.  
`17:52.36`  Koh and colleagues report the same pattern with fully trained networks.  

## 17:58.40  s06  Human interventions

`17:58.80`  Concepts are useful because a person can check them. When the model gets one wrong, someone who can see the mistake can correct it, with no retraining.  
`18:08.19`  An intervention has four steps. The model predicts concept values. A person checks one and corrects it. The fixed task head recomputes. A new prediction comes out.  
`18:17.87`  Back to the gull. Wing colour is a categorical concept, so the observer corrects the group together: grey to 0, black to 1.  
`18:26.47`  Changing only one of them could leave an impossible state, with both colours on, or neither.  
`18:32.76`  The head's score for American herring gull moves from 0.29 to 0.91.  
`18:39.41`  The same mechanism works on a signal. Here is a schematic EEG trace, drawn for teaching rather than recorded from a patient. Near the middle is a short burst at about 13 hertz, the shape of a sleep spindle.  
`18:52.19`  The concept predictor gives spindle present only 0.12. K-complex present gets 0.8, and slow-wave dominance 0.15.  
`19:03.92`  With these values, an illustrative stage head favours other stage, at 0.62, over an N2 candidate, at 0.38.  
`19:13.66`  A sleep expert inspects the trace and marks the spindle as present. 0.12 becomes 1.  
`19:22.09`  Same head, new input. The N2 candidate rises to 0.86.  
`19:28.76`  This demonstrates the mechanism, not a clinical result. Real sleep staging applies scoring rules to thirty-second epochs, and this head was written by hand.  

## 19:40.13  s07  A correct edit can still hurt

`19:40.53`  So far, every correction has helped. Does a correct edit always help? Here is a case where it does not.  
`19:48.20`  A support message reads: The app works, but I was charged twice. Please refund the extra payment. It belongs in the billing queue.  
`19:56.46`  The concept predictor rates duplicate charge at only 0.2, and refund requested at 1.  
`20:03.10`  The task head computes a billing score. It starts at 1.2, takes away 2 for each unit of duplicate charge, and adds 0.6 for each unit of refund requested.  
`20:14.99`  In symbols, the score s is 1.2, minus 2 times duplicate charge, plus 0.6 times refund requested. A sigmoid turns that score into the billing share.  
`20:27.71`  Before any edit, the score is 1.2, minus 0.4, plus 0.6, which gives 1.4. Billing receives 0.80, so the message is already routed correctly.  
`20:42.11`  A reviewer reads the message and correctly sets duplicate charge to 1.  
`20:48.76`  Now the score is 1.2, minus 2, plus 0.6, which gives minus 0.2. Billing falls to 0.45, and the message goes to general support.  
`21:03.91`  The edit was correct. The fault lies downstream: this head learned a negative weight for duplicate charge, the wrong sign for billing.  
`21:11.98`  Correcting a concept does not repair an incorrect decision rule. An intervention is only as good as the head that receives it, so its effect has to be measured rather than assumed.  
`21:22.16`  This head was built faulty on purpose, to show that the failure can happen. It says nothing about how often it does.  

## 21:31.13  s08  What if the concepts are incomplete?

`21:31.53`  A second limit sits in the vocabulary itself: the bottleneck passes on only what we chose to name.  
`21:38.17`  Take two objects, a blue circle and a blue square. They belong to different classes.  
`21:44.36`  Suppose the concept vocabulary has only two entries: colour and size. Both objects are blue. Both are small.  
`21:52.64`  So both map to exactly the same concept vector. c of x 1 equals c of x 2, and yet y 1 differs from y 2.  
`22:03.12`  Watch what reaches the task head. Shape was present in the image. At the bottleneck, it disappears.  
`22:10.53`  Any task head that reads only this vector must give both objects the same output. No head, linear or a large neural network, can recover a distinction that never reached it.  
`22:21.65`  On these two examples, the best possible accuracy is fifty percent.  
`22:26.76`  The ideal property is called sufficiency. Once the concepts are known, the input says nothing more about the label.  
`22:34.03`  In symbols: Y is independent of X, given C. Here it fails: the label depends on shape, which C lacks.  
`22:43.29`  A strict CBM guarantees something weaker. Its own prediction depends on the input only through the concepts. Whether the true label does is a property of the chosen vocabulary.  
`22:54.13`  More accurate colour and size estimates would not help. The fix is a richer vocabulary: add shape. Now the two vectors differ.  

## 23:06.07  s09  Concept leakage

`23:06.47`  Each concept value is a single number on its way to the task head. What exactly does that number carry?  
`23:14.14`  A concept value should answer one question: is this concept present? Leakage is when the value carries more than that answer, and the task head uses the extra.  
`23:24.77`  Here is a constructed example. A plains zebra and a Grévy's zebra both have stripes, so both get the label stripes equals 1.  
`23:35.26`  A soft predictor scores plains zebras around 0.72, and Grévy's zebras, with narrower and denser stripes, around 0.96. Both mean stripes present, yet a threshold near 0.84 separates them almost perfectly. The binary label alone leaves the head at chance.  
`23:53.95`  So the stripes value also carries stripe density, which nobody named and nobody can inspect. That hidden part is the leakage.  
`24:03.99`  Now correct a plains zebra's stripes value to 1, its true value. The head reads anything above 0.84 as Grévy's zebra, so the correct edit gives the wrong species.  
`24:15.72`  That was implicit leakage, inside a continuous score. Explicit leakage is a side path that carries latent features around the concepts, so an edit no longer controls everything the head sees. Ordinary variation in confidence is not leakage. Leakage is systematic, and the head uses it.  

## 24:36.33  s20  Leakage in a trained model

`24:36.73`  Does a real trained model leak? Take a small model trained on synthetic shapes, which Part 11 looks at closely, and its concept large, labelled 1 for a radius of 14 pixels or more. Its score rises smoothly with the radius: about 0.09 at 12 pixels, 0.25 at 13, 0.63 at 14, and 0.87 at 15. So it carries a graded size, more than large or not large.  
`25:02.55`  A simple linear probe recovers essentially nothing about the shape's position or shade from the scores. That is how to look for leakage: probe what the scores predict beyond their labels. This is one small synthetic model.  
`25:16.20`  Hard concepts pass only 0 or 1 to the head, so nothing extra travels. On our CUB run, a linear head on hard concepts gets about 53 percent of the test photos right; on soft scores, 69 percent.  
`25:30.54`  Independent training fits the head on true binary concepts, so it never learns hidden detail in the scores. Side paths can be removed, or reported clearly.  
`25:41.01`  Above all, measure: probe the scores, and test whether interventions help on held-out data.  

## 25:49.13  s10  Modern concept bottleneck architectures

`25:49.53`  The original concept bottleneck needs a person to label every concept on every training image. That is its main cost, and most newer methods try to reduce it.  
`25:58.78`  One supervised training record looks like this: the image, a 0 or 1 for each named concept, and the class. On CUB, that meant 112 concept labels per photograph.  
`26:11.15`  The newer methods form a ladder of shrinking supervision. On the first rung, CBMs and concept embedding models need the image, the concept labels and the class.  
`26:22.15`  Post-hoc models, label-free models, LaBo and VLG-CBM drop the concept labels.  
`26:29.27`  Classification by description drops training altogether.  
`26:33.45`  An everyday way to read the ladder is to ask who supplies the concepts. Think of learning to recognise animals. On rung one, a tutor marks every feature on every picture.  
`26:44.85`  On rung two, an experienced spotter, a pretrained model, does the looking, and a field guide, a language model or a list of phrases, supplies the names. On rung three, only the field guide is left: a language model writes the descriptions, and CLIP simply compares them with each photo.  
`27:03.56`  Each step up saves labelling, and it also removes a check. A tutor who ticks a box has looked at the picture. On the higher rungs, nobody checks the concepts against the photos.  
`27:15.10`  So for each variant, watch for one question: who checks that a named concept is really visible in the image? We come back to it when we discuss grounding.  
`27:24.83`  Newer variants change four things: where the concepts come from, how each concept is detected, how it is represented, and what reaches the task head.  
`27:35.32`  We will walk through them on one running example: photographs of zebras, horses and giraffes, the classes from Part 4. We train on 24 photos and test on 12.  
`27:46.56`  For each variant, we first say in one line what changed compared with the plain CBM. Then we write down how the path changes: from x, the image, to c hat, the concepts, to y hat, the class.  

## 28:02.77  s15  Concept embedding models

`28:03.17`  First, Concept Embedding Models. One number per concept is a narrow channel, and when the vocabulary is incomplete, accuracy suffers, as we saw in Part 8.  
`28:14.06`  Here is the intuition. Give each concept two prototypes, typical points that stand for stripes present and for stripes absent. The probability works like a dimmer switch that slides the concept between the two.  
`28:29.02`  Both prototypes are computed from the image itself, so they can differ from one photo to the next. That lets detail beyond yes or no travel to the head.  
`28:38.84`  Now the mechanics. An embedding is a short list of numbers that describes something; here each one has two numbers. From the image, the model computes two embeddings for every concept: one describing it as active, one as inactive.  
`28:53.56`  It also predicts the probability, p, that the concept is present. Suppose that, as in Part 4, it misses the stripes on this photo: p is only 0.1.  
`29:03.70`  The concept's embedding mixes the two: p times the active embedding, plus one minus p times the inactive one.  
`29:11.97`  With p equal to 0.1, take the first entry: 0.1 times 0.82, plus 0.9 times 0.22, gives 0.28. The second entry works the same way, and the mixed vector sits close to inactive.  
`29:27.39`  The head, a linear layer as in Part 4, reads all three concepts, six numbers in all. The stripes vector says inactive, so the head favours horse.  
`29:38.29`  To intervene, a person sets p, not the vector. Setting p to 1 swaps in the active embedding, and zebra now leads.  
`29:47.13`  During training, CEM randomly replaces some predicted probabilities with their true values, about one concept in four, so the head learns to respond to corrections.  
`29:57.20`  The gain is capacity: a vector can carry detail that one number cannot.  
`30:02.82`  When does that matter? Recall Part 8. With only colour and size as concepts, the blue circle and the blue square got the same concept values, so no head could tell them apart.  
`30:13.87`  With embeddings, the vector for blue is computed from each image, so it can differ between the circle and the square. Shape can then reach the head without ever being named.  
`30:24.84`  The cost is inspectability: the coordinates of that vector have no names, so part of what the head uses cannot be inspected. The detail that separated the circle from the square is exactly the part nobody can read.  
`30:40.50`  Compared with the plain CBM, two of the four things changed. Each concept is now a vector instead of one number, and the head reads those vectors. People still label every concept, and a trained predictor still detects them.  
`30:54.54`  In symbols, for concept j out of k: g now outputs a probability and two embeddings, each m numbers long. c hat j is the mixed vector, and f reads all of them. Training still needs images, concept labels and class labels.  

## 31:12.87  s16  Post-hoc concept bottleneck models

`31:13.27`  Second, post-hoc concept bottleneck models. Instead of training a concept predictor from scratch, they reuse a pretrained encoder that already exists, so nobody labels concepts on the training images.  
`31:25.94`  First, the intuition. A pretrained encoder already arranges photos in its feature space, and some directions in that space follow visual properties, such as how striped an animal is.  
`31:37.77`  A concept bank gives names to some of those directions. A concept score then asks one question: how far along the stripes direction is this photo?  
`31:49.24`  Now the details. Here the frozen encoder is CLIP's image encoder: each photograph becomes 512 numbers, which we call e of x.  
`31:58.41`  Where does a direction come from? Yuksekgonul and colleagues use two routes. The first is a concept activation vector, as in TCAV in Part 1: separate the features of images with and without the concept by a linear boundary, and take the direction across it. It needs some labelled examples for each concept, but no labels on the training images.  
`32:19.22`  The second route needs no example images at all. CLIP's text encoder places a phrase in the same space as the images, so the phrase itself gives the direction.  
`32:29.27`  We take the text route, with a concept bank of eight phrases, from black and white stripes to a wooden fence. Each phrase becomes a direction, v j.  
`32:39.60`  How far along a direction does a photo lie? Multiply the features and the direction entry by entry, then add up the products: this is the dot product. With just two entries, it is the first entry times the first, plus the second times the second.  
`32:56.59`  A concept score is this projection, computed over all 512 entries, once for each of the eight directions. Both vectors have length one, so each score is also a cosine.  
`33:09.31`  The raw scores sit close together, so each one is standardised. Subtract its average over the 24 training photos, then divide by its spread, the standard deviation. For stripes, that gives 1.41.  
`33:24.01`  For this zebra photo, black and white stripes scores highest, 1.4 standard deviations above its average on the training photos.  
`33:32.97`  A linear head is then trained with the class labels, on 24 photos. As in Part 4, each class score is a row of weights times the concept scores, plus a constant, b, and a softmax turns the scores into shares.  
`33:48.15`  The head is also sparse. An L1 penalty adds the size of every weight to the loss, so weights that do not help are pushed to exactly zero. Of 24 possible weights, 8 concepts times 3 classes, only 4 are non-zero: zebra reads stripes, giraffe reads a long neck, and horse reads a flowing mane.  
`34:09.32`  For this zebra, only the stripes weight feeds the zebra score: the stripes score times its weight, plus the constant, gives about 2.03. The softmax turns the three scores into shares, and zebra gets 0.77.  
`34:24.59`  All 12 held-out photos are classified correctly. This is a tiny teaching example, not a benchmark.  
`34:31.96`  Lower the stripes score to its usual value on other animals, and zebra falls to 0.14.  
`34:39.72`  The hybrid version, PCBM-h, adds a residual: a second linear model that reads the raw features and recovers what the concepts miss. Its class scores are added to the head's scores before the softmax.  
`34:53.24`  Why does that help? Eight phrases cannot describe everything the encoder sees, and the residual picks up the rest. In the paper, PCBM-h comes close to the original model on every dataset reported, while the pure concept model falls further behind.  
`35:08.38`  The same side path weakens interventions. An edit changes a concept score, but the residual reads the raw features directly, so it keeps its vote for zebra whatever we write in the stripes slot.  
`35:20.55`  On our photo, after the same edit, the hybrid still gives zebra 0.20 rather than 0.14, because part of its evidence never passed through a named concept.  
`35:31.97`  Compared with the plain CBM, three of the four things changed. The concepts come from a bank of phrases instead of people, a frozen encoder and a projection replace the trained predictor, and in the hybrid a residual also reaches the head. Each concept is still one number.  
`35:48.82`  In symbols, for concept j out of k: g is a frozen encoder followed by a projection onto the direction v j. f is sparse and linear, plus a residual, r, in the hybrid. Only f is trained, from images and class labels.  

## 36:06.37  s17  Label-free concept bottleneck models

`36:06.77`  The third variant is the label-free concept bottleneck model. A supervised bottleneck needs a person to label every concept on every photo, 112 of them for each bird in CUB. Label-free models need no human concept labels.  
`36:22.54`  Here is the intuition. CLIP is the teacher: it has learned from images paired with captions, so it can score how well any phrase matches any image. The student is a frozen ResNet with one linear layer on top, and it learns to copy the teacher's scores. A language model writes the exam questions: the phrases to score.  
`36:42.34`  The method has five steps. The language model proposes phrases, CLIP filters and scores them, the student learns to copy the scores, and a sparse final layer, trained with the class labels, turns them into a class.  
`36:56.23`  Step one: ask a language model, for each class, for its most important features, the things commonly seen around it, and its superclasses, the broader groups it belongs to. Here is the real reply for zebra to the first question, as JSON.  
`37:10.41`  Three questions for each of three classes give 59 candidate concepts.  
`37:16.11`  Step two: filter. Phrases that contain a class name go, such as zebras or horse-like body. Equine goes as a near-duplicate of equine animal. Leather saddle and ossicones on head go because even the photos that match them best score low with CLIP. 34 concepts remain.  
`37:36.10`  Step three: CLIP scores every image against every remaining concept. A higher score means the phrase fits the image better. These scores are the teacher's answers: targets for the student, not labels from a person.  
`37:49.59`  Step four builds the student. A different frozen network, here a ResNet-50 rather than CLIP, turns each image into 2048 features, written e of x. A linear layer, W c, maps them to 34 concept activations. This layer is often called the projection, and it is the only part that learns.  
`38:08.47`  The teacher's scores and the student's activations come on different scales, so both are standardised: subtract the average over the photos, then divide by the spread, the standard deviation. For this zebra, CLIP's stripes score sits 1.41 standard deviations above its average, and the student's stripes activation sits 1.36 above.  
`38:30.63`  What does copying mean? Take one concept, black and white stripes. Across many images, the student's activation should be high where CLIP's score is high, and low where it is low. Only this pattern across images matters, not the exact values.  
`38:46.50`  Before the comparison, every standardised value is cubed: multiplied by itself three times. Cubing stretches the extremes: a score two standard deviations above average becomes eight, while half a standard deviation shrinks to one eighth. So the images that CLIP scores highest count the most.  
`39:04.30`  To compare two lists of numbers, we use the cosine: multiply them entry by entry, add up, and divide by the two lengths. It is 1 when the lists rise and fall together, even if one is twice the other, near 0 when they are unrelated, and negative when they move in opposite directions.  
`39:22.38`  Now the match for concept j, such as stripes. Let q bar be the student's standardised activations across the images, and P bar for CLIP's standardised scores. The match is the cosine between their cubes. W c is trained to make this match large for every concept. It needs no labels, so every unlabelled photo can help.  
`39:42.17`  Step five: a final layer from concepts to classes, trained with the class labels. An L1 penalty on the weights pushes most of them to exactly zero, which is what sparse means. 6 of 102 weights survive. Zebra reads black and white stripes, and giraffe reads extremely long neck. Horse reads muscular equine build and riding bridle, and safari vehicles counts against it.  
`40:05.54`  Here is one prediction. For this zebra, the zebra score is 1.46 times the stripes activation, 1.36, plus a little from wildebeest herds and a small constant: 2.02 in all. Horse gets minus 0.4 and giraffe about 0. As shares, zebra gets 0.82.  
`40:27.02`  Why insist on sparsity? A dense layer would use all 102 weights, and nobody can check 102 numbers behind every decision. Six weights can be read in a few seconds, and each one is a claim a person can check, such as: black and white stripes count for zebra.  
`40:44.35`  Reading them also shows a risk. Riding bridle, safari vehicles and wildebeest herds describe the setting, not the animal, so the head uses context as evidence. A horse photographed beside a safari vehicle would lose evidence for horse.  
`41:00.57`  Compared with the plain concept bottleneck, a language model names the concepts instead of a person, and the concept layer learns to copy CLIP instead of learning from concept labels. The head is still trained with class labels. So label-free does not mean unsupervised: the language model, CLIP and the class labels all supervise it.  
`41:20.65`  In symbols: g is the frozen backbone e followed by the learned linear layer W c, fitted to CLIP's scores with the cosine of cubes. f is a sparse linear layer. The data: images and class labels, no concept labels.  

## 41:38.37  s18  Language in a Bottle

`41:38.77`  Label-free models train a linear layer to imitate CLIP. Fourth, LaBo, short for Language in a Bottle, asks a language model for concepts too, but keeps CLIP itself as the concept detector.  
`41:51.74`  The intuition is simple. Describe each class in a few short sentences, let CLIP read them, and use its similarity scores directly as the concepts, written as 100 times CLIP's cosine. For our zebra photo, the stripes sentence scores higher than the mane sentence and the neck sentence.  
`42:09.81`  The method has four steps. A language model writes sentences, a selection rule keeps the most useful ones, CLIP scores each image against them, and a linear head, started from a guess, turns the scores into a class.  
`42:24.69`  In step one, the language model writes eight short sentences for each class, as JSON. Here they are for zebra.  
`42:31.79`  Which sentences should we keep? First, each one should separate its class from the others. Take a sentence's average CLIP score on the zebra training photos, and subtract its average on the best other class. Bold black and white stripes has the widest margin of the eight. Stocky horse-like body matches another class better than zebras, so it separates nothing.  
`42:50.78`  Second, the set should not say the same thing three times. Once one stripes sentence is in, a second stripes sentence adds much less that is new.  
`43:00.73`  Step two puts numbers on both ideas. Discriminability is the margin from two slides back, rescaled within the class so that the best sentence gets 1 and the worst gets 0. Large striped ears lands at 0.66.  
`43:15.55`  Coverage gain measures what a sentence adds beyond the sentences already chosen. A greedy rule builds the set one sentence at a time: each round it takes the best mix, 0.7 times discriminability plus 0.3 times coverage gain, and keeps that choice.  
`43:32.25`  In round one, bold black and white stripes scores 0.7 times 1, plus 0.3 times 0.69, which is 0.91, the best of the eight. Unique facial stripe patterns comes second, then large striped ears.  
`43:48.33`  For horse, a long flowing mane leads. For giraffe, an extremely long vertical neck.  
`43:55.29`  Step three: CLIP scores the image against the nine chosen sentences. Those nine numbers are the bottleneck. Score j compares CLIP's encoding of the image, phi of x, with its encoding of sentence j, psi of s j.  
`44:11.37`  Step four: a linear layer from sentences to classes, started from a language prior, a starting guess taken from the sentences. Each class gives one third to each of its own three sentences, and nothing to the others.  
`44:24.89`  So each class score is the average of its own three sentence scores. For this zebra, zebra gets 28.1, horse 22.9 and giraffe 23.7. As shares, zebra gets 0.98, and 11 of the 12 test photos are right.  
`44:41.60`  Why start from a prior? A head that starts from zero must learn from the labels which sentence belongs to which class, and that is hard with few labelled photos. The prior already encodes it. A linear probe is a linear layer on CLIP's image features, with no concepts. The LaBo paper reports its clearest advantage over a linear probe with one labelled photo per class.  
`45:03.63`  After that, training with the class labels moves the weights a little, and then all 12 are right.  
`45:09.47`  Notice the zebra sentences: all three are about stripes. Is CLIP detecting striped ears, or stripes anywhere in the picture? The scores alone cannot tell.  
`45:19.83`  Compared with the plain concept bottleneck, a language model writes the concepts as sentences, and CLIP scores them directly, so nothing is trained to detect concepts. Only the head learns, and it starts from the language prior instead of from scratch.  
`45:34.57`  In symbols: g is CLIP itself, so c hat j is 100 times the cosine between the image and sentence j. f is a linear layer that starts from the language prior. The data: images and class labels.  

## 45:49.70  s24  Grounding the concepts

`45:50.10`  Label-free models and LaBo share a weakness: nothing checks that a concept is actually visible in the image.  
`45:57.72`  The fix rests on a simple intuition. Naming a concept is not the same as pointing at it. So ask a detector to point at each concept in the image, and count only the concepts it can find.  
`46:09.68`  There are three ways a concept can fail. Some are not visual, such as a gull's call. Some describe the setting, not the bird. And some score highly on images that do not contain them, such as a black head on a gull whose head is white.  
`46:24.59`  Srivastava and colleagues point out that a head built on a set of random concepts can reach accuracy comparable to these models. So the concept scores were carrying information that their names do not describe, a form of the leakage we met in Part 9.  
`46:40.17`  Their method, VLG-CBM, grounds the concepts first. It uses an open-vocabulary object detector: a detector that can search for any phrase you give it, not only a fixed list of objects. It looks for each concept in each training image, and draws a box where it finds it.  
`46:57.36`  A concept counts as present only where a box was found. For our gull, the bill, head and wingtips each get a one, and the call gets a zero. We call this vector c det: the concept labels from the detector.  
`47:13.46`  These grounded labels train the concept layer: a linear layer that turns the backbone's features into one score per concept. The loss is a binary cross-entropy, as in the original CBM, but no person draws the labels.  
`47:26.85`  One term, as in Part 5. The wingtips have a box, so their label is one; if the layer predicts 0.8, the term is minus log 0.8, about 0.22. The call has no box, so its label is zero; a prediction of 0.2 costs the same, minus log of one minus 0.2.  
`47:47.80`  They also report the number of effective concepts, NEC for short. Each row of the head holds one class's weights, one per concept. Count the non-zero weights in each row, here three, two and four, and average over the classes: the NEC is three.  
`48:04.59`  Why does this count matter? A head that puts weight on every concept can fit almost anything. The paper proves that even a random, untrained concept layer can approximate any linear classifier once there are enough concepts. So a dense head can be accurate and still explain nothing.  
`48:20.90`  So the fair comparison gives every model the same budget: the same number of concepts per class. Only then does higher accuracy say something about the concepts themselves.  
`48:32.35`  In symbols, the count for class k is the zero norm of its row of weights: the number of entries that are not zero. The NEC averages that count over the K classes.  
`48:44.03`  The paper reports accuracy with the NEC held at five. A head like that can actually be read: each class rests on a handful of named concepts.  
`48:53.77`  Compared with label-free models, two things change. The concept layer learns from the detector's boxes instead of copying CLIP's scores, and the head is judged at a fixed number of concepts per class.  
`49:06.37`  In symbols: g is a backbone with a concept layer, W c, trained on the detector labels c det. f is sparse and linear, with the number of effective concepts held fixed. The data: images and class labels, plus a detector.  

## 49:22.10  s25  Classification by description

`49:22.50`  The last step on the ladder removes training altogether. Menon and Vondrick call it classification by description.  
`49:29.83`  The intuition is a checklist. A language model writes a short checklist for every class. CLIP ticks each item softly, with a score for how well the photo matches it. The class with the best average tick wins.  
`49:42.73`  A language model writes a few descriptors for every class: short phrases about what the class looks like. For a herring gull: a white body with black wingtips, a yellow beak and legs, a red spot on its beak.  
`49:55.48`  CLIP scores the image against each descriptor: that score is the soft tick. The class score is simply the average of its descriptors' scores, and the highest average wins.  
`50:06.62`  Where does a score come from? CLIP has two encoders. One, phi, turns the image into a vector; the other, psi, turns the descriptor into a vector in the same space. The score is the cosine similarity of the two: near one when they point the same way, smaller when they do not.  
`50:23.38`  Then y hat k, the score of class k, averages the descriptor scores over D k, the class's list of descriptors. Nothing is fitted to the target data.  
`50:33.46`  Every prediction comes with its reasons: the descriptor scores that were averaged. On our gull photograph, the five herring gull descriptors score between 0.32 and 0.34, and their average is about 0.33.  
`50:47.57`  But the slaty-backed gull's descriptors average slightly higher, so it edges ahead by a tiny margin. Our photo shows a herring gull, so this prediction is a near miss.  
`50:58.83`  On all of CUB, the descriptors help only slightly over plain class names, where CLIP compares the photo with the species name alone: in our run, 53.1 percent against 52.9.  
`51:11.77`  So when is this attractive? When you have no labelled images at all. And a new class needs only a new description: write its checklist, and it can be scored at once, with no retraining.  
`51:23.30`  But the descriptors themselves can be wrong: the language model says a California gull has a black head, which it does not.  
`51:32.02`  That is one of several risks. A descriptor can also be non-visual: no single photo shows a bird's wingspan. It can describe the setting rather than the bird. And nobody checks the ticks: CLIP gives every item some score, true or not.  
`51:46.82`  Compared with LaBo, the head is no longer learned. LaBo trained a linear layer on CLIP's sentence scores; here the class score is a fixed average, so nothing is trained and no labelled image is needed.  
`51:58.98`  In symbols: g is CLIP, c hat d is the similarity to descriptor d, and f is a fixed average over each class's descriptors. The data: none. The cost: nothing guarantees that the descriptors are correct, or grounded.  

## 52:16.67  s19  Comparing the variants

`52:17.07`  Six variants are a lot to hold in mind at once. This table puts them beside the original CBM, one row per method, and we fill it one column at a time.  
`52:26.92`  The first column is the data needed for training. Here x is an image, c its concept labels, and y its class label. Supervised CBMs and concept embedding models need all three.  
`52:40.72`  Post-hoc models, label-free models, LaBo and VLG-CBM drop the concept labels. Classification by description, CBD in the table, needs no training data at all.  
`52:52.81`  The second column says who supplies the concepts. For CBMs and concept embedding models, people do, through their labels. The others take them from a concept bank, a language model, CLIP, or a detector.  
`53:05.53`  The third column is what the task head actually reads. A CBM passes one number per concept, a concept embedding model a vector per concept, and a post-hoc model its projection scores plus a residual. Label-free models and VLG-CBM pass the outputs of a learned concept layer, and LaBo and classification by description pass raw CLIP scores.  
`53:26.29`  The last column is what gets trained. CBMs and concept embedding models train the concept predictor and the head. Post-hoc models and LaBo train only the head. Label-free models and VLG-CBM train a concept layer and the head. Classification by description trains nothing at all.  
`53:45.21`  Each change makes concepts cheaper or predictions more accurate. None makes grounding automatic. A phrase from a language model, or a CLIP similarity, does not show that the model sees that property in the image. That has to be checked.  
`54:01.13`  One question sums up the table: who supplies the concepts, and who checks them? In CBMs and concept embedding models, people label the concepts, so people check them. In post-hoc models, a concept bank supplies them, checked only by whoever built it. Label-free models and LaBo take them from a language model, and only a CLIP similarity checks them. VLG-CBM keeps the language model, and adds a detector as the check. In classification by description, nobody checks.  
`54:32.71`  This is the general trade-off. Each rung up the ladder removes a human labour cost, and with it a human check. The labour saved on labelling has to be spent later, on checking that the concepts are really in the image.  

## 54:46.73  s11  How should we evaluate a CBM?

`54:47.13`  How should we judge such a model? Accuracy alone hides most of what matters, so we ask four separate questions, each about a different part of the model.  
`54:56.82`  First, task accuracy: are the predictions correct? In everyday terms, is the final answer right? Measure it on held-out test images, images the model never saw during training.  
`55:07.64`  The formula only counts. The bracket is 1 when the prediction matches the true label, and 0 when it does not. Add up the ones and divide by the number of images. Three predictions with two right give an accuracy of two thirds.  
`55:22.84`  Second, concept accuracy: are the concept estimates correct? In everyday terms, did the model read the evidence correctly? Take one test image, a small red square. Round each concept score to 0 or 1, and compare it with the label. Large scores 0.78, which rounds to 1, but the square is small, so its label is 0. Four of the five match. Concept accuracy averages these matches over all images and all concepts.  
`55:49.69`  The second question has a second half, grounding: does each estimate rest on the intended evidence? A score for wingtip black should come from the wingtip, not from the water. So we also check where the detector looks.  
`56:03.14`  Third, faithfulness: does the output actually depend on the concepts, in the way the model claims? An explanation is faithful when it tells the truth about how the answer was made. To test it, change a concept and check that the output moves as the head says. In the gull head from Part 2, setting wingtip black to 1 lifts herring gull from 0.29 to 0.91.  
`56:26.09`  Fourth, intervention utility: when a person corrects a concept, do decisions improve, and at what human cost? Correct concepts one at a time, and plot accuracy against the number of corrections. Each correction costs a person's time, so a curve that rises early is better.  
`56:44.56`  Here is a real experiment where we know every true concept. The images are synthetic, 64 by 64 pixels: each shape is red or blue, a circle or a square, small or large. Two colours, two shapes and two sizes give eight classes. Five yes-or-no concepts describe each image: red, blue, circle, square and large. Together they fully determine the class.  
`57:09.48`  Three models share the same small CNN, the same data, and the same training budget of 60 epochs, that is, 60 passes through the 768 training images. The black box predicts the class directly. The multi-task model also predicts the concepts, with a concept head beside its class head. The strict CBM predicts the concepts first, and its head reads only those five values.  
`57:31.69`  Each bar is the share of the 512 test images classified correctly: 78.7 percent for the black box, 82.0 for multi-task, and 81.6 for the strict CBM. On this question alone, the three look about the same.  
`57:47.66`  Over all images and all five concepts, the strict CBM gets 92.4 percent of its concept values right. The bars on the left split this by concept. Colour is always right, and shape is hardest, at about 84 percent for circle and 83 for square.  
`58:05.08`  Back to our test image, the small red square. Its concept large reads 0.78, so the model believes the square is large, and the head predicts large red square. A person sets large to 0, and the same head now predicts small red square, the true class.  
`58:22.75`  Now do this for every test image. The true labels play a perfect expert, which we call an oracle. It fixes the concept with the largest error first. For our square, that is large, which is 0.78 away from its label of 0.  
`58:37.28`  On this chart, the horizontal axis counts corrections per image, from 0 to 5, and the vertical axis shows task accuracy, starting at 80 percent. One oracle correction lifts accuracy from 81.6 to 97.3 percent. With all five corrected, it reaches 100.  
`58:56.89`  Now pick the concept to correct at random instead. The dashed line rises more slowly: 87.3 percent after one correction, averaged over 32 random orders. A random pick often fixes a concept that was already right, as four of the five were for our square. The shaded band spans the lowest and highest of the 32 runs.  
`59:18.26`  Now the multi-task model. Edit its concept head, and its class scores stay exactly the same, because its class head never reads the concepts.  
`59:28.07`  Read these numbers with care: one training seed, meaning a single training run, 512 synthetic test images, and corrections taken from the true labels, standing in for a perfect, effortless expert. Real experts make mistakes, and their time is costly.  
`59:44.24`  The three models have similar accuracy, yet they differ completely in intervention utility. Each metric measures a different property.  
`59:53.17`  Why can similar accuracy hide such different behaviour? Accuracy marks only the final answer, not the route to it. The multi-task model's class head never reads its concept estimates, so fixing one is like correcting a note that nobody reads. In the strict CBM, the concepts are the only road to the answer, so a fix reaches the prediction.  

## 60:14.50  s12  Beyond images

`60:14.90`  So far our inputs were photographs of birds. Concept bottlenecks fit wherever experts already reason with named findings, the things they check and write down by name.  
`60:26.10`  In medicine, Koh and colleagues also trained a CBM on knee X-rays from the Osteoarthritis Initiative. The model first scores ten clinical findings, such as joint space narrowing and bone spurs, each on a small scale of its own. From those, the head predicts how severe the osteoarthritis is, on four levels from 0 to 3.  
`60:45.82`  A radiologist can correct a finding, and the grade is recomputed. Here, joint space narrowing goes from 1 to 2, and the grade goes from 2 to 3. Radiologists already write their reports in these terms.  
`61:00.62`  In language, the CEBaB benchmark annotates restaurant reviews with four concepts: food, service, ambiance and noise. In this review the food is praised and the service is criticised, while ambiance and noise are not mentioned. Text bottleneck models predict the star rating from those concept values, so you can see which aspect drove it. Reviewers already write this way.  
`61:23.41`  In intensive care, Wu and colleagues built concept bottlenecks on patients' time series, measurements recorded over time. The task is vasopressor onset: when a patient will need vasopressors, drugs that support blood pressure. The concepts are summaries learned without concept labels, close to how doctors already sum up a patient, in terms like illness severity and kidney function.  
`61:45.49`  In wearable sensing, X-CHAR explains a complex activity through the simpler activities it is made of, which a person can recognise in the sensor signal. In its nurse data, the simple activities include check vitals, collect blood and oral care. People already describe a complex activity as the simple steps it is made of.  
`62:05.55`  And in sleep staging, the concepts are the patterns that scorers already use, as in Part 6: spindles, K-complexes and slow waves. The head turns them into a sleep stage, such as stage two. Scorers already mark these patterns by hand, so each concept matches a mark they would make.  
`62:23.56`  The recipe is the same each time. Name the findings an expert checks, predict them from the raw signal, and let the decision depend on them alone.  

## 62:34.37  s13  An interpretable interface is not the end of the story

`62:34.77`  Readable concepts in the middle do not guarantee a good model. Let us follow the path from the photo x, through the concept scores c hat, to the answer y hat, and ask what can fail at each of five points.  
`62:49.70`  First, distribution shift: the encoder meets data unlike its training data. In symbols, new inputs come from a different distribution than the training inputs. Recall the chest X-ray model from Part 1.  
`63:02.50`  Its AUC, a score where 1 means perfect ranking and 0.5 means guessing, was about 0.93 on X-rays from the hospitals it learned from, and about 0.82 at a new hospital. In practice, the model looks fine where it was built and does worse at the new site.  
`63:20.01`  Second, wrong grounding: the concept detector responds to the wrong evidence, such as the water behind a gull instead of its wingtip. In practice, the score looks right for the wrong reason, until a gull turns up away from water.  
`63:34.43`  Third, missing information: the vocabulary leaves out what the task needs. In Part 8, a blue circle and a blue square shared one concept vector, so the best any head could do was guess, right half the time. In practice, two cases an expert would tell apart look identical to the head.  
`63:52.39`  Fourth, the task head can learn the wrong relationship. Recall the billing head from Part 7: it takes away 2 for each unit of duplicate charge, the wrong sign. A correct edit sets duplicate charge to 1, and billing falls from 0.80 to 0.45. In practice, the expert's fix is right, yet the decision moves the wrong way.  
`64:14.16`  Fifth, the intervention can be wrong, or too costly. On this chart from Part 11, each step to the right is one more correction per image, and each correction takes an expert's time. Ours came from true labels, an expert who never errs. In practice, a busy expert can misjudge a concept too, and every check uses time they could spend elsewhere.  
`64:34.95`  So ask five questions of any concept bottleneck. Are the concepts meaningful? Are they grounded correctly? Are they sufficient for the task? Does the model actually use them? And do corrections improve decisions?  
`64:51.20`  Knab and colleagues' 2026 survey organises the field around the same parts: the input, the concepts, the output and the training. It lists these issues among its open challenges.  

## 65:04.80  s14  Final replay

`65:05.20`  One last time, the gull. A black box maps the photograph straight to a species.  
`65:11.31`  Open it up. Input. Encoder. Concept predictor. Named concepts. Task head. Prediction.  
`65:18.84`  A person sees that the wingtips are black and corrects that concept. The head now says American herring gull, at 0.91.  
`65:28.29`  But the interface is only as good as its parts: the concepts it names, where they look, and the head that reads them. A concept may be missing, a detector may look at the water, and a head may hold a wrong rule.  
`65:42.76`  In short, concept bottleneck models put named values that people can read in the middle of a prediction. Those values can be inspected, evaluated, and sometimes corrected.  
`65:54.24`  The challenge is to make sure the interface faithfully represents the information on which the prediction depends. Put simply, whatever the answer uses should be visible in the concepts.  
`66:06.75`  Four things to remember. Post-hoc methods explain a model after the fact, while a concept bottleneck makes the answer pass through named concepts. Fixing a concept helps only if the head reads it the right way. A soft score can carry more than its name says, and that extra information leaks to the head. And newer variants find concepts with fewer labels, so check that each one looks at the right evidence.  

## 66:32.77  end  End card

`66:33.17`  Concept Bottleneck Models. Predicting through interpretable concepts.  
