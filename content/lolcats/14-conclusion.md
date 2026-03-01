## Key Takeaways

:::feature-grid
Attention Transfer Works
Training linear attention to match softmax outputs via MSE is the critical ingredient — and it predicts downstream quality.

Scales to 405B
Block-wise training makes linearization tractable at scale. First 70B and 405B linearized models.

Radical Efficiency
0.2% parameters, 40M tokens, sub-day training. Orders of magnitude less compute than prior methods or training from scratch.
:::

<div class="stat-row">

:::counter{from=0 to=0.2 suffix="%" decimals=1 label="Parameters" duration=1500}
:::

:::counter{from=0 to=40 suffix="M" label="Tokens" duration=1800}
:::

:::counter{from=0 to=405 suffix="B" label="Largest Model" duration=2000}
:::

:::counter{from=0 to=78.1 suffix="%" decimals=1 label="Gap Closed" duration=2200}
:::

</div>

### Code & Paper

**github.com/HazyResearch/lolcats** &middot; arXiv 2410.10254

**Thank you!**
