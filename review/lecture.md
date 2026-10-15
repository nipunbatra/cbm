# Concept Bottleneck Models: the lecture

Generated from narration/order.txt and narration/scenes/*.txt. Each numbered item is one slide step: its heading as
shown on the slide, then the narration (the film voice and the deck's speaker notes).

## Title  (s00)

1. 
   Concept Bottleneck Models. From black-box predictions to interpretable, editable concepts.

## The black box  (s01)

1. **Can a person inspect, and correct, the evidence a network used?**  
   A neural network makes a prediction. How can a person inspect, and correct, the intermediate evidence it used?

2. **A real photograph and a real model, CLIP**  
   Here is a photograph of a gull, and a real model, CLIP.

3. **CLIP compares the photo with one sentence per species**  
   It is asked to choose among six gull species, by comparing the image with a short description of each.

4. **The photo goes in, a score for every species comes out**  
   Image in, an encoder, and a score for every species. It prefers American herring gull, with a softmax share of 0.54. Glaucous-winged gull comes second, at 0.21.

5. **The answer is right. What made the model prefer it?**  
   The answer happens to be right. But what made the model prefer it?

6. **Occlusion: grey out one patch, measure the score drop**  
   A common response is a heatmap. This one is computed: we grey out one patch of the photograph at a time, and measure how much the herring gull score drops.

7. **The largest drops sit on the bill and the head**  
   The largest drops sit on the bill and the head.

8. **Which property did the model recognise there?**  
   So what did the model recognise there? The yellow bill? The red spot near its tip? The shape of the head? Or the blue water just behind it?

9. **The map shows where the score is sensitive, not which property**  
   The map marks where the score is sensitive. It does not say which property the model detected, and it gives a person nothing specific to correct.

10. **What we want: evidence stated as named properties**  
   Suppose instead the model had to state its evidence as named properties: wingtip colour, bill shape, head colour. Each claim could then be checked.

## Post-hoc or interpretable by design?  (s21)

1. **Two routes: explain a model afterwards, or build one you can read**  
   There are two ways to get an explanation from a model. You can train a black box and explain it afterwards, which is called post-hoc. Or you can build the model so that its reasoning can be read from the start, which is called ante-hoc, or interpretable by design.

2. **Post-hoc: a method explains a trained model on one input**  
   Start with post-hoc. The model f is already trained. An explanation method takes the model and one input, and returns some evidence about the prediction.

3. **Saliency: how much does each pixel move the class score?**  
   One family asks which pixels mattered. A saliency map takes the gradient of the class score with respect to each pixel: how much the score would change if that pixel changed.

4. **Occlusion: grey out a patch and measure how far the score drops**  
   A second family changes the input. Grey out one patch, run the model again, and measure how much the score drops. That is the occlusion map we computed for the gull in Part 1.

5. **TCAV: find the direction that separates stripes from no stripes**  
   A third family asks about concepts. Testing with concept activation vectors, or TCAV, collects images with stripes and images without, and finds the direction v in the network's activations that separates them.

6. **TCAV score: how often the zebra score rises along stripes**  
   It then checks how often the zebra score rises when an activation moves along that direction. If it rises for most zebra images, the model is sensitive to stripes.

7. **Limit 1: a map can look convincing without reflecting the model**  
   These methods are useful, and they have limits. First, an explanation can look convincing without reflecting the model. Adebayo and colleagues randomised the weights of a trained network, and some saliency methods still produced almost the same maps.

8. **Limit 2: an explanation can expose a shortcut, but it cannot remove it**  
   Second, an explanation can expose a shortcut, but it cannot remove it. A pneumonia detector for chest X-rays learned to recognise which hospital an image came from, and it did worse at a new hospital. Fixing that meant new data and retraining.

9. **Limit 3: the map speaks in pixels, an expert speaks in findings**  
   Third, the explanation speaks in pixels, while an expert speaks in findings: a narrowed joint space, a bone spur, black wingtips. Even when the expert spots the mistake, there is nothing inside the model to correct.

10. **Ante-hoc: the prediction is computed from quantities a person can read**  
   Ante-hoc models take the other route. The prediction is computed from quantities a person can read. A sparse linear model on named features is one example. A short decision tree is another. Prototype networks compare parts of an image with stored example parts.

11. **The case for models that are interpretable by design**  
   Rudin argued that for high-stakes decisions we should prefer models like these over black boxes explained afterwards.

12. **A concept bottleneck predicts concepts first, then the answer**  
   A concept bottleneck model is an ante-hoc model for deep networks. First, predict named properties of the photo, its concepts. Then predict the answer from those concepts alone.

13. **The same path in symbols**  
   In symbols: x is the input, c hat is the vector of predicted concepts, and y hat is the prediction. A concept predictor, g, maps x to c hat. A task head, f, maps c hat to y hat.

## Introducing the concept bottleneck  (s02)

1. **Here is that idea on a real photograph**  
   Here is that idea on a real photograph, with numbers small enough to follow. Between the image and the answer, we insert a layer of named variables.

2. **A concept predictor fills the layer, a task head reads it**  
   A concept predictor, g theta, maps the image to a vector of concept values, c hat. A task head, f phi, maps those values to the prediction, y hat.

3. **The concept vector has five named entries**  
   Here the concepts are wingtip grey, wingtip black, bill pointed, head white, and tail rounded. Each receives a value between 0 and 1.

4. **The rule: the task head reads only these five numbers**  
   The essential rule: the task head receives only these five numbers. No other path from the image reaches it. That narrow interface is the bottleneck.

5. **A strict CBM predicts the concepts first, then the answer from them alone**  
   A black box maps the image straight to an answer. A strict concept bottleneck model, or CBM, first predicts the concepts, then predicts the task from the concepts alone.

6. **The values and the head on these slides are written by hand**  
   These concept values and this head are written by hand, for teaching.

7. **The model believes the wingtips are grey, so it says glaucous-winged gull**  
   This model believes the wingtips are grey, at 0.8, and black, at only 0.2. So it ranks glaucous-winged gull first, 0.71 against 0.29.

8. **The wingtips are black: an observer corrects the wing colour**  
   Look at the photograph: the wingtips are black. An observer corrects the wing colour concepts. Grey becomes 0, and black becomes 1.

9. **The same task head recomputes, and herring gull now leads**  
   The task head is unchanged. It simply recomputes, and American herring gull now receives 0.91.

10. **An edited belief, a new prediction**  
   A person edited an intermediate belief, and the prediction followed.

11. **Multi-task learning puts a concept head beside the class head**  
   Compare multi-task learning, where a concept head sits beside the class head.

12. **There, an edit to the concepts changes nothing**  
   Editing that concept output changes nothing, because the class head never reads it.

13. **In a CBM, the concepts lie on the path to the prediction**  
   In a concept bottleneck, the concepts lie on the path to the prediction.

## The CUB benchmark  (s22)

1. **The standard benchmark for concept bottlenecks is a bird dataset**  
   The gull is not a random choice. The standard benchmark for concept bottlenecks is a bird dataset: Caltech-UCSD Birds, or CUB.

2. **Many photographs of many similar species**  
   It has 11,788 photographs of 200 species. Eight of the species are gulls.

3. **Every photograph is described by the same attributes**  
   People annotated every photograph with 312 yes-or-no attributes, in 28 groups: bill shape, wing colour, wing pattern, eye colour, and so on.

4. **Each attribute is a yes-or-no question**  
   Each attribute is a question with a yes or no answer. Does this bird have a hooked bill? Is its wing grey? Yes is a one, and no is a zero.

5. **Annotators also recorded how sure they were**  
   Annotators also recorded how sure they were: definitely, probably, guessing, or not visible. About one label in ten is not visible.

6. **Single photos are noisy: take a vote within each species**  
   Labels on single photos are noisy, so Koh and colleagues took a majority vote within each species. After the vote, every photo of a herring gull has the same labels.

7. **Keep only the attributes that many species share**  
   They then kept the 112 attributes that are present in at least ten species.

8. **One training record has three parts**  
   One training record is a photograph, 112 zeros and ones, and a species.

9. **The same record in symbols**  
   In symbols, the concept labels c form a vector with 112 entries, each zero or one, and the label y is one of 200 species. The model predicts c hat, a value between zero and one for each concept.

## What is a concept?  (s03)

1. **A concept is a claim that a person can check**  
   Let us slow down. What exactly is a concept? It is more than a neuron with a name attached: it is a promise that a person can check the claim in the input.

2. **Meaning: a definition that an expert can apply**  
   Three things must be in place. The first is meaning: a definition that a domain expert can apply. For example, grey wingtip: the tips of the folded flight feathers are grey, not black.

3. **Grounding: the evidence sits in one region of the photo**  
   The second is grounding: where in the input is the evidence? For wingtip colour, it is this region. The estimate should depend on these feathers, and not on the water or the rock.

4. **Representation: the simplest concept is binary**  
   The third is representation: how the concept becomes a number. The simplest is binary: c j is zero or one.

5. **A soft concept turns a logit into a value between 0 and 1**  
   A soft concept passes a logit, z, through the sigmoid, giving a value between zero and one. A logit of 1.4 gives 0.80.

6. **A soft score is not automatically a probability**  
   A soft score of 0.8 is not automatically a calibrated probability. Whether eighty percent of such cases really have grey wingtips has to be checked on data.

7. **Categorical: one value from a list, with scores that sum to 1**  
   Some concepts are categorical. Wing colour takes one value from a list, so its scores form a softmax over the options, and they sum to one.

8. **Continuous: a measurement, such as bill length**  
   Others are continuous, such as bill length in millimetres, predicted by regression.

9. **Richer concepts: a vector or a whole distribution**  
   Richer models give each concept a vector, an embedding, or a whole probability distribution. We will meet these in Part 10.

10. **Unknown: not visible is different from absent**  
   And sometimes the evidence is missing. In CUB, a wingtip hidden behind a rock is labelled not visible. Unknown is not the same as absent, and the representation should be able to say so.

11. **Six ways to store a concept as a number**  
   So a concept can be stored in six ways: binary, soft, categorical, continuous, a vector or distribution, and unknown.

12. **The same pattern in a sleep EEG recording**  
   The same pattern applies across sensors. In a sleep EEG recording, a concept might be: sleep spindle present.

13. **A spindle is a brief burst of brain waves**  
   A spindle is a brief burst of brain waves, about 11 to 16 cycles per second, lasting roughly half a second to two seconds. Sleep scorers treat spindles as a sign of stage two sleep.

14. **The same pattern in a customer message**  
   In a customer message, a concept might be: duplicate charge reported, meaning the customer says one purchase was billed twice.

15. **Each concept is a named claim that a specialist can check**  
   Each is a named claim about the input that a specialist could check.

## From concepts to predictions: the arithmetic  (s04)

1. **After the concepts, the task head is arithmetic you can do by hand**  
   How do concept values become an answer? In the simplest case, the task head is arithmetic small enough to do by hand.

2. **Three classes and three concepts**  
   Three classes: zebra, horse, and giraffe. Three concepts: stripes, horse-like shape, and long neck.

3. **The concept vector ĉ holds one value per concept**  
   Given this low-contrast photograph, the concept predictor reports stripes 0.1, horse-like shape 0.9, and long neck 0.1. Stacked in a column, they form the concept vector, c hat.

4. **The task head keeps one row of weights for each class**  
   The task head is a weight matrix, W, with one row per class. The zebra row holds 3 for stripes, 1 for horse-like shape, and 0 for long neck.

5. **The full weight matrix W: rows are classes, columns are concepts**  
   With all three rows: stripes count toward zebra, a long neck toward giraffe, and horse-like shape mostly toward horse.

6. **A class score is one row of weights times the concept values**  
   To score zebra, multiply each weight by its concept value, and add. 3 times 0.1 is 0.3, 1 times 0.9 is 0.9, and 0 times 0.1 is 0. Zebra scores 1.2.

7. **Every row gives one score: s = Wĉ**  
   Horse: minus 0.1, plus 1.8, minus 0.1, giving 1.6. Giraffe: minus 0.1, plus 0, plus 0.3, giving 0.2. These are the class scores, or logits.

8. **The largest score wins, and a softmax turns scores into shares**  
   The largest score is 1.6, so the model says horse. A softmax turns the scores into shares that sum to one: horse gets about 0.52.

9. **A person edits one concept value: stripes 0.1 to 1**  
   Now an observer looks at the image and sees stripes. They change one coordinate: stripes, from 0.1 to 1.

10. **Same matrix, new concept vector: recompute the scores**  
   Recompute with the same matrix. Zebra: 3, plus 0.9, plus 0, which gives 3.9. Horse: minus 1, plus 1.8, minus 0.1, giving 0.7. Giraffe: minus 1, plus 0, plus 0.3, giving minus 0.7.

11. **After the edit, zebra leads**  
   After the softmax, zebra leads, with a share of about 0.95.

12. **The scores moved by 0.9 times the stripes column of W**  
   The image did not change, and neither did the matrix. Each concept value scales its own column of W. Only stripes moved, by 0.9, so the scores moved by 0.9 times the stripes column: plus 2.7 for zebra, and minus 0.9 for the other two.

13. **A person corrected a belief of the model, and nothing was retrained**  
   A person has corrected an intermediate belief, without retraining anything.

## How does the model learn the concepts?  (s05)

1. **Where do the concept values come from?**  
   So far the concept values were given. Where do they come from? The concept predictor learns them from labelled examples.

2. **Each training example carries three things**  
   Each training example carries three things: an input x i, concept labels c i, and a task label y i. For a herring gull in CUB: the photo, zeros and ones, and the species.

3. **The concept loss compares each predicted concept with its label**  
   The concept loss, L c, compares the predicted concepts with the labels: typically a binary cross-entropy for each concept, averaged.

4. **One term of the concept loss, worked out**  
   One term: grey wing has label 1; suppose the predictor says 0.8. The term is minus log 0.8, about 0.22. Closer to 1 costs less.

5. **The task loss compares the prediction with the task label**  
   The task loss, L y, is typically a cross-entropy over the classes: minus the log of the share given to the correct class.

6. **A weighted sum combines the two losses**  
   A weighted sum combines the two; lambda c and lambda y set how much each counts.

7. **Three ways to train the concept predictor and the task head**  
   Koh and colleagues compared three ways to train.

8. **Independent: each part is trained on its own labels**  
   Independent: fit the predictor to the concept labels, and separately fit the head on the true concepts. At test time, though, the head receives predicted concepts.

9. **Sequential: freeze the predictor, then train the head on its outputs**  
   Sequential: fit the predictor, freeze it, then fit the head on the concepts it predicts. The head learns from the predictor's actual mistakes.

10. **Joint: train the whole system at once, with both losses**  
   Joint: train the whole system at once, with both losses.

11. **In joint training, the task loss also shapes the concept predictor**  
   In joint training, the task loss sends its gradient back through the head and the concept values into the predictor, which is then shaped by what helps the task.

12. **A concept score can be pulled two ways**  
   That can improve task accuracy. It can also hurt concept fidelity, if a concept score drifts toward whatever helps the classifier. That has to be measured.

13. **Our measured run: joint training, λ_c = 2, λ_y = 1**  
   The experiment we will meet later used joint training, with the concept loss weighted 2 and the task loss weighted 1.

## The three schemes on CUB  (s23)

1. **Does the training scheme matter on real photographs?**  
   Part 5 described three training schemes. Does the choice matter on real photographs? We ran a small version on CUB.

2. **Our setup: frozen CLIP features → 112 concepts → 200 species**  
   Each photo goes through a frozen CLIP image encoder, giving 512 features. A linear concept predictor maps them to 112 concepts, and a linear task head maps those to 200 species.

3. **One photo through the model: features, then concepts, then species**  
   For our gull photo, the predictor is sure the throat is white and the wings are grey. The head spreads its probability over several gull species.

4. **Joint training is the most accurate, independent the least**  
   Joint training is the most accurate, close to a standard model with no bottleneck. Sequential falls in between, and independent training is the least accurate.

5. **An intervention replaces predicted values with true values**  
   Now intervene. Pick a few attribute groups, replace their predicted values with the true values, and let the same head recompute.

6. **As more groups are corrected, the independent model gains most**  
   The independent model improves fastest. Its head was trained on true concepts, so it trusts corrected ones. The joint model improves least.

7. **Why joint gains least: its head reads detail in the soft scores**  
   Its head learned to read fine detail in the soft scores, beyond what the concepts mean, so a corrected value helps it less. We will meet this again as leakage.

8. **Fully trained networks show the same pattern**  
   Koh and colleagues report the same pattern with fully trained networks.

## Human interventions  (s06)

1. **A person can fix a concept the model got wrong**  
   Concepts are useful because a person can check them. When the model gets one wrong, someone who can see the mistake can correct it, with no retraining.

2. **An intervention has four steps**  
   An intervention has four steps. The model predicts concept values. A person checks one and corrects it. The fixed task head recomputes. A new prediction comes out.

3. **Wing colour is one group: correct it together**  
   Back to the gull. Wing colour is a categorical concept, so the observer corrects the group together: grey to 0, black to 1.

4. **Changing only one value could leave an impossible state**  
   Changing only one of them could leave an impossible state, with both colours on, or neither.

5. **Same head, new values: herring gull rises**  
   The head's score for American herring gull moves from 0.29 to 0.91.

6. **The same mechanism works on a signal**  
   The same mechanism works on a signal. Here is a schematic EEG trace, drawn for teaching rather than recorded from a patient. Near the middle is a short burst at about 13 hertz, the shape of a sleep spindle.

7. **The concept predictor gives spindle a low value**  
   The concept predictor gives spindle present only 0.12. K-complex present gets 0.8, and slow-wave dominance 0.15.

8. **An illustrative stage head favours other stage**  
   With these values, an illustrative stage head favours other stage, at 0.62, over an N2 candidate, at 0.38.

9. **A sleep expert marks the spindle as present**  
   A sleep expert inspects the trace and marks the spindle as present. 0.12 becomes 1.

10. **Same head, new input: N2 candidate rises**  
   Same head, new input. The N2 candidate rises to 0.86.

11. **A demonstration of the mechanism, not a clinical result**  
   This demonstrates the mechanism, not a clinical result. Real sleep staging applies scoring rules to thirty-second epochs, and this head was written by hand.

## A correct edit can still hurt  (s07)

1. **Does a correct edit always help?**  
   So far, every correction has helped. Does a correct edit always help? Here is a case where it does not.

2. **A support message that belongs in billing**  
   A support message reads: The app works, but I was charged twice. Please refund the extra payment. It belongs in the billing queue.

3. **The concept predictor reads two concepts from the message**  
   The concept predictor rates duplicate charge at only 0.2, and refund requested at 1.

4. **The task head, in words**  
   The task head computes a billing score. It starts at 1.2, takes away 2 for each unit of duplicate charge, and adds 0.6 for each unit of refund requested.

5. **The same head in symbols**  
   In symbols, the score s is 1.2, minus 2 times duplicate charge, plus 0.6 times refund requested. A sigmoid turns that score into the billing share.

6. **Before the edit, the message goes to billing**  
   Before any edit, the score is 1.2, minus 0.4, plus 0.6, which gives 1.4. Billing receives 0.80, so the message is already routed correctly.

7. **A reviewer correctly sets duplicate charge to 1**  
   A reviewer reads the message and correctly sets duplicate charge to 1.

8. **After the edit, the message leaves billing**  
   Now the score is 1.2, minus 2, plus 0.6, which gives minus 0.2. Billing falls to 0.45, and the message goes to general support.

9. **The fault is in the head: a weight with the wrong sign**  
   The edit was correct. The fault lies downstream: this head learned a negative weight for duplicate charge, the wrong sign for billing.

10. **Correcting a concept does not repair the decision rule**  
   Correcting a concept does not repair an incorrect decision rule. An intervention is only as good as the head that receives it, so its effect has to be measured rather than assumed.

11. **A constructed case: the failure can happen**  
   This head was built faulty on purpose, to show that the failure can happen. It says nothing about how often it does.

## What if the concepts are incomplete?  (s08)

1. **The bottleneck can pass on only what the vocabulary names**  
   A second limit sits in the vocabulary itself: the bottleneck passes on only what we chose to name.

2. **Two objects from two different classes**  
   Take two objects, a blue circle and a blue square. They belong to different classes.

3. **The vocabulary names only colour and size**  
   Suppose the concept vocabulary has only two entries: colour and size. Both objects are blue. Both are small.

4. **Both objects get the same concept vector**  
   So both map to exactly the same concept vector. c of x 1 equals c of x 2, and yet y 1 differs from y 2.

5. **Shape never reaches the task head**  
   Watch what reaches the task head. Shape was present in the image. At the bottleneck, it disappears.

6. **The same input to the head gives the same output**  
   Any task head that reads only this vector must give both objects the same output. No head, linear or a large neural network, can recover a distinction that never reached it.

7. **The best possible accuracy is one half**  
   On these two examples, the best possible accuracy is fifty percent.

8. **Sufficiency: the concepts say all the input says about the label**  
   The ideal property is called sufficiency. Once the concepts are known, the input says nothing more about the label.

9. **Sufficiency in symbols**  
   In symbols: Y is independent of X, given C. Here it fails: the label depends on shape, which C lacks.

10. **A strict CBM guarantees something weaker**  
   A strict CBM guarantees something weaker. Its own prediction depends on the input only through the concepts. Whether the true label does is a property of the chosen vocabulary.

11. **The fix is a richer vocabulary: add shape**  
   More accurate colour and size estimates would not help. The fix is a richer vocabulary: add shape. Now the two vectors differ.

## Concept leakage  (s09)

1. **What exactly travels through a concept value?**  
   Now a subtler problem. Each concept value is a single number on its way to the task head. What exactly does that number carry?

2. **Leakage: the value carries more than one answer, and the head uses it**  
   A concept value is meant to answer one question: is this concept present? Leakage is when the value carries more than that answer, and the task head uses the extra.

3. **Two zebras with the same binary label**  
   Here is a constructed example. One concept: stripes present. Two photographs, a plains zebra and a Grévy's zebra. Both genuinely have stripes, so both have the same binary label: stripes equals 1.

4. **A soft score is a number, not a bit**  
   A soft concept predictor outputs a number, not a bit. Suppose it gives plains zebras scores around 0.72, and Grévy's zebras, with their narrower and denser stripes, scores around 0.96.

5. **Same meaning, different values**  
   Both values lie above one half. Both mean stripes present. Yet the exact value now separates the two species.

6. **The head learns a threshold on the score**  
   A task head that must tell these zebras apart will learn to use that difference. A threshold near 0.84 separates them almost perfectly, while the binary concept alone leaves the head at chance.

7. **The stripes value also carries stripe density**  
   So the stripes channel also carries stripe density, a property that nobody named and nobody can inspect. That hidden part is the leakage.

8. **Correct a plains zebra's stripes value**  
   Leakage has a direct cost for interventions. Take a plains zebra and correct its stripes value to 1, which is its true value.

9. **A correct edit gives the wrong species**  
   The head learned that values above 0.84 mean Grévy's zebra. So the correct edit produces the wrong species. The person fixed the concept, but the head was reading the number.

10. **Implicit leakage hides inside a continuous score**  
   That was implicit leakage, hidden inside a continuous score. The extra information rides on the concept value itself.

11. **Explicit leakage takes a side path around the concepts**  
   There is also an explicit kind: a side path that carries latent features to the task head, around the concepts.

12. **With a side path, an edit no longer controls the head**  
   With a side path, an edit to a named concept no longer controls everything the head sees. A named bottleneck constrains routing. It does not, by itself, guarantee faithful reasoning.

13. **Not every variation in a score is leakage**  
   These score distributions were constructed for teaching. Ordinary variation in confidence is not leakage. Leakage means the extra information is systematic, and the head uses it.

## Leakage in a trained model  (s20)

1. **Does a real trained model leak?**  
   The zebra example was constructed. Does a real trained model leak too?

2. **The shape model has a size concept: large**  
   Take a small concept bottleneck trained on synthetic shapes, the experiment Part 11 examines in detail, and its size concept: large. Its label is binary: a radius of 14 pixels or more counts as large.

3. **The score for large rises smoothly with the true radius**  
   But the score the model outputs rises smoothly with the actual radius: about 0.09 at 12 pixels, 0.25 at 13, 0.63 at 14, and 0.87 at 15. So the score carries a graded version of the size itself, more than large or not large.

4. **Position and shade: the scores carry almost nothing**  
   We also asked whether the scores carry things that are not concepts at all, such as the shape's position or its shade. A simple linear probe recovers essentially nothing. Here the extra information is about the concept's own quantity, not an unrelated side channel.

5. **To look for leakage, probe the concept scores**  
   That is how to look for leakage: probe what the concept scores can predict beyond their labels. This is one small synthetic model, measured from its saved predictions.

6. **Remedy 1: hard concepts pass only 0 or 1**  
   How do people reduce leakage? Hard concepts pass only 0 or 1 to the head, so nothing extra can travel, at the cost of losing graded evidence.

7. **On CUB, hard concepts cost accuracy**  
   On our CUB run, a linear head trained on hard concepts gets about 53 percent of the test photos right; one trained on the soft scores gets 69 percent. Soft scores carry more than yes or no.

8. **Remedy 2: fit the head on true concepts**  
   Independent training fits the head on true binary concepts, so the head never learns to read hidden detail in the scores.

9. **Remedy 3: remove side paths, or report them**  
   Side paths can be removed, or reported clearly when they are added for accuracy.

10. **Above all, measure**  
   And above all, measure: probe the scores, and test whether interventions actually help on held-out data.

## Modern concept bottleneck architectures  (s10)

1. **Labelling every concept on every image is the main cost**  
   The original concept bottleneck needs a person to label every concept on every training image. That is its main cost, and most newer methods try to reduce it.

2. **One training record: an image, its concept labels and a class**  
   One supervised training record looks like this: the image, a 0 or 1 for each named concept, and the class. On CUB, that meant 112 concept labels per photograph.

3. **Rung one: images, concept labels and classes**  
   The newer methods form a ladder of shrinking supervision. On the first rung, CBMs and concept embedding models need the image, the concept labels and the class.

4. **Rung two: drop the concept labels**  
   Post-hoc and label-free models drop the concept labels.

5. **Rung three: drop training altogether**  
   Classification by description drops training altogether.

6. **A variant can change four things**  
   Newer variants change four things: where the concepts come from, how each concept is detected, how it is represented, and what reaches the task head.

7. **One running example: photographs of zebras, horses and giraffes**  
   We will walk through them on one running example: photographs of zebras, horses and giraffes, the classes from Part 4. We train on 24 photos and test on 12.

8. **For each variant: how the path from image to concepts to class changes**  
   For each variant, we write down how the path from x, to c, to y changes.

## Concept embedding models  (s15)

1. **One number per concept is a narrow channel**  
   First, Concept Embedding Models. One number per concept is a narrow channel, and when the vocabulary is incomplete, accuracy suffers, as we saw in Part 8.

2. **Each concept gets two embeddings: active and inactive**  
   So each concept becomes a vector. From the image, the model computes two embeddings for every concept: one describing it as active, one as inactive.

3. **The model also predicts the probability p that the concept is present**  
   It also predicts the probability, p, that the concept is present.

4. **The concept embedding mixes the two, weighted by p**  
   The concept's embedding mixes the two: p times the active embedding, plus one minus p times the inactive one.

5. **With p = 0.1, the mixed vector sits close to inactive**  
   With p equal to 0.1 for stripes, the mixed vector sits close to inactive.

6. **The head reads all three mixed vectors and favours horse**  
   The head reads all three concepts, six numbers in all, and favours horse.

7. **To intervene, a person sets p**  
   To intervene, a person sets p, not the vector. Setting p to 1 swaps in the active embedding, and zebra now leads.

8. **Training with random interventions (RandInt)**  
   During training, CEM randomly replaces some predicted probabilities with their true values, about one concept in four, so the head learns to respond to corrections.

9. **Gain: a vector carries more than one number**  
   The gain is capacity: a vector can carry detail that one number cannot.

10. **Cost: the coordinates of the vector have no names**  
   The cost is readability: the coordinates of that vector have no names, so part of what the head uses cannot be inspected.

11. **Concept embedding models in symbols**  
   In symbols: g now outputs a probability and two embeddings for each concept. c hat j is the mixed vector, and f reads all of them. Training still needs images, concept labels and class labels.

## Post-hoc concept bottleneck models  (s16)

1. **Reuse a pretrained encoder; no concept labels needed**  
   Second, post-hoc concept bottleneck models. Instead of training a concept predictor from scratch, they reuse a pretrained encoder that already exists, so nobody labels concepts on the training images.

2. **A frozen image encoder turns each photo into 512 numbers**  
   Here the frozen encoder is CLIP's image encoder: each photograph becomes 512 numbers.

3. **A concept bank: eight phrases, each a direction**  
   A concept bank lists directions in the same space. With CLIP, a direction can come from text. We use eight phrases, from black and white stripes to a wooden fence.

4. **A concept score is a projection onto a direction**  
   A concept score is the projection of the image features onto each direction.

5. **For this zebra, stripes scores highest**  
   For this zebra photo, black and white stripes scores highest, 1.4 standard deviations above its average on the training photos.

6. **A sparse linear head is trained with the class labels**  
   A sparse linear head is then trained with the class labels, on 24 photos.

7. **Only 4 of 24 weights are non-zero**  
   Of 24 possible weights, only 4 are non-zero: zebra reads stripes, giraffe reads a long neck, and horse reads a flowing mane.

8. **The prediction for this photo: zebra**  
   For this zebra, the head gives zebra 0.77, and all 12 held-out photos are classified correctly, on this tiny example.

9. **Edit the stripes score, and zebra falls**  
   Lower the stripes score to its usual value on other animals, and zebra falls to 0.14.

10. **PCBM-h adds a residual that reads the raw features**  
   The hybrid version, PCBM-h, adds a residual: a second linear model that reads the raw features and recovers what the concepts miss.

11. **The residual is a side path that an edit cannot reach**  
   That residual is a side path. After the same edit, the hybrid still gives zebra 0.20 rather than 0.14, because part of its evidence never passed through a named concept.

12. **Post-hoc concept bottleneck models in symbols**  
   In symbols: g is a frozen encoder followed by a projection onto the concept directions. f is sparse and linear, plus a residual in the hybrid. Only f is trained, from images and class labels.

## Label-free concept bottleneck models  (s17)

1. **Concept labels are expensive: can a bottleneck do without them?**  
   A supervised bottleneck needs a person to label every concept on every photo, 112 of them for each bird in CUB. Label-free concept bottleneck models need no human concept labels. They work in five steps.

2. **Step 1: ask a language model about each class**  
   Step one: ask a language model, for each class, for its most important features, the things commonly seen around it, and its superclasses. Here is a real reply for zebra, as JSON.

3. **Three questions for three classes give 59 candidate concepts**  
   Three questions for each of three classes give 59 candidate concepts.

4. **Step 2: drop class names, duplicates and unseen phrases**  
   Step two: filter. Phrases that contain a class name go, such as zebras or horse-like body. Equine goes as a near-duplicate of equine animal. Leather saddle and ossicones on head go because they barely match these photos. 34 concepts remain.

5. **Step 3: CLIP scores every image against every concept**  
   Step three: CLIP scores every image against every remaining concept. These scores are targets, not labels from a person.

6. **Step 4: a linear layer maps features to concept activations**  
   Step four: a different frozen backbone, here a ResNet-50, gives 2048 features per image. A linear layer, W c, maps them to 34 concept activations.

7. **Train W_c so each activation rises and falls with its CLIP score**  
   W c is trained so that each activation rises and falls with its CLIP target across images. The match is a cosine between cubed, standardised scores, which stresses the images that score highest. This step needs no labels, so every unlabelled photo can help.

8. **Step 5: a sparse final layer keeps 6 of 102 weights**  
   Step five: a sparse final layer, trained with the class labels. Of 102 possible weights, 6 survive. Zebra reads black and white stripes. Giraffe reads extremely long neck. Horse reads muscular equine build and riding bridle, and safari vehicles counts against it.

9. **Three of the six concepts describe the setting**  
   Riding bridle, safari vehicles and wildebeest herds describe the setting, not the animal. The bottleneck is readable, and reading it reveals that the head uses context as evidence.

10. **Label-free is not unsupervised**  
   Label-free does not mean unsupervised: the language model, CLIP and the class labels all supervise it.

11. **LF-CBM in symbols**  
   In symbols: g is a frozen backbone and a learned projection, fitted to CLIP's scores with a cosine-cubed similarity. f is a sparse linear layer. The data: images and class labels, no concept labels.

## Language in a Bottle  (s18)

1. **LaBo keeps CLIP itself as the concept detector**  
   Label-free models train a projection to imitate CLIP. Fourth, LaBo, short for Language in a Bottle, asks a language model for concepts too, but keeps CLIP itself as the concept detector.

2. **Step 1: a language model describes each class in sentences**  
   Step one: the language model writes eight short sentences for each class, as JSON, here for zebra.

3. **Step 2: prefer sentences that match their own class best**  
   Step two: choose three sentences per class. A good sentence is discriminative: it matches its own class better than the other classes.

4. **A greedy rule balances discriminability and coverage**  
   It should also add coverage beyond the sentences already chosen. Each round, a greedy rule picks the best mix: 0.7 times discriminability plus 0.3 times coverage gain.

5. **The greedy picks for zebra, in order**  
   For zebra, bold black and white stripes is chosen first, then unique facial stripe patterns, then large striped ears.

6. **Three sentences per class, nine in all**  
   For horse, a long flowing mane leads. For giraffe, an extremely long vertical neck.

7. **Step 3: CLIP scores the image against each chosen sentence**  
   Step three: CLIP scores the image against the nine chosen sentences. Those nine numbers are the bottleneck.

8. **Step 4: a language prior links each class to its sentences**  
   Step four: a linear layer from sentences to classes, started from a language prior: each class gives weight only to its own sentences. With the prior alone, this zebra already gets 0.98, and 11 of the 12 test photos are right.

9. **Training with the class labels adjusts the weights**  
   Training with the class labels moves the weights a little, and then all 12 are right.

10. **Do the zebra sentences detect the ears, or stripes anywhere?**  
   Notice the zebra sentences: all three are about stripes. Is CLIP detecting striped ears, or stripes anywhere in the picture? The scores alone cannot tell.

11. **LaBo in symbols**  
   In symbols: g is CLIP itself, so c hat j is the similarity between the image and sentence j. f is a linear layer that starts from the language prior. The data: images and class labels.

## Grounding the concepts  (s24)

1. **Nothing checks that a concept is really in the image**  
   Label-free models and LaBo share a weakness: nothing checks that a concept is actually visible in the image.

2. **Three ways a concept can fail**  
   Concepts can fail in three ways. Some are not visual, such as a gull's call. Some describe the setting, not the bird. Some score highly on images that do not contain them.

3. **A head on random words does almost as well**  
   Srivastava and colleagues found that a head built on random words can reach similar accuracy. So the concept scores were carrying information that their names do not describe.

4. **VLG-CBM asks a detector to find each concept**  
   Their method, VLG-CBM, grounds the concepts first. An open-vocabulary object detector looks for each concept in each training image, and draws a box where it finds it.

5. **A box means 1, no box means 0**  
   A concept counts as present only where a box was found. For our gull, the bill, head and wingtips each get a one, and the call gets a zero.

6. **The grounded labels train the concept layer with a loss**  
   These grounded labels train the concept layer with a binary cross-entropy, as in the original CBM, but without a person drawing them.

7. **Count the non-zero weights in each class's row**  
   They also report the number of effective concepts: count the non-zero weights in each class's row of the head, then average over the classes.

8. **Five concepts per class can actually be read**  
   A head that uses five concepts per class can actually be read, so models are compared at the same count.

9. **VLG-CBM in symbols**  
   In symbols: g is a backbone with a concept layer trained on detector labels. f is sparse and linear, with the number of effective concepts held fixed. The data: images and class labels, plus a detector.

## Classification by description  (s25)

1. **The last rung: no training data at all**  
   The last step on the ladder removes training altogether. Menon and Vondrick call it classification by description.

2. **A language model describes every class**  
   A language model writes a few descriptors for every class. For a herring gull: a white body with black wingtips, a yellow beak and legs, a red spot on its beak.

3. **CLIP scores the photo against each descriptor**  
   CLIP scores the image against each descriptor. The class score is simply the average of its descriptors' scores, and the highest average wins.

4. **The same rule in symbols**  
   In symbols, each descriptor score is a cosine similarity between the image and the descriptor, and y hat k averages them over the class's descriptors. Nothing is fitted to the target data.

5. **Every score comes with its reasons**  
   Every prediction comes with its reasons: the descriptor scores that were averaged. On our gull photograph, the herring gull descriptors score well.

6. **Slaty-backed gull edges ahead**  
   But the slaty-backed gull edges ahead, by a tiny margin.

7. **On all of CUB, descriptors help only slightly**  
   On all of CUB, the descriptors help only slightly over plain class names.

8. **A descriptor can be wrong**  
   And the descriptors themselves can be wrong: the language model says a California gull has a black head, which it does not.

9. **Classification by description in symbols**  
   In symbols: g is CLIP, c hat d is the similarity to descriptor d, and f is a fixed average over each class's descriptors. The data: none. The cost: nothing guarantees that the descriptors are correct, or grounded.

## Comparing the variants  (s19)

1. **Side by side: the supervision each variant needs**  
   Side by side, start with the supervision each variant needs. Supervised CBMs and concept embedding models need images, concept labels and class labels.

2. **Most variants drop the concept labels**  
   Post-hoc models, label-free models, LaBo and VLG-CBM drop the concept labels. Classification by description needs no training data at all.

3. **Where the concepts come from instead**  
   Their concepts come from a concept bank, a language model, CLIP, or a detector.

4. **What reaches the task head**  
   What reaches the head differs too: scalars, vectors, scalars plus a residual, learned projections, or raw CLIP scores.

5. **What is trained**  
   And what is trained: the concept predictor and the head, only the head, or nothing at all.

6. **Naming a concept does not ground it**  
   Each change makes concepts cheaper or predictions more accurate. None makes grounding automatic. A phrase from a language model, or a CLIP similarity, does not show that the model sees that property in the image. That has to be checked.

## How should we evaluate a CBM?  (s11)

1. **Accuracy alone hides most of what a concept bottleneck promises**  
   How should we judge such a model? Accuracy alone hides most of what matters, so we ask four separate questions.

2. **Task accuracy: are the predictions correct?**  
   Task accuracy: are the predictions correct? Measure it on held-out test images.

3. **Concept accuracy and grounding: right concepts, right evidence?**  
   Concept accuracy and grounding: are the concept estimates correct, and do they rest on the intended evidence? Compare each concept with its label, and check where the detector looks.

4. **Faithfulness: does the output really depend on the concepts?**  
   Faithfulness: does the output actually depend on the declared concepts, in the way the interface claims? Change a concept, and check that the output moves as claimed.

5. **Intervention utility: do corrections help, and at what cost?**  
   Intervention utility: when a person corrects a concept, do decisions improve, and at what human cost? Correct concepts one at a time, and track accuracy per correction.

6. **A controlled test: synthetic shapes with known concepts**  
   Here is a real experiment. Synthetic 64 by 64 images: red or blue, circle or square, small or large. Eight classes, and five concepts that fully determine the class.

7. **Three models share one small CNN**  
   Three models share the same small CNN, data, and training budget. A black box. A multi-task model, whose concept head sits beside its class head. And a strict CBM.

8. **Task accuracy: the three models are close**  
   On 512 test images, task accuracy is 78.7 percent for the black box, 82.0 for multi-task, and 81.6 for the strict CBM.

9. **Concept accuracy: most concept values are right**  
   The strict CBM gets 92.4 percent of its individual concept values right.

10. **One edit to one concept changes the prediction**  
   Here is one test image: a small red square. Its size concept reads large, 0.78, so the model predicts large red square. Set size to 0, and the same head predicts small red square.

11. **Oracle corrections: fix the worst concept first**  
   Now correct one concept per image, the one with the largest error. Accuracy rises from 81.6 to 97.3 percent. With all five corrected, it reaches 100.

12. **Random corrections help more slowly**  
   Correcting concepts in random order rises more slowly: 87.3 percent after one correction, averaged over 32 random orders.

13. **In the multi-task model, a concept edit changes nothing**  
   For the multi-task model, editing its concept head leaves its class scores exactly unchanged.

14. **Read these numbers with care**  
   Read these numbers with care: one training seed, 512 synthetic test images, and corrections taken from the true labels, standing in for a perfect, effortless expert. Real experts make mistakes, and their time is costly.

15. **Similar accuracy, very different intervention utility**  
   The three models have similar accuracy, yet they differ completely in intervention utility. Each metric measures a different property.

## Beyond images  (s12)

1. **Where else do concept bottlenecks fit?**  
   Concept bottlenecks are not limited to photographs of birds. They fit wherever experts already reason with named findings.

2. **Medicine: a knee X-ray → clinical findings → a severity grade**  
   In medicine, Koh and colleagues also trained a CBM on knee X-rays from the Osteoarthritis Initiative. Ten clinical findings, such as joint space narrowing and bone spurs, predict the severity grade of osteoarthritis. A radiologist can correct a finding, and the grade is recomputed.

3. **Language: a review → four aspects → a star rating**  
   In language, the CEBaB benchmark annotates restaurant reviews with four concepts: food, service, ambiance and noise. Text bottleneck models predict the star rating from those concept values, so you can see which aspect drove it.

4. **Intensive care: vital signs → summary concepts → vasopressor onset**  
   In intensive care, Wu and colleagues built concept bottlenecks on patients' time series, to predict when a patient will need drugs to support blood pressure.

5. **Wearables: sensor signal → simple activities → complex activity**  
   In wearable sensing, X-CHAR explains a complex activity through the simpler activities it is made of, which a person can recognise in the sensor signal.

6. **Sleep: an EEG → the patterns scorers use → a sleep stage**  
   And in sleep staging, the concepts are the patterns that scorers already use: spindles, K-complexes and slow waves.

7. **One recipe in every domain**  
   The recipe is the same each time. Name the findings an expert checks, predict them from the raw signal, and let the decision depend on them alone.

## An interpretable interface is not the end of the story  (s13)

1. **Follow the path from photo to concepts to answer: what can fail?**  
   A readable middle can still be wrong. Let us ask what can fail at each stage, from x, to c hat, to y hat.

2. **1 · Encoder: distribution shift**  
   First, distribution shift: the encoder meets data unlike its training data, as the chest X-ray model in Part 1 did at a new hospital.

3. **2 · Concept detector: wrong grounding**  
   Second, wrong grounding: the concept detector responds to the wrong evidence, such as the water behind a gull instead of its wingtip.

4. **3 · Vocabulary: missing information**  
   Third, missing information: the vocabulary leaves out what the task needs. In Part 8, a blue circle and a blue square shared one concept vector.

5. **4 · Task head: the wrong relationship**  
   Fourth, the task head can learn the wrong relationship, like the billing head in Part 7, where a correct edit made the routing worse.

6. **5 · Intervention: wrong, or too costly**  
   Fifth, the intervention can be wrong, or too costly. Each correction takes an expert's time, and ours in Part 11 came from true labels.

7. **Five questions for any concept bottleneck**  
   So ask five questions of any concept bottleneck. Are the concepts meaningful? Are they grounded correctly? Are they sufficient for the task? Does the model actually use them? And do corrections improve decisions?

8. **A 2026 survey maps the field onto the same parts**  
   Knab and colleagues' 2026 survey organises the field around the same parts: the input, the concepts, the output and the training. It lists these issues among its open challenges.

## Final replay  (s14)

1. **One last time: a black box maps the photo to a species**  
   One last time, the gull. A black box maps the photograph straight to a species.

2. **Open it: named concepts sit on the path to the prediction**  
   Open it up. Input. Encoder. Concept predictor. Named concepts. Task head. Prediction.

3. **A person corrects one concept, and the prediction follows**  
   A person corrects one concept, and the prediction changes.

4. **The interface is only as good as its parts**  
   But the interface is only as good as its parts: the concepts it names, where they look, and the head that reads them.

5. **Concepts that can be inspected, evaluated and corrected**  
   Concept bottleneck models expose intermediate, human-interpretable variables in a prediction pipeline. Those variables can be inspected, evaluated, and sometimes corrected.

6. **The interface must carry what the prediction depends on**  
   The challenge is to make sure the interface faithfully represents the information on which the prediction depends.

7. **What to remember**  
   Four things to remember. Post-hoc methods explain a model afterwards, while a concept bottleneck puts named concepts on the path. A correction helps only if the head is right. Soft scores can leak. And newer variants need fewer labels, so their grounding has to be checked.

## End card  (end)

1. 
   Concept Bottleneck Models. Predicting through interpretable concepts.
