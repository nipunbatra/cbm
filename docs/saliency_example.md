# Real-image saliency example

Slides s21.3 and s21.4 use the same zebra photograph and one fixed, pretrained
Residual Network with 50 layers (ResNet-50). Both maps are computed model outputs,
not drawn explanations or object masks. The original shape example remains in
`D.saliency_toy` for reference but is no longer shown.

Run `~/base/bin/python worked/saliency.py`, then `~/base/bin/python math/data.py`.
The script requires the locally cached torchvision `resnet50-11ad3fa6.pth`
checkpoint. It performs no training and downloads nothing. `worked/saliency.json`
records versions, checkpoint and image hashes, preprocessing, class indices,
probabilities, logits and the pixel-nudge calculation. The compressed raw RGB,
logits and gradients are saved in `worked/saliency_gradients.npz`.

The model uses torchvision's ImageNet V2 weights and their standard preprocessing:
resize the short side to 232 pixels, centre crop to 224 by 224, then normalise RGB.
The displayed input is that exact crop. Derivatives are taken with respect to RGB
values in [0, 1], through the normalisation, while model weights remain fixed.
See the [official model documentation](https://docs.pytorch.org/vision/main/models/generated/torchvision.models.resnet50.html).

For each chosen class, differentiate its raw score before softmax with respect to
every input channel. Take the largest absolute derivative across RGB at each
pixel, following [Simonyan, Vedaldi and Zisserman, Section 3.1](https://arxiv.org/abs/1312.6034).
Display both maps with the same linear greyscale, capped at the pooled 99th
percentile. No smoothing or independent map normalisation is applied. The
probability labels use softmax over all model classes and are distinct from the
raw scores differentiated for the maps.

The worked nudge increases one red-channel value by 0.001. The chosen pixel has
the largest positive red derivative among pixels that remain in range after the
nudge. The measured score change is approximately 0.00014, giving sensitivity
about 0.14. The finite difference agrees with the gradient to within 2%; the
slide rounds the measurement and marks the ratio as approximate.

Zebra is the highest-probability class. Tiger has low probability but nonzero
sensitivity. Both maps highlight background pixels as well as parts of the
animal. They answer a local score-sensitivity question; they do not establish
that a tiger is present or provide a clean outline of the animal.

Photo: Yathin S Krishnappa, *Equus quagga burchellii, Etosha, 2014*, Wikimedia
Commons, CC BY-SA 3.0. `public/img/saliency/input.png` is a resized centre crop of
the existing `public/img/zebra_plains.jpg`; the original attribution and licence
remain applicable. See `docs/sources.md`.
