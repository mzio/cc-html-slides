## Stage 2: Low-Rank Adjustment

After swapping in linearized attention, apply **LoRA** to recover remaining quality:

<div class="math-display">

$$W \leftarrow W + \Delta W = W + BA$$

</div>

where $B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times d}$, with rank $r = 8$.

### Why Two Stages?

1. **Attention transfer** gets you close — outputs approximately match
2. Small errors **compound** across 32+ layers
3. LoRA lets the rest of the network **adapt** to these small differences
4. Much cheaper than full retraining — standard next-token prediction loss

| Component | Parameters | Tokens |
|-----------|-----------|--------|
| Stage 1: Feature maps | 0.2% | 20M |
| Stage 2: LoRA (r=8) | 0.09% | 20M |
| **Total** | **< 0.3%** | **40M** |
