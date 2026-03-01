## Stage 1: Attention Transfer

Train $\phi_q, \phi_k$ so linear attention **mimics** softmax attention outputs:

<div class="math-display">

$$\ell_{\text{MSE}} = \frac{1}{MH} \sum_{m=1}^{M} \sum_{h=1}^{H} \left\| y^{(h,m)} - \hat{y}^{(h,m)} \right\|_2^2$$

</div>

- $y^{(h,m)}$: softmax output (from FlashAttention) — **frozen**
- $\hat{y}^{(h,m)}$: linear attention output — **trainable feature maps**
- Computed per-head, per-layer across the full model

### Why MSE on Outputs?

Matching attention *weights* requires $O(n^2)$ memory. Matching *outputs* only requires $O(n)$ — we never materialize the attention matrix.

<div class="insight-box">
<strong>Key finding:</strong> Lower attention output MSE strongly predicts better downstream model quality.
</div>
