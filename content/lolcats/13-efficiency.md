## Efficiency Gains

### Inference Throughput vs FlashAttention-2

:::funds-chart
Throughput | 300
Batch Size | 640
Memory Savings | 85
:::

### Training Budget

:::funds-chart
LoLCATs (ours) | 4
SUPRA (prior SOTA) | 100
Mamba (from scratch) | 100
:::

<div class="stat-row">

:::counter{from=0 to=3 suffix="×" label="Throughput Gain" duration=1500}
:::

:::counter{from=0 to=64 suffix="×" label="Batch Size" duration=1800}
:::

:::counter{from=0 to=250 suffix="×" label="Fewer Tokens" duration=2000}
:::

</div>

**Subquadratic inference + fraction of training cost.**
