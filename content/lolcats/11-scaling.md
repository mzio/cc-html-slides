## Scaling to 70B and 405B

Joint training causes **later layers to lag** — 200× higher MSE than early layers.

### Block-wise Attention Transfer

Split $M$ layers into blocks of $b$ and train independently:

<div class="math-display">

$$\ell_{\text{MSE}}^{\text{block}} = \frac{1}{bH} \sum_{m=i}^{i+b} \sum_{h=1}^{H} \left\| y^{(h,m)} - \hat{y}^{(h,m)} \right\|_2^2$$

</div>

:::diagram{type=blockwise}
:::

| Model | Attention Transfer | LoRA | Total GPU Hours |
|-------|-------------------|------|-----------------|
| Llama 3.1 70B | 18h on 8×H100 | — | 18h |
| Llama 3.1 405B | 5h on 14×H100 | 16h on 24×H100 | 21h |

**First-ever linearization of 70B and 405B models.**
