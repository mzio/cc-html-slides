## LoLCATs: Our Approach

**Two lightweight stages** to linearize any pretrained Transformer:

:::diagram{type=pipeline}
:::

:::feature-grid
Stage 1: Attention Transfer
Train feature maps to match softmax outputs via MSE loss. Only 0.2% of parameters updated. Frozen original weights.

Stage 2: LoRA Finetuning
Apply low-rank adaptation to recover remaining quality. Only 0.09% additional parameters. Standard next-token prediction.

Result
Subquadratic model with near-original quality. 40M total training tokens — 0.003% of pretraining data.
:::
