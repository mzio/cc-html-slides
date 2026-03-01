## Results

### 5-shot MMLU Accuracy

:::comparison-bars{max=80}
LoLCATs (ours) | 73.1 | #6366f1
Llama 3 8B (original) | 66.6 | #8b5cf6
Mamba2 2.7B | 63.5 | #ec4899
SUPRA 8B | 53.7 | #f97316
T2R 8B | 52.3 | #22c55e
:::

:::animated-table{highlight=0}
Model | MMLU | LM Eval Avg | PPL ↓
---|---|---|---
LoLCATs (Llama 3 8B) | 73.1 | 73.1 | 8.96
Llama 3 8B Transformer | 66.6 | 74.2 | 6.14
Mamba2 2.7B | 63.5 | 68.9 | —
SUPRA 8B | 53.7 | 63.2 | 9.53
T2R 8B | 52.3 | 61.4 | 10.27
:::

**+20 points** over prior linearization on MMLU.
