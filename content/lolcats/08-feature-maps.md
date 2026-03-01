## Feature Map Architecture

Each feature map is a learned projection **after RoPE**:

<div class="math-display">

$$\phi_q(q_n) = f\!\left(\text{RoPE}(q_n)\, \widetilde{W}_q + \widetilde{b}_q\right)$$

</div>

<div class="math-display">

$$\phi_k(k_i) = f\!\left(\text{RoPE}(k_i)\, \widetilde{W}_k + \widetilde{b}_k\right)$$

</div>

### Design Choices

| Decision | Choice | Reason |
|----------|--------|--------|
| Apply after RoPE | Yes | Preserves kernel connection |
| Nonlinearity $f$ | Softplus | Ensures positive features |
| Shared across heads | No | Per-head flexibility |

<div class="stat-row">

:::counter{from=0 to=16.8 suffix="M" decimals=1 label="Trainable Params" duration=1500}
:::

:::counter{from=0 to=0.2 suffix="%" decimals=1 label="of Llama 3 8B" duration=1500}
:::

</div>
