## Sliding Window + Linear Hybrid

Pure linear attention struggles with **spiky, local patterns**. Our hybrid uses exact softmax for nearby tokens:

<div class="math-display">

$$\hat{y}_n = \frac{\displaystyle\sum_{i=n-w+1}^{n} \gamma \cdot e^{q_n^\top k_i/\sqrt{d} - c_n} \cdot v_i + \phi_q(q_n)^\top\! S_{n-w}}{\displaystyle\sum_{i=n-w+1}^{n} \gamma \cdot e^{q_n^\top k_i/\sqrt{d} - c_n} + \phi_q(q_n)^\top z_{n-w}}$$

</div>

:::diagram{type=hybrid}
:::

- **Window** ($w = 64$): Exact softmax for local context — $O(w^2 d)$
- **Linear**: Learned features for global context — $O(d \cdot d')$
- **Total**: Subquadratic — cost independent of sequence length
