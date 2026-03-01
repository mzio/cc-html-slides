## The Quality Gap

Naively swapping linear attention into a pretrained Transformer **destroys quality**.

:::animated-table{highlight=0}
Method | Model | Perplexity ↓ | MMLU (5-shot)
---|---|---|---
Original Transformer | Llama 3 8B | 6.14 | 66.6
Hedgehog (retrained) | Llama 3 8B | 2448.01 | —
T2R (retrained) | Llama 3 8B | 1539.39 | 52.3
:::

<div class="insight-box">
<strong>The problem:</strong> Prior linearization methods require retraining with billions of tokens and still leave massive quality gaps. Can we do better — with orders of magnitude less compute?
</div>
