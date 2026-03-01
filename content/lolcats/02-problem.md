## The Quadratic Attention Bottleneck

Context lengths are growing fast — but softmax attention scales **quadratically**.

| Year | Context Length | Attention FLOPs |
|------|---------------|-----------------|
| 2020 | 2,048 | 4.2M |
| 2023 | 32,768 | 1.1B |
| 2024 | 128,000 | 16.4B |

At 128K tokens, the KV cache alone consumes **tens of gigabytes** per sequence. Generation throughput drops as context grows.

<div class="stat-row">

:::counter{from=0 to=16384 suffix="×" label="FLOPs Growth" duration=2000}
:::

:::counter{from=0 to=128 suffix="K" label="Context Tokens" duration=1800}
:::

</div>

**We need subquadratic attention — without retraining from scratch.**
