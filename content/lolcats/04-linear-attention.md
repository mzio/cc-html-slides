## Linear Attention

Replace the softmax kernel with **learnable feature maps** $\phi_q, \phi_k$:

<div class="math-display">

$$\hat{y}_n = \frac{\phi_q(q_n)^\top S_n}{\phi_q(q_n)^\top z_n}$$

</div>

where $S_n = \sum_{i=1}^{n} \phi_k(k_i) v_i^\top$ and $z_n = \sum_{i=1}^{n} \phi_k(k_i)$.

### The Key Insight

$S_n$ and $z_n$ are **recurrently updatable**:

<div class="math-display">

$$S_n = S_{n-1} + \phi_k(k_n) v_n^\top$$

</div>

Each token now costs $O(d \cdot d')$ — **linear** in sequence length, not quadratic. Fixed-size state replaces the growing KV cache.
