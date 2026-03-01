## Softmax Attention

The output at position $n$ is a **weighted sum** over all previous tokens:

<div class="math-display">

$$y_n = \sum_{i=1}^{n} \frac{\exp(q_n^\top k_i / \sqrt{d})}{\sum_{j=1}^{n} \exp(q_n^\top k_j / \sqrt{d})} \cdot v_i$$

</div>

- Requires materializing the full $n \times n$ attention matrix
- Cost: $O(n^2 d)$ in time and $O(n^2)$ in memory
- FlashAttention helps with memory — but the FLOPs remain quadratic
- KV cache grows as $O(n \cdot d)$ during generation

> Every new token must attend to **all** prior tokens.
