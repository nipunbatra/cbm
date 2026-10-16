# Concept Bottleneck Models: the lecture

Generated from narration/order.txt and narration/scenes/*.txt. Each numbered item is one slide step: its heading as
shown on the slide, then the narration (the film voice and the deck's speaker notes).

## Title  (s00)

1. 
   Concept Bottleneck Models. From black-box predictions to interpretable, editable concepts.

## Part 1: Why make predictions interpretable?  (s30)

1. **Why make predictions interpretable?**  
   We begin with the black box: what evidence did the model use, and can a person inspect it?

## The black box  (s01)

1. **Can a person inspect, and correct, the evidence a network used?**  
   A neural network makes a prediction. How can a person inspect, and correct, the intermediate evidence it used?

2. **A real photograph and a real model, CLIP**  
   Here is a photograph of a gull, and a real model, CLIP. The name stands for Contrastive Language-Image Pre-training.

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

3. **Saliency: nudge one pixel, watch one class score**  
   Start with a real zebra photo and a trained image classifier, a Residual Network with 50 layers, or ResNet-50. Choose its zebra score before softmax. Keep the model fixed and slightly increase the red value at the marked pixel. The zebra score changes by a tiny amount; the predicted class need not change. Sensitivity is the size of the score change divided by the size of the pixel change. In symbols, x i is one pixel channel, s k is the chosen class score, and the derivative measures sensitivity to an infinitesimal nudge. The numerical ratio shown here is an approximation.

4. **Same photo, same model, a different class to explain**  
   Keep this exact photo and model. After softmax, zebra is the top prediction; tiger has a very low probability. First choose zebra: backpropagate its score to every input pixel and show the largest absolute gradient across the colour channels. Brighter means a larger sensitivity; this gives the zebra saliency map. Now choose tiger and repeat, without changing the photo or the model. Its score is low, but it can still be sensitive to pixels. Both maps use one brightness scale and neither has been smoothed. Notice the background lights up too. A saliency map shows which tiny pixel changes affect a chosen score; it does not mean that a tiger is present, or trace the outline of the animal.

5. **Occlusion: grey out a patch and measure how far the score drops**  
   A second family changes the input. Grey out one patch, run the model again, and measure how much the score drops. That is the occlusion map we computed for the gull in Part 1.

6. **From an input photo and a class score to a heatmap**  
   The input is a gull photo. A trained model produces class scores; choose the herring gull score as the output to explain. The explanation method takes the photo, the model and this choice of class. For plain gradient saliency, it computes the pixel sensitivities from the formula we just saw. It displays them as a heatmap, with brighter pixels more sensitive. This is an explanation of the score, not another prediction.

7. **Does the heatmap depend on what the model learned?**  
   Now keep the photo, the herring gull class and the explanation method fixed. Compare the heatmap from the trained model with one made after replacing its learned weights with random values. For some methods, such as guided backpropagation, Adebayo and colleagues found the maps barely changed. That is a warning: the picture can survive even after learning is removed. Before trusting a heatmap, check that it depends on the learned weights. Plain gradients did change in their test, but passing this check alone does not prove an explanation is correct.

8. **The setup: learn pneumonia from two hospital datasets**  
   Zech and colleagues studied a chest X-ray classifier. Focus on the model trained using data from both Mount Sinai and the National Institutes of Health Clinical Center, or NIH. Each training example pairs an X-ray with a pneumonia label derived from its radiology report. The label says whether pneumonia is reported. In the collected datasets, about a third of Mount Sinai X-rays have a positive label, compared with about one in a hundred at NIH. These are dataset label rates, not rates for all hospital patients. At test time, a new X-ray goes into the trained model, without its label, and a pneumonia score comes out. The intended clue is disease in the lungs, but the hospital already gives a clue to the label. That is the shortcut we will examine next.

9. **The network could tell which hospital an X-ray came from**  
   A network could tell which hospital an X-ray came from almost perfectly, from markers and scanner details rather than from the lungs. Since the hospital predicts pneumonia, the detector could use the hospital as a shortcut.

10. **An explanation can expose the shortcut, but the fix is new data**  
   A heatmap might light up the hospital marker in the corner, and expose the shortcut. But it cannot remove it. On X-rays from a third hospital, the detector did worse. The only fix was new data and retraining.

11. **Limit 3: a heatmap says where, not what**  
   The third limit is vocabulary. A heatmap says where the score was sensitive. It does not say what the model saw there. On the gull: the yellow bill, the red spot, or the shape of the head?

12. **Experts speak in findings, and the model has no knob for them**  
   Experts reason in named findings: a narrowed joint space, a bone spur, black wingtips. Even when an expert spots the mistake, the model has no named part to correct. There is no setting for wingtip colour that a person could switch from grey to black.

13. **Ante-hoc: the prediction is computed from quantities a person can read**  
   Ante-hoc models take the other route. The prediction is computed from quantities a person can read. A sparse linear model on named features is one example. A short decision tree is another. Prototype networks compare parts of an image with stored example parts.

14. **The case for models that are interpretable by design**  
   Rudin argued that for high-stakes decisions we should prefer models like these over black boxes explained afterwards.

15. **A concept bottleneck predicts concepts first, then the answer**  
   A concept bottleneck model is an ante-hoc model for deep networks. First, predict named properties of the photo, its concepts. Then predict the answer from those concepts alone.

16. **The same path in symbols**  
   In symbols: x is the input, c hat is the vector of predicted concepts, and y hat is the prediction. A concept predictor, g, maps x to c hat. A task head, f, maps c hat to y hat.

## Part 2: The concept bottleneck  (s31)

1. **The concept bottleneck**  
   Now we put named concepts between the image and the prediction.

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

## Part 3: What is a concept?  (s32)

1. **What is a concept?**  
   Before building a bottleneck, we need to decide what counts as a concept.

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

## Part 4: From concepts to a prediction  (s33)

1. **From concepts to a prediction**  
   Next, we follow one image from its predicted concepts to class scores and probabilities.

## From concepts to predictions: the arithmetic  (s04)

1. **Follow the image all the way to class probabilities**  
   Start with an image. The concept predictor estimates the concepts in it. The task head reads those estimates and produces class scores. Softmax converts the scores into class probabilities. The task head can be a single linear layer or a multilayer perceptron, an MLP. We will use one linear layer so that we can see every calculation.

2. **Three classes and three concepts**  
   Our possible classes are zebra, horse and giraffe. For every image, we predict the same three concepts, in this order: stripes, horse-like shape and long neck. These concept names are fixed before we train the model.

3. **The concept predictor turns this image into three estimates**  
   The concept predictor, g theta, is a neural network that takes the image as input. For this hand-chosen example, suppose it predicts stripes 0.1, horse-like shape 0.9 and long neck 0.1. These are assumed outputs for this photograph, not measurements from a trained network. Together they form c hat, the predicted concept vector for this image. The hat means predicted.

4. **The task head turns predicted concepts into class scores**  
   Now pass that same concept vector to the task head, f phi. It takes the three concept values and returns one score for each class. Its input is the predicted concepts. It does not see the image directly. This is where we could use a linear layer or an MLP.

5. **The concept values describe this image; the weights belong to the layer**  
   For our example, choose a single linear layer with no bias. Its weight table, W, has a row for each class and a column for each concept. The zebra row is 3, 1, 0. These are weights, not another image's concept values. We normally learn the weights during training and keep them fixed when predicting new images. Here, both the weights and the concept values are hand-chosen to make the arithmetic easy.

6. **Inside the layer: multiply each concept value by its weight, then add**  
   Let us compute just the zebra score. Stripes contributes 3 times 0.1, which is 0.3. Horse-like shape contributes 1 times 0.9, which is 0.9. Long neck contributes 0 times 0.1, which is 0. Add these contributions to get 1.2. This is one output of the linear layer.

7. **The same layer produces all three class scores**  
   Repeat that calculation with the horse row and the giraffe row. The layer returns zebra 1.2, horse 1.6 and giraffe 0.2. These scores are also called logits. Only now do we write the shorthand: scores equal W times c hat. This is just the linear layer applied to the predicted concept vector.

8. **Softmax turns the scores into class probabilities**  
   Pass the score vector through softmax. Exponentiate each score and divide by the total. This gives class probabilities that sum to one. Horse has the largest score, 1.6, and the largest probability, about 0.52. The predicted class is horse.

9. **A person corrects one predicted concept**  
   Now an observer looks at the image and sees stripes. They correct the stripes value from 0.1 to 1. The other concept values stay the same. This edit replaces one entry in the predicted concept vector.

10. **Pass the corrected concepts through the same layer**  
   Feed the corrected concept vector into the same linear layer. Its weights have not changed. The new scores are zebra 3.9, horse 0.7 and giraffe minus 0.7. The image and the concept predictor are unchanged. We only replace one concept value before running the task head again.

11. **After softmax, zebra has the highest probability**  
   Apply softmax to the new scores. Zebra now has probability about 0.95. The predicted class changes from horse to zebra.

12. **Why did the zebra score rise?**  
   Only the stripes value changed, by 0.9. The zebra weight for stripes is 3. So the zebra score increases by 3 times 0.9, which is 2.7. That takes it from 1.2 to 3.9. The other contributions stay the same.

13. **The concept vector is the point where a person can intervene**  
   The full path is still image, concept predictor, concept vector, task head, scores and softmax. A person can correct a concept in the middle, then run the same task head again. The answer can change without retraining either network.

## Part 5: Learning the concepts  (s34)

1. **Learning the concepts**  
   We now compare how the concept predictor and task head learn from their labels.

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
   In the original paper, Koh and colleagues compared three ways to train.

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

## Part 6: Human interventions  (s35)

1. **Human interventions**  
   Next, a person corrects a concept and we follow the effect on the prediction.

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

## Part 7: When a correct edit hurts  (s36)

1. **When a correct edit hurts**  
   A correct concept edit can still hurt the final prediction, so we need to understand how the head uses it.

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

## Part 8: An incomplete concept vocabulary  (s37)

1. **An incomplete concept vocabulary**  
   What happens when the concept vocabulary leaves out information needed for the task?

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

## Part 10: Modern concept bottleneck architectures  (s38)

1. **Modern concept bottleneck architectures**  
   We now compare newer architectures by the supervision they need, from concept labels to class labels to no fitting on the new task.

## Modern concept bottleneck architectures  (s10)

1. **Labelling every concept on every image is the main cost**  
   The original concept bottleneck needs a person to label every concept on every training image. That is its main cost, and most newer methods try to reduce it.

2. **One training record: an image, its concept labels and a class**  
   One supervised training record looks like this: the image, a 0 or 1 for each named concept, and the class. On CUB, that meant 112 concept labels per photograph.

3. **Rung one: images, concept labels and classes**  
   The newer methods form a ladder of shrinking supervision. On the first rung, CBMs and concept embedding models need the image, the concept labels and the class.

4. **Rung two: keep class labels, drop per-image concept labels**  
   Post-hoc models, Language in a Bottle, or LaBo, and vision-language-guided concept bottleneck models, or VLG-CBMs, drop the concept labels on the task images. They still learn from images with class labels. A pretrained model supplies visual knowledge, and concept names can come from people or a language model.

5. **Rung three: no training for this task**  
   Classification by description drops training on the new task. It still uses a pretrained model. We supply class descriptions and a new image, without fitting a model to labelled examples of these classes.

6. **Rung two: class labels teach the task head**  
   Take Language in a Bottle, or LaBo, as an example of rung two. A language model supplies descriptions, such as black and white stripes. Pretrained CLIP compares each image with these descriptions and produces match scores. During training, class labels teach a task head how to combine those scores. For a new photo, the learned head predicts the class. We need class-labelled images, but no person has to label every concept in every image. The diagram illustrates the path, without showing measured scores.

7. **Rung three: combine the match scores with a fixed rule**  
   Now keep the pretrained CLIP model, but replace the learned head with a fixed rule. A language model supplies descriptions for each class. CLIP compares a new photo with each description. We average the match scores within each class and choose the class with the highest average. No class-labelled examples or fitting are needed for this task. The difference is the combination: rung two learns it from class labels; rung three uses a fixed average.

8. **Fewer concept labels, so check the concepts another way**  
   Dropping per-image concept labels saves labelling, but removes a direct check. A person who supplies a concept label has checked it against the image. On the higher rungs, a match score alone does not establish that the named concept is visible. We need to check this another way.

9. **For each variant, ask: is the concept really in the image?**  
   So for each variant, watch for one question: who checks that a named concept is really visible in the image? We come back to it when we discuss grounding.

10. **A variant can change four things**  
   Newer variants change four things: where the concepts come from, how each concept is detected, how it is represented, and what reaches the task head.

11. **One running example: photographs of zebras, horses and giraffes**  
   We will walk through them on one running example: photographs of zebras, horses and giraffes, the classes from Part 4. We train on 24 photos and test on 12.

12. **For each variant: how the path from image to concepts to class changes**  
   For each variant, we first say in one line what changed compared with the plain CBM. Then we write down how the path changes: from x, the image, to c hat, the concepts, to y hat, the class.

## Part 10 · Rung One: Concept labels and class labels  (s39)

1. **Concept labels and class labels**  
   On rung one, every training image has concept labels and a class label; concept embedding models keep this supervision but give each concept a richer representation.

## Concept embedding models  (s15)

1. **One number per concept is a narrow channel**  
   First, concept embedding models, or CEMs. One number per concept is a narrow channel, and when the vocabulary is incomplete, accuracy suffers, as we saw in Part 8.

2. **What does a prototype mean here?**  
   A prototype usually means a representative example. Here the clearer term is embedding: a short list of learned numbers. CEM computes a present vector and an absent vector for the current image. Both exist even when stripes are clearly visible. They are not stored example photos or fixed class averages. The coordinates are learned features, not individually labelled properties. These numbers are illustrative.

3. **Learned layers turn the image into the two vectors**  
   Where do the vectors come from? An image encoder first extracts features. For stripes, two learned layers turn those features into the present and absent vectors. Every concept has its own pair of layers. Training learns the weights of these layers. With those weights fixed, a different image can still produce different vectors. Nobody supplies target values for the vector coordinates.

4. **Each concept gets two embeddings: active and inactive**  
   Now the mechanics. An embedding is a short list of numbers that describes something; here each one has two numbers. From the image, the model computes two embeddings for every concept: one describing it as active, one as inactive.

5. **A learned scorer predicts the probability p**  
   A learned scoring layer reads both vectors and predicts the probability, p, that the concept is present. Suppose that, as in Part 4, it misses the stripes on this photo: p is only 0.1. The concept labels will teach this probability during training.

6. **The concept embedding mixes the two, weighted by p**  
   The concept's embedding mixes the two: p times the active embedding, plus one minus p times the inactive one.

7. **With p = 0.1, the mixed vector sits close to inactive**  
   With p equal to 0.1, take the first entry: 0.1 times 0.82, plus 0.9 times 0.22, gives 0.28. The second entry works the same way, and the mixed vector sits close to inactive.

8. **At test time, the head reads the mixed vectors**  
   At test time, only the new image is needed. The trained model computes both vectors and a probability for every concept, then mixes them. The head reads all three mixed vectors, six numbers in all. Our illustrative linear head produces class scores, and softmax gives the displayed probabilities. Here it favours horse. All weights stay fixed, and no true concept or class label is used for this ordinary prediction.

9. **An optional correction changes p, with weights fixed**  
   To intervene, a person sets p, not the vector coordinates. Setting p to 1 swaps in the active embedding already computed for this image. The same head now makes zebra lead in this example. The two candidate vectors and all network weights stay fixed; there is no retraining.

10. **Training uses concept labels and class labels**  
   During training, each image comes with concept labels and a class label. For this zebra, stripes is labelled present and the class is zebra. A concept loss compares the predicted probability with the concept label. A task loss compares the class prediction with the class label. Backpropagation from these losses updates the encoder, the vector-generating layers, the probability scorer and the task head together. We supervise the probability and the final answer, rather than supplying the vector coordinates.

11. **Training learns the weights. Testing uses them**  
   Compare the two stages. The input during training is an image with concept and class labels. At test time it is just a new image. The weights are updated during training and kept fixed at test time. The vectors and probabilities are computed from each image in both cases.

12. **Concept embedding models in symbols**  
   In symbols, for concept j out of k: g now outputs a probability and two embeddings, each m numbers long. c hat j is the mixed vector, and f reads all of them. Training still needs images, concept labels and class labels.

## Part 10 · Rung two: a map of the approaches  (s40)

1. **Rung two: where do the concept values come from?**  
   Both approaches on rung two still train a class head from class-labelled images. They avoid human concept labels on every task image. We will organise them by one design choice: where do the concept values come from? In group A, keep CLIP similarities as the concepts: our phrase-based PCBM example and Language in a Bottle. In group B, train concepts from targets grounded in image regions: vision-language-guided concept bottleneck models. These are alternatives within one rung, not successive training steps.

## Rung two A · Use CLIP scores directly  (s47)

1. **A · Use CLIP scores directly**  
   Begin with group A on rung two. At prediction time, the image and the saved concept phrases go through frozen CLIP encoders. Their cosine similarities become the concept scores, with any saved scaling applied, and a learned class head combines them. The class labels train the head, while the CLIP encoders remain fixed. Our post-hoc example shows the basic path. Language in a Bottle then builds on this same path by selecting descriptions and choosing a starting point for the head.

## Post-hoc concept bottleneck models  (s16)

1. **Start with animal classes; ask for visible concepts**  
   We now build a post-hoc concept bottleneck model, or PCBM, using frozen CLIP encoders. Start with the animal classes: zebra, horse and giraffe. An optional helper is a large language model, or LLM. Ask it to suggest visible properties that help distinguish these animals, without using their class names. It might suggest black and white stripes, a long neck and a flowing mane. This exchange is illustrative: the LLM proposes a vocabulary, rather than classifying our photos.

2. **Review the phrases, then fix one shared concept bank**  
   Review the suggestions before fitting. Keep clear visible properties. Reject zebra because it is the class name, not a property. Merge striped coat with black and white stripes because they repeat the same idea. These are illustrative review examples. Check phrase scores across the training photos too; remove phrases that never give useful matches. For the saved animal experiment, we keep the original bank of eight hand-chosen phrases. An LLM could help propose such a list, but these saved results do not come from an LLM-generated bank. Every image will be scored against the same list, including phrases that do not describe it. Freeze the list before fitting the task head.

3. **CLIP compares a photo with a concept phrase**  
   Take this zebra photo and the phrase black and white stripes. CLIP's frozen image encoder gives an image vector, and its frozen text encoder gives a phrase vector. Compare these vectors using cosine similarity. For this real photo and phrase, the score is 0.274. This is a match score, not the probability that stripes are present. We reuse CLIP as it is; neither encoder is trained on our animals.

4. **One image gives one score per concept**  
   Keep the zebra photo fixed. Repeat the cosine comparison for every phrase in the bank. The result is eight named scores, in a fixed order. These scores are not probabilities. Next, put each score on a common training scale, then learn a task head that predicts the animal class. The LLM is not needed when scoring a new image.

5. **Use the same concept prompts for every image**  
   Keep the prompts fixed and change only the image. Here are three held-out photos: a zebra, a horse and a giraffe. Each column uses exactly the same phrase for every photo. Each cell is the raw cosine similarity between that photo and that phrase. This gives one score per image and concept. These scores are not probabilities.

6. **Each prompt gets its own training average and spread**  
   Each prompt has its own usual score and its own spread. To find them, score all 24 training photos with the same prompts. Compute the average and standard deviation separately down each column, across images. Save those training statistics and reuse them for every new photo. The three test photos on the previous slide do not set the scale.

7. **Standardise each score: subtract the mean, divide by the spread**  
   Each cell is standardised separately. Take the zebra and stripes cell. Subtract its average over the 24 training photos, then divide by its spread, the standard deviation. For stripes, that gives 1.41.

8. **The same photos and prompts, now on a common scale**  
   Now apply the same rule to every cell, using its column's saved mean and spread. The photos and prompts have not changed; only the units have changed. The zebra's stripes score becomes 1.41, while the giraffe's long-neck score becomes 1.70. A positive value means above that prompt's training average, zero means at the average, and a negative value means below it. A negative score does not prove that the concept is absent. Within each column, the order of the images stays the same. The head receives these standardised values.

9. **For this zebra, stripes scores highest**  
   These eight numbers are the concept bottleneck. Each belongs to a named phrase. For this zebra photo, black and white stripes scores highest, 1.4 standard deviations above its average on the training photos.

10. **Train the task head using concept scores and class labels**  
   Now use the task training photos, each with its animal class label. The frozen encoder and concept bank turn each photo into eight scores, using the saved training scale. Feed those scores to a linear head. Compare its prediction with the true class and update only the head weights and constants. The encoders, phrase vectors and scaling stay fixed. This learns which named concepts help distinguish zebra, horse and giraffe.

11. **Sparse: only 4 of 24 weights are non-zero**  
   The head is also sparse. An L1 penalty adds the size of every weight to the loss, so weights that do not help are pushed to exactly zero. Of 24 possible weights, 8 concepts times 3 classes, only 4 are non-zero: zebra reads stripes, giraffe reads a long neck, and horse reads a flowing mane.

12. **The zebra score: stripes score times weight, plus a constant**  
   For this zebra, only the stripes weight feeds the zebra score: the stripes score times its weight, plus the constant, gives about 2.03. The softmax turns the three scores into shares, and zebra gets 0.77.

13. **At test time: one new image, with all weights fixed**  
   At test time, give the system a new image. The frozen image encoder produces its features. Cosine similarities with the saved phrase vectors give raw concept scores, and the saved training statistics put the scores on the same scale. The trained head produces class scores; softmax gives probabilities. No concept labels or class label are supplied, and nothing is fitted again. This is the complete prediction path.

14. **All 12 held-out photos are classified correctly**  
   All 12 held-out photos are classified correctly. This is a tiny teaching example, not a benchmark.

15. **Edit the stripes score, and zebra falls**  
   Lower the stripes score to its usual value on other animals, and zebra falls to 0.14.

16. **PCBM-h adds an extra path for evidence the concepts miss**  
   The concept list may miss useful evidence in the image. The hybrid post-hoc concept bottleneck model, or PCBM-h, adds a residual: an extra linear head that reads the same image features directly. Add its class scores to the concept head's scores, then apply softmax. For our zebra, the score is about 2.03 plus 0.31, giving 2.34 before softmax. During training, keep the concept model fixed and fit only the extra head using class labels. At test time, both paths read the same image. This can improve prediction when the concept list is incomplete.

17. **An edit leaves the extra path unchanged**  
   Now lower the stripes score, just as before. The concept head sees the edit, but the residual still reads the same image features, so its contribution stays unchanged. After the same edit, the concept model gives zebra probability 0.14; with the residual it is 0.20. The prediction can still change, but some evidence bypasses the concepts. The trade-off is better predictive capacity with less control through named concepts.

18. **Compared with the plain CBM: the concepts come from phrases**  
   Compared with the plain CBM, three of the four things changed. The concepts come from a reviewed bank of phrases instead of per-image concept labels, frozen CLIP encoders and cosine similarity replace the trained predictor, and in the hybrid a residual also reaches the head. Each concept is still one number.

19. **Post-hoc concept bottleneck models in symbols**  
   In symbols, for concept j out of k, compare the image vector e with the saved phrase vector v j using cosine similarity. Standardise each score using its saved training mean and spread to obtain the concept value. The encoders and phrases are frozen. The task head f is sparse and linear. Only f is trained from images and class labels, with an additional residual r in the hybrid.

## Language in a Bottle  (s18)

1. **Same direct-scoring path; choose better descriptions**  
   We are still in group A of rung two: use CLIP scores directly. Our PCBM example used a small hand-chosen bank of phrases. Language in a Bottle, or LaBo, asks a language model for candidate descriptions, then selects a useful and varied set. It also starts the class head from a language prior before learning from class labels. The prediction path stays the same: frozen CLIP, description scores, a trained head, and a class. This is a refinement of the direct-scoring approach, rather than a new supervision rung.

2. **The intuition: let CLIP read short sentences about each class**  
   The intuition is simple. Describe each class in a few short sentences, let CLIP read them, and use its similarity scores directly as the concepts, written as 100 times CLIP's cosine. For our zebra photo, the stripes sentence scores higher than the mane sentence and the neck sentence.

3. **Four steps, from sentences to a head that starts from a guess**  
   The method has four steps. A language model writes sentences, a selection rule keeps the most useful ones, CLIP scores each image against them, and a linear head, started from a guess, turns the scores into a class.

4. **Step 1: a language model describes each class in sentences**  
   In step one, the language model writes eight short sentences for each class, as JSON. Here they are for zebra.

5. **A good set of sentences separates the classes**  
   Which sentences should we keep? First, each one should separate its class from the others. Take a sentence's average CLIP score on the zebra training photos, and subtract its average on the best other class. Bold black and white stripes has the widest margin of the eight. Stocky horse-like body matches another class better than zebras, so it separates nothing.

6. **A good set of sentences does not repeat itself**  
   Second, the set should not say the same thing three times. Once one stripes sentence is in, a second stripes sentence adds much less that is new.

7. **Step 2: score each sentence's discriminability**  
   Step two puts numbers on both ideas. Discriminability is the margin from two slides back, rescaled within the class so that the best sentence gets 1 and the worst gets 0. Large striped ears lands at 0.66.

8. **A greedy rule balances discriminability and coverage**  
   Coverage gain measures what a sentence adds beyond the sentences already chosen. A greedy rule builds the set one sentence at a time: each round it takes the best mix, 0.7 times discriminability plus 0.3 times coverage gain, and keeps that choice.

9. **The greedy picks for zebra, in order**  
   In round one, bold black and white stripes scores 0.7 times 1, plus 0.3 times 0.69, which is 0.91, the best of the eight. Unique facial stripe patterns comes second, then large striped ears.

10. **Three sentences per class, nine in all**  
   For horse, a long flowing mane leads. For giraffe, an extremely long vertical neck.

11. **Step 3: CLIP scores the image against each chosen sentence**  
   Step three: CLIP scores the image against the nine chosen sentences. Those nine numbers are the bottleneck. Score j compares CLIP's encoding of the image, phi of x, with its encoding of sentence j, psi of s j.

12. **Step 4: a language prior links each class to its sentences**  
   Step four: a linear layer from sentences to classes, started from a language prior, a starting guess taken from the sentences. Each class gives one third to each of its own three sentences, and nothing to the others.

13. **With the prior, a class score is the average of its own sentence scores**  
   So each class score is the average of its own three sentence scores. For this zebra, zebra gets 28.1, horse 22.9 and giraffe 23.7. As shares, zebra gets 0.98, and 11 of the 12 test photos are right.

14. **Why a prior helps when labels are few**  
   Why start from a prior? A head that starts from zero must learn from the labels which sentence belongs to which class, and that is hard with few labelled photos. The prior already encodes it. A linear probe is a linear layer on CLIP's image features, with no concepts. The LaBo paper reports its clearest advantage over a linear probe with one labelled photo per class.

15. **Training with the class labels adjusts the weights**  
   After that, training with the class labels moves the weights a little, and then all 12 are right.

16. **Do the zebra sentences detect the ears, or stripes anywhere?**  
   Notice the zebra sentences: all three are about stripes. Is CLIP detecting striped ears, or stripes anywhere in the picture? The scores alone cannot tell.

17. **What changed compared with the plain CBM**  
   Compared with the plain concept bottleneck, a language model writes the concepts as sentences, and CLIP scores them directly, so nothing is trained to detect concepts. Only the head learns, and it starts from the language prior instead of from scratch.

18. **LaBo in symbols**  
   In symbols: g is CLIP itself, so c hat j is 100 times the cosine between the image and sentence j. f is a linear layer that starts from the language prior. The data: images and class labels.

## Rung two B · Learn from grounded concept targets  (s49)

1. **B · Ground concepts in image regions**  
   Group A used CLIP similarities directly as concept values. Group B stays on rung two but learns a concept predictor. Use a pretrained detector to locate concepts in image regions and provide concept targets. Train the concept layer from these targets, then train the class head from class labels. At test time, the learned concept predictor and head process the new image; the detector supplies training supervision. Vision-language-guided concept bottleneck models are our example. Grounding adds a spatial check, although detector errors can still be learned.

## Grounding the concepts  (s24)

1. **Why ground the concept targets in image regions?**  
   We are in group B of rung two: learn concepts from grounded targets. Recall the weakness of using CLIP similarities as concept values: a phrase gets a score, but nothing locates the named concept in the image. We need a check that the concept is actually visible. The following slides show how a detector can supply this spatial check during training.

2. **Naming a concept is not the same as pointing at it**  
   The fix rests on a simple intuition. Naming a concept is not the same as pointing at it. So ask a detector to point at each concept in the image, and count only the concepts it can find.

3. **Three ways a concept can fail**  
   There are three ways a concept can fail. Some are not visual, such as a gull's call. Some describe the setting, not the bird. And some score highly on images that do not contain them, such as a black head on a gull whose head is white.

4. **High accuracy does not prove meaningful concepts**  
   Here is why accuracy alone is not enough. Start with a photo and a pretrained image encoder. In this baseline, the concept layer has randomly chosen weights that stay fixed: it was never taught concepts such as yellow bill. Its outputs still depend on the image. Train only the final head using images and their class labels, then test on new images. When the head can use many of these outputs, the paper finds that accuracy can approach that of concept-based models. Useful image information has survived, even though the layer was never trained to detect named concepts. So check whether a high yellow-bill score really corresponds to a yellow bill, as well as checking the predicted class.

5. **VLG-CBM asks a detector to find each concept**  
   Their method is the Vision-Language-Guided Concept Bottleneck Model, or VLG-CBM. It grounds the concepts first. It uses an open-vocabulary object detector: a detector that can search for any phrase you give it, not only a fixed list of objects. It looks for each concept in each training image, and draws a box where it finds it.

6. **A box means 1, no box means 0**  
   A concept counts as present only where a box was found. For our gull, the bill, head and wingtips each get a one, and the call gets a zero. We call this vector c det: the concept labels from the detector.

7. **The grounded labels train the concept layer with a loss**  
   These grounded labels train the concept layer: a linear layer that turns the backbone's features into one score per concept. The loss is a binary cross-entropy, as in the original CBM, but no person draws the labels.

8. **One term of the loss, worked out**  
   One term, as in Part 5. The wingtips have a box, so their label is one; if the layer predicts 0.8, the term is minus log 0.8, about 0.22. The call has no box, so its label is zero; a prediction of 0.2 costs the same, minus log of one minus 0.2.

9. **Count the non-zero weights in each class's row**  
   They also report the number of effective concepts, NEC for short. Each row of the head holds one class's weights, one per concept. Count the non-zero weights in each row, here three, two and four, and average over the classes: the NEC is three.

10. **A head that uses every concept explains nothing**  
   Why does this count matter? A head that puts weight on every concept can fit almost anything. The paper proves that even a random, untrained concept layer can approximate any linear classifier once there are enough concepts. So a dense head can be accurate and still explain nothing.

11. **A fair comparison: the same number of concepts per class**  
   So the fair comparison gives every model the same budget: the same number of concepts per class. Only then does higher accuracy say something about the concepts themselves.

12. **The same count in symbols**  
   In symbols, the count for class k is the zero norm of its row of weights: the number of entries that are not zero. The NEC averages that count over the K classes.

13. **Five concepts per class can actually be read**  
   The paper reports accuracy with the NEC held at five. A head like that can actually be read: each class rests on a handful of named concepts.

14. **From direct CLIP scores to grounded concept learning**  
   Compared with direct CLIP scoring, the concept values now come from a learned layer. Detector boxes supply its training labels. At prediction time, this layer produces the concept values instead of comparing the image with text. The class head is still learned from class labels. We also judge it at a fixed number of concepts per class, so the explanation stays short.

15. **VLG-CBM in symbols**  
   In symbols: g is a backbone with a concept layer, W c, trained on the detector labels c det. f is sparse and linear, with the number of effective concepts held fixed. The data: images and class labels, plus a detector.

## Part 10 · Rung Three: No fitting on the new task  (s41)

1. **No fitting on the new task**  
   On rung three, a pretrained model scores descriptions and a fixed rule combines the scores, without fitting a head to labelled examples from the new task.

## Classification by description  (s25)

1. **Rung three: no fitting on the new task**  
   The last step on the ladder removes fitting on the new task. The pretrained CLIP encoders remain. Menon and Vondrick call this classification by description, or CBD in our comparison table. Instead of learning a head from class labels, use a fixed average of description scores for each class.

2. **Each class gets a checklist, and CLIP ticks it softly**  
   The intuition is a checklist. A language model writes a short checklist for every class. CLIP ticks each item softly, with a score for how well the photo matches it. The class with the best average tick wins.

3. **A language model describes every class**  
   A language model writes a few descriptors for every class: short phrases about what the class looks like. For a herring gull: a white body with black wingtips, a yellow beak and legs, a red spot on its beak.

4. **CLIP scores the photo against each descriptor**  
   CLIP scores the image against each descriptor: that score is the soft tick. The class score is simply the average of its descriptors' scores, and the highest average wins.

5. **One descriptor score: a cosine between two vectors**  
   Where does a score come from? CLIP has two encoders. One, phi, turns the image into a vector; the other, psi, turns the descriptor into a vector in the same space. The score is the cosine similarity of the two: near one when they point the same way, smaller when they do not.

6. **The class score averages its descriptor scores**  
   Then y hat k, the score of class k, averages the descriptor scores over D k, the class's list of descriptors. Nothing is fitted to the target data.

7. **Every score comes with its reasons**  
   Every prediction comes with its reasons: the descriptor scores that were averaged. On our gull photograph, the five herring gull descriptors score between 0.32 and 0.34, and their average is about 0.33.

8. **Slaty-backed gull edges ahead**  
   But the slaty-backed gull's descriptors average slightly higher, so it edges ahead by a tiny margin. Our photo shows a herring gull, so this prediction is a near miss.

9. **Attractive when there are no labels at all**  
   So when is this attractive? When you have no labelled images at all. And a new class needs only a new description: write its checklist, and it can be scored at once, with no retraining.

10. **A descriptor can be wrong**  
   But the descriptors themselves can be wrong: the language model says a California gull has a black head, which it does not.

11. **A match score is not a fact check**  
   Look at our herring gull photo: its head is white and its bill is yellow. The California gull checklist says black head and bill, yet CLIP gives that phrase a positive similarity score. That number compares the photo with the whole phrase; it is not a probability that each detail is true. The fixed average still includes it, so a misleading description can affect the class score. Other descriptions may be impossible to verify from a photo, or describe its background. The takeaway: check that the words are correct and visible, then test whether changing that feature changes its score.

12. **What changed compared with LaBo: the head is no longer learned**  
   Compared with LaBo, the head is no longer learned. LaBo trained a linear layer on CLIP's sentence scores; here the class score is a fixed average, so nothing is trained and no labelled image is needed.

13. **Classification by description in symbols**  
   In symbols: g is CLIP, c hat d is the similarity to descriptor d, and f is a fixed average over each class's descriptors. The data: none. The cost: nothing guarantees that the descriptors are correct, or grounded.

## Comparing the variants  (s19)

1. **One table: one row per variant, one column at a time**  
   Use our supervision rungs and groups to organise the variants. This table puts them beside the original CBM, one row per method, and we fill it one column at a time.

2. **Column one: the supervision each variant needs**  
   The first column is the data needed for training. Here x is an image, c its concept labels, and y its class label. Supervised CBMs and concept embedding models need all three.

3. **Most variants drop the concept labels**  
   Post-hoc models, LaBo and VLG-CBM drop the concept labels. Classification by description, CBD in the table, needs no training data for the new task.

4. **Column two: where the concepts come from**  
   The second column says who supplies the concepts. For CBMs and concept embedding models, people do, through their labels. The others take them from a concept bank, a language model, CLIP, or a detector.

5. **Column three: what the task head reads**  
   The third column is what the task head actually reads. A CBM passes one number per concept, a concept embedding model a vector per concept, and our post-hoc phrase example its scaled cosine scores. The optional hybrid version adds a residual to the class scores. VLG-CBM passes the outputs of a learned concept layer, and LaBo and classification by description pass raw CLIP scores.

6. **Column four: what is trained**  
   The last column is what gets trained. CBMs and concept embedding models train the concept predictor and the head. Post-hoc models and LaBo train only the head. VLG-CBM trains a concept layer and the head. Classification by description trains nothing on the new task.

7. **Naming a concept does not ground it**  
   Each change makes concepts cheaper or predictions more accurate. None makes grounding automatic. A phrase from a language model, or a CLIP similarity, does not show that the model sees that property in the image. That has to be checked.

8. **Who supplies the concepts, and who checks them?**  
   One question sums up the table: who supplies the concepts, and who checks them? In CBMs and concept embedding models, people label the concepts, so people check them. In post-hoc models, a concept bank supplies them, checked only by whoever built it. LaBo takes them from a language model, and only a CLIP similarity checks them. VLG-CBM keeps the language model, and adds a detector as the check. In classification by description, nobody checks.

9. **Each rung up the ladder removes a cost and a check**  
   This is the general trade-off. Each rung up the ladder removes a human labour cost, and with it a human check. The labour saved on labelling has to be spent later, on checking that the concepts are really in the image.

## Part 11: Evaluating a concept bottleneck  (s42)

1. **Evaluating a concept bottleneck**  
   How should we judge a concept bottleneck? We need to check the concepts, the predictions and the effect of interventions.

## How should we evaluate a CBM?  (s11)

1. **Accuracy alone hides most of what a concept bottleneck promises**  
   How should we judge such a model? Accuracy alone hides most of what matters, so we ask four separate questions, each about a different part of the model.

2. **Task accuracy: are the predictions correct?**  
   First, task accuracy: are the predictions correct? In everyday terms, is the final answer right? Measure it on held-out test images, images the model never saw during training.

3. **Task accuracy counts the right answers**  
   The formula only counts. The bracket is 1 when the prediction matches the true label, and 0 when it does not. Add up the ones and divide by the number of images. Three predictions with two right give an accuracy of two thirds.

4. **Concept accuracy: are the concept values right?**  
   Second, concept accuracy: are the concept estimates correct? In everyday terms, did the model read the evidence correctly? Take one test image, a small red square. Round each concept score to 0 or 1, and compare it with the label. Large scores 0.78, which rounds to 1, but the square is small, so its label is 0. Four of the five match. Concept accuracy averages these matches over all images and all concepts.

5. **Grounding: does each concept rest on the right evidence?**  
   The second question has a second half, grounding: does each estimate rest on the intended evidence? A score for wingtip black should come from the wingtip, not from the water. So we also check where the detector looks.

6. **Faithfulness: does the output really depend on the concepts?**  
   Third, faithfulness: does the output actually depend on the concepts, in the way the model claims? An explanation is faithful when it tells the truth about how the answer was made. To test it, change a concept and check that the output moves as the head says. In the gull head from Part 2, setting wingtip black to 1 lifts herring gull from 0.29 to 0.91.

7. **Intervention utility: do corrections help, and at what cost?**  
   Fourth, intervention utility: when a person corrects a concept, do decisions improve, and at what human cost? Correct concepts one at a time, and plot accuracy against the number of corrections. Each correction costs a person's time, so a curve that rises early is better.

8. **A controlled test: synthetic shapes with known concepts**  
   Here is a real experiment where we know every true concept. The images are synthetic, 64 by 64 pixels: each shape is red or blue, a circle or a square, small or large. Two colours, two shapes and two sizes give eight classes. Five yes-or-no concepts describe each image: red, blue, circle, square and large. Together they fully determine the class.

9. **Three models share one small CNN**  
   Three models share the same small CNN, the same data, and the same training budget of 60 epochs, that is, 60 passes through the 768 training images. The black box predicts the class directly. The multi-task model also predicts the concepts, with a concept head beside its class head. The strict CBM predicts the concepts first, and its head reads only those five values.

10. **Task accuracy: the three models are close**  
   Each bar is the share of the 512 test images classified correctly: 78.7 percent for the black box, 82.0 for multi-task, and 81.6 for the strict CBM. On this question alone, the three look about the same.

11. **Concept accuracy: most concept values are right**  
   Over all images and all five concepts, the strict CBM gets 92.4 percent of its concept values right. The bars on the left split this by concept. Colour is always right, and shape is hardest, at about 84 percent for circle and 83 for square.

12. **One edit to one concept changes the prediction**  
   Back to our test image, the small red square. Its concept large reads 0.78, so the model believes the square is large, and the head predicts large red square. A person sets large to 0, and the same head now predicts small red square, the true class.

13. **Oracle corrections: fix the worst concept first**  
   Now do this for every test image. The true labels play a perfect expert, which we call an oracle. It fixes the concept with the largest error first. For our square, that is large, which is 0.78 away from its label of 0.

14. **Each step right is one more correction per image**  
   On this chart, the horizontal axis counts corrections per image, from 0 to 5, and the vertical axis shows task accuracy, starting at 80 percent. One oracle correction lifts accuracy from 81.6 to 97.3 percent. With all five corrected, it reaches 100.

15. **Random corrections help more slowly**  
   Now pick the concept to correct at random instead. The dashed line rises more slowly: 87.3 percent after one correction, averaged over 32 random orders. A random pick often fixes a concept that was already right, as four of the five were for our square. The shaded band spans the lowest and highest of the 32 runs.

16. **In the multi-task model, a concept edit changes nothing**  
   Now the multi-task model. Edit its concept head, and its class scores stay exactly the same, because its class head never reads the concepts.

17. **Read these numbers with care**  
   Read these numbers with care: one training seed, meaning a single training run, 512 synthetic test images, and corrections taken from the true labels, standing in for a perfect, effortless expert. Real experts make mistakes, and their time is costly.

18. **Similar accuracy, very different intervention utility**  
   The three models have similar accuracy, yet they differ completely in intervention utility. Each metric measures a different property.

19. **Why similar accuracy can hide very different intervention utility**  
   Why can similar accuracy hide such different behaviour? Accuracy marks only the final answer, not the route to it. The multi-task model's class head never reads its concept estimates, so fixing one is like correcting a note that nobody reads. In the strict CBM, the concepts are the only road to the answer, so a fix reaches the prediction.

## Part 12: Beyond images  (s43)

1. **Beyond images**  
   The bottleneck idea also applies to other kinds of input, provided the intermediate concepts have a useful meaning.

## Beyond images  (s12)

1. **Where else do concept bottlenecks fit?**  
   So far our inputs were photographs of birds. Concept bottlenecks fit wherever experts already reason with named findings, the things they check and write down by name.

2. **Medicine: a knee X-ray → clinical findings → a severity grade**  
   In medicine, Koh and colleagues also trained a CBM on knee X-rays from the Osteoarthritis Initiative. The model first scores ten clinical findings, such as joint space narrowing and bone spurs, each on a small scale of its own. From those, the head predicts how severe the osteoarthritis is, on four levels from 0 to 3.

3. **A radiologist corrects a finding, and the grade is recomputed**  
   A radiologist can correct a finding, and the grade is recomputed. Here, joint space narrowing goes from 1 to 2, and the grade goes from 2 to 3. Radiologists already write their reports in these terms.

4. **Language: a review → four aspects → a star rating**  
   In language, the CEBaB benchmark annotates restaurant reviews with four concepts: food, service, ambiance and noise. In this review the food is praised and the service is criticised, while ambiance and noise are not mentioned. Text bottleneck models predict the star rating from those concept values, so you can see which aspect drove it. Reviewers already write this way.

5. **Intensive care: vital signs → summary concepts → drugs needed soon?**  
   In intensive care, Wu and colleagues built concept bottlenecks on patients' time series, measurements recorded over time. The task is vasopressor onset: when a patient will need vasopressors, drugs that support blood pressure. The concepts are summaries learned without concept labels, close to how doctors already sum up a patient, in terms like illness severity and kidney function.

6. **Wearables: sensor signal → simple activities → complex activity**  
   In wearable sensing, X-CHAR explains a complex activity through the simpler activities it is made of, which a person can recognise in the sensor signal. In its nurse data, the simple activities include check vitals, collect blood and oral care. People already describe a complex activity as the simple steps it is made of.

7. **Sleep: an EEG → the patterns scorers use → a sleep stage**  
   And in sleep staging, the concepts are the patterns that scorers already use, as in Part 6: spindles, K-complexes and slow waves. The head turns them into a sleep stage, such as stage two. Scorers already mark these patterns by hand, so each concept matches a mark they would make.

8. **One recipe in every domain**  
   The recipe is the same each time. Name the findings an expert checks, predict them from the raw signal, and let the decision depend on them alone.

## Part 13: What can still go wrong?  (s44)

1. **What can still go wrong?**  
   An editable concept interface is useful, but we still need to check how it behaves and what its scores mean.

## An interpretable interface is not the end of the story  (s13)

1. **Follow the path from photo to concepts to answer: what can fail?**  
   Readable concepts in the middle do not guarantee a good model. Let us follow the path from the photo x, through the concept scores c hat, to the answer y hat, and ask what can fail at each of five points.

2. **1 · Encoder: distribution shift**  
   First, distribution shift: the encoder meets data unlike its training data. In symbols, new inputs come from a different distribution than the training inputs. Recall the chest X-ray model from Part 1.

3. **A new hospital: the same model scores lower**  
   Its AUC, a score where 1 means perfect ranking and 0.5 means guessing, was about 0.93 on X-rays from the hospitals it learned from, and about 0.82 at a new hospital. In practice, the model looks fine where it was built and does worse at the new site.

4. **2 · Concept detector: wrong grounding**  
   Second, wrong grounding: the concept detector responds to the wrong evidence, such as the water behind a gull instead of its wingtip. In practice, the score looks right for the wrong reason, until a gull turns up away from water.

5. **3 · Vocabulary: missing information**  
   Third, missing information: the vocabulary leaves out what the task needs. In Part 8, a blue circle and a blue square shared one concept vector, so the best any head could do was guess, right half the time. In practice, two cases an expert would tell apart look identical to the head.

6. **4 · Task head: the wrong relationship**  
   Fourth, the task head can learn the wrong relationship. Recall the billing head from Part 7: it takes away 2 for each unit of duplicate charge, the wrong sign. A correct edit sets duplicate charge to 1, and billing falls from 0.80 to 0.45. In practice, the expert's fix is right, yet the decision moves the wrong way.

7. **5 · Intervention: wrong, or too costly**  
   Fifth, the intervention can be wrong, or too costly. On this chart from Part 11, each step to the right is one more correction per image, and each correction takes an expert's time. Ours came from true labels, an expert who never errs. In practice, a busy expert can misjudge a concept too, and every check uses time they could spend elsewhere.

8. **Five questions for any concept bottleneck**  
   So ask five questions of any concept bottleneck. Are the concepts meaningful? Are they grounded correctly? Are they sufficient for the task? Does the model actually use them? And do corrections improve decisions?

9. **A 2026 survey maps the field onto the same parts**  
   Knab and colleagues' 2026 survey organises the field around the same parts: the input, the concepts, the output and the training. It lists these issues among its open challenges.

## Recap: Putting the pieces together  (s45)

1. **Putting the pieces together**  
   We finish by following the whole path again, from an image through concepts to a prediction and an intervention.

## Final replay  (s14)

1. **One last time: a black box maps the photo to a species**  
   One last time, the gull. A black box maps the photograph straight to a species.

2. **Open it: named concepts sit on the path to the prediction**  
   Open it up. Input. Encoder. Concept predictor. Named concepts. Task head. Prediction.

3. **A person corrects one concept, and the prediction follows**  
   A person sees that the wingtips are black and corrects that concept. The head now says American herring gull, at 0.91.

4. **The interface is only as good as its parts**  
   But the interface is only as good as its parts: the concepts it names, where they look, and the head that reads them. A concept may be missing, a detector may look at the water, and a head may hold a wrong rule.

5. **Concepts that can be inspected, evaluated and corrected**  
   In short, concept bottleneck models put named values that people can read in the middle of a prediction. Those values can be inspected, evaluated, and sometimes corrected.

6. **The interface must carry what the prediction depends on**  
   The challenge is to make sure the interface faithfully represents the information on which the prediction depends. Put simply, whatever the answer uses should be visible in the concepts.

7. **What to remember**  
   Four things to remember. Post-hoc methods explain a model after the fact, while a concept bottleneck makes the answer pass through named concepts. Fixing a concept helps only if the head reads it the right way. A soft score can carry more than its name says, and that extra information leaks to the head. And newer variants find concepts with fewer labels, so check that each one looks at the right evidence.

## Appendix: Testing concept use in a black box  (s46)

1. **Testing concept use in a black box**  
   The appendix introduces testing with concept activation vectors, a way to ask whether a black-box model responds to a named concept.

## Appendix: testing with concept activation vectors  (s26)

1. **TCAV asks about a named concept: does the model use grey wings when it says herring gull?**  
   This appendix adds one more post-hoc method, one that asks about concepts directly. Testing with concept activation vectors, or TCAV, asks a question like this one: does the model use grey wings when it says herring gull? Here the model is CLIP, the black box from Part 1.

2. **Step 1: collect photos with grey wings and photos without**  
   The first step is to collect example photos: some birds with grey wings, and some without, here from a labelled bird dataset. None of them is a herring gull.

3. **Step 2: the concept direction separates them inside the model**  
   Pass every photo through the model and look at its internal activations. Fit a line that separates the two groups. The direction across that line is the concept activation vector: moving along it means more grey wing.

4. **Step 3: nudge each herring gull photo along that direction**  
   Now take a herring gull photo and ask: if its activation moved a little in the grey wing direction, would the herring gull score go up? The gradient of the score, times the direction, gives the answer as a sign.

5. **The TCAV score: the share of photos whose score rises**  
   The TCAV score is the share of herring gull photos where the score goes up. For grey wings, it went up for almost all 60 photos, in each of 10 repeats with different example photos.

6. **Compare with random directions**  
   A direction that separates two random sets of photos gives scores that jump between zero and one. So a concept counts only when its score is steady and different from random ones. And even then, TCAV says what the model responds to. It gives no way to correct it.

## End card  (end)

1. 
   Concept Bottleneck Models. Predicting through interpretable concepts.
