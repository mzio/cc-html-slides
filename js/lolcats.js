/**
 * lolcats.js — KaTeX init, math hover, scroll observer,
 *              SVG figures (pipeline, hybrid attention),
 *              canvas charts (MMLU bars, perplexity curve),
 *              counter animation for the LoLCATs blog post
 */
(() => {
  'use strict';

  const COLORS = {
    cyan: '#00f0ff',
    purple: '#8b5cf6',
    pink: '#ec4899',
    green: '#10b981',
    amber: '#f59e0b',
    text: '#8888a0',
    muted: '#555566',
    bg: '#0a0a0f',
    surface: '#12121a',
  };
  const ACCENT_CYCLE = [COLORS.cyan, COLORS.purple, COLORS.pink, COLORS.green];
  const initialized = new Set();

  /* ============================
     KaTeX Init
     ============================ */
  function initMath() {
    if (typeof renderMathInElement !== 'function') return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
    initMathHover();
  }

  function initMathHover() {
    document.querySelectorAll('.math-block[data-hover="true"]').forEach(block => {
      const terms = block.querySelectorAll('.mord, .minner, .mop, .mbin, .mrel');
      terms.forEach(term => {
        term.classList.add('math-term-hover');
        let colorIdx = 0;
        term.addEventListener('mouseenter', () => {
          const color = ACCENT_CYCLE[colorIdx % ACCENT_CYCLE.length];
          term.style.color = color;
          term.style.textShadow = `0 0 8px ${color}80`;
          colorIdx++;
        });
        term.addEventListener('mouseleave', () => {
          term.style.color = '';
          term.style.textShadow = '';
        });
      });
    });
  }

  /* ============================
     Scroll Observer
     ============================ */
  function initScrollObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains('scroll-reveal')) el.classList.add('visible');
        if (el.classList.contains('animated-figure')) {
          el.classList.add('visible');
          const fig = el.dataset.figure;
          if (fig && !initialized.has(fig)) {
            initialized.add(fig);
            buildFigure(fig);
          }
        }
        if (el.hasAttribute('data-counter') && !el._counterDone) {
          el._counterDone = true;
          animateCounter(el);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    document.querySelectorAll('.animated-figure').forEach(el => observer.observe(el));
    document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
  }

  /* ============================
     Figure Dispatcher
     ============================ */
  function buildFigure(type) {
    switch (type) {
      case 'pipeline': buildPipelineDiagram(); break;
      case 'hybrid': buildHybridDiagram(); break;
      case 'loss-chart': drawPerplexityChart(); break;
      case 'mmlu-chart': drawMMLUChart(); break;
    }
  }

  /* ============================
     SVG Helper
     ============================ */
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  /* ============================
     SVG: Two-Stage Pipeline
     ============================ */
  function buildPipelineDiagram() {
    const container = document.getElementById('pipeline-svg');
    if (!container) return;

    const svg = svgEl('svg', { viewBox: '0 0 750 280' });

    // --- Stage 1 box ---
    const s1 = svgEl('rect', {
      x: 20, y: 20, width: 340, height: 240, rx: 12,
      fill: 'none', stroke: COLORS.cyan, 'stroke-width': 2, 'stroke-dasharray': '6,3', opacity: 0.5,
    });
    svg.appendChild(s1);
    const s1Label = svgEl('text', {
      x: 190, y: 50, fill: COLORS.cyan,
      'text-anchor': 'middle', 'font-size': '14', 'font-weight': '700', 'font-family': 'sans-serif',
    });
    s1Label.textContent = 'Stage 1: Attention Transfer';
    svg.appendChild(s1Label);

    // Stage 1 internal blocks
    const s1Blocks = [
      { label: 'Softmax\nAttention', x: 80, y: 100, color: COLORS.purple },
      { label: 'Linear\nAttention', x: 230, y: 100, color: COLORS.cyan },
    ];
    s1Blocks.forEach(b => {
      const rect = svgEl('rect', { x: b.x - 50, y: b.y - 25, width: 100, height: 50, rx: 8, fill: 'none', stroke: b.color, 'stroke-width': 2 });
      svg.appendChild(rect);
      const lines = b.label.split('\n');
      lines.forEach((line, li) => {
        const text = svgEl('text', {
          x: b.x, y: b.y + (li - (lines.length - 1) / 2) * 16 + 5,
          fill: b.color, 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '600', 'font-family': 'sans-serif',
        });
        text.textContent = line;
        svg.appendChild(text);
      });
    });

    // MSE arrow between them
    const mseArrow = svgEl('line', { x1: 130, y1: 100, x2: 180, y2: 100, stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1.5 });
    svg.appendChild(mseArrow);
    const arrowHead1 = svgEl('polygon', { points: '180,100 174,96 174,104', fill: 'rgba(255,255,255,0.3)' });
    svg.appendChild(arrowHead1);

    // MSE label
    const mseLabel = svgEl('text', {
      x: 155, y: 88, fill: COLORS.pink,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    mseLabel.textContent = 'MSE';
    svg.appendChild(mseLabel);

    // Feature maps label
    const fmLabel = svgEl('text', {
      x: 230, y: 165, fill: COLORS.muted,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    fmLabel.textContent = 'Train φ_q, φ_k';
    svg.appendChild(fmLabel);

    // Frozen label
    const frozenLabel = svgEl('text', {
      x: 80, y: 165, fill: COLORS.muted,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    frozenLabel.textContent = 'Frozen weights';
    svg.appendChild(frozenLabel);

    // Params badge
    const paramsBg = svgEl('rect', { x: 105, y: 195, width: 170, height: 28, rx: 14, fill: 'rgba(0,240,255,0.08)', stroke: 'rgba(0,240,255,0.2)', 'stroke-width': 1 });
    svg.appendChild(paramsBg);
    const paramsText = svgEl('text', {
      x: 190, y: 214, fill: COLORS.cyan,
      'text-anchor': 'middle', 'font-size': '11', 'font-weight': '600', 'font-family': 'sans-serif',
    });
    paramsText.textContent = '0.2% parameters · 20M tokens';
    svg.appendChild(paramsText);

    // --- Arrow between stages ---
    const stageArrow = svgEl('line', { x1: 370, y1: 140, x2: 400, y2: 140, stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 2 });
    svg.appendChild(stageArrow);
    const arrowHead2 = svgEl('polygon', { points: '400,140 394,136 394,144', fill: 'rgba(255,255,255,0.3)' });
    svg.appendChild(arrowHead2);

    // --- Stage 2 box ---
    const s2 = svgEl('rect', {
      x: 410, y: 20, width: 320, height: 240, rx: 12,
      fill: 'none', stroke: COLORS.green, 'stroke-width': 2, 'stroke-dasharray': '6,3', opacity: 0.5,
    });
    svg.appendChild(s2);
    const s2Label = svgEl('text', {
      x: 570, y: 50, fill: COLORS.green,
      'text-anchor': 'middle', 'font-size': '14', 'font-weight': '700', 'font-family': 'sans-serif',
    });
    s2Label.textContent = 'Stage 2: LoRA Finetuning';
    svg.appendChild(s2Label);

    // Stage 2 internal blocks
    const s2Blocks = [
      { label: 'Linearized\nModel', x: 490, y: 100, color: COLORS.cyan },
      { label: 'LoRA\nW + BA', x: 640, y: 100, color: COLORS.green },
    ];
    s2Blocks.forEach(b => {
      const rect = svgEl('rect', { x: b.x - 50, y: b.y - 25, width: 100, height: 50, rx: 8, fill: 'none', stroke: b.color, 'stroke-width': 2 });
      svg.appendChild(rect);
      const lines = b.label.split('\n');
      lines.forEach((line, li) => {
        const text = svgEl('text', {
          x: b.x, y: b.y + (li - (lines.length - 1) / 2) * 16 + 5,
          fill: b.color, 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '600', 'font-family': 'sans-serif',
        });
        text.textContent = line;
        svg.appendChild(text);
      });
    });

    // Arrow between Stage 2 blocks
    const loraArrow = svgEl('line', { x1: 540, y1: 100, x2: 590, y2: 100, stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1.5 });
    svg.appendChild(loraArrow);
    const arrowHead3 = svgEl('polygon', { points: '590,100 584,96 584,104', fill: 'rgba(255,255,255,0.3)' });
    svg.appendChild(arrowHead3);

    // NTP label
    const ntpLabel = svgEl('text', {
      x: 565, y: 88, fill: COLORS.pink,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    ntpLabel.textContent = 'NTP loss';
    svg.appendChild(ntpLabel);

    // LoRA description
    const loraDesc = svgEl('text', {
      x: 640, y: 165, fill: COLORS.muted,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    loraDesc.textContent = 'Rank r = 8';
    svg.appendChild(loraDesc);

    // Params badge
    const paramsBg2 = svgEl('rect', { x: 485, y: 195, width: 170, height: 28, rx: 14, fill: 'rgba(16,185,129,0.08)', stroke: 'rgba(16,185,129,0.2)', 'stroke-width': 1 });
    svg.appendChild(paramsBg2);
    const paramsText2 = svgEl('text', {
      x: 570, y: 214, fill: COLORS.green,
      'text-anchor': 'middle', 'font-size': '11', 'font-weight': '600', 'font-family': 'sans-serif',
    });
    paramsText2.textContent = '0.09% parameters · 20M tokens';
    svg.appendChild(paramsText2);

    // Animated dots across stage arrow
    const stagePath = 'M370,140 L400,140';
    const dot = svgEl('circle', { r: 3, fill: COLORS.cyan });
    const dotAnim = svgEl('animateMotion', { dur: '1.5s', repeatCount: 'indefinite', path: stagePath });
    dot.appendChild(dotAnim);
    svg.appendChild(dot);

    container.appendChild(svg);
  }

  /* ============================
     SVG: Hybrid Attention Architecture
     ============================ */
  function buildHybridDiagram() {
    const container = document.getElementById('hybrid-svg');
    if (!container) return;

    const svg = svgEl('svg', { viewBox: '0 0 700 320' });

    // Title row: input tokens flowing in
    const inputLabel = svgEl('text', {
      x: 350, y: 25, fill: COLORS.text,
      'text-anchor': 'middle', 'font-size': '13', 'font-weight': '600', 'font-family': 'sans-serif',
    });
    inputLabel.textContent = 'Input Sequence';
    svg.appendChild(inputLabel);

    // Token row
    const tokenCount = 16;
    const tokenW = 32;
    const tokenGap = 4;
    const rowX = 350 - (tokenCount * (tokenW + tokenGap)) / 2;
    const tokY = 45;

    for (let i = 0; i < tokenCount; i++) {
      const x = rowX + i * (tokenW + tokenGap);
      const isWindow = i >= tokenCount - 4; // last 4 = sliding window
      const color = isWindow ? COLORS.pink : COLORS.purple;
      const opacity = isWindow ? 0.7 : 0.3;
      const rect = svgEl('rect', {
        x, y: tokY, width: tokenW, height: 20, rx: 3,
        fill: color, opacity,
      });
      svg.appendChild(rect);
    }

    // Bracket labels
    // Linear portion
    const linearBracketX1 = rowX;
    const linearBracketX2 = rowX + (tokenCount - 4) * (tokenW + tokenGap) - tokenGap;
    const linBrack = svgEl('line', { x1: linearBracketX1, y1: 75, x2: linearBracketX2, y2: 75, stroke: COLORS.purple, 'stroke-width': 2, opacity: 0.5 });
    svg.appendChild(linBrack);
    const linLabel = svgEl('text', {
      x: (linearBracketX1 + linearBracketX2) / 2, y: 93, fill: COLORS.purple,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    linLabel.textContent = 'Linear Attention (global)';
    svg.appendChild(linLabel);

    // Window portion
    const winBracketX1 = rowX + (tokenCount - 4) * (tokenW + tokenGap);
    const winBracketX2 = rowX + tokenCount * (tokenW + tokenGap) - tokenGap;
    const winBrack = svgEl('line', { x1: winBracketX1, y1: 75, x2: winBracketX2, y2: 75, stroke: COLORS.pink, 'stroke-width': 2, opacity: 0.7 });
    svg.appendChild(winBrack);
    const winLabel = svgEl('text', {
      x: (winBracketX1 + winBracketX2) / 2, y: 93, fill: COLORS.pink,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    winLabel.textContent = 'Softmax (w=64)';
    svg.appendChild(winLabel);

    // --- Two processing boxes ---
    // Linear attention path
    const linBox = svgEl('rect', { x: 60, y: 120, width: 260, height: 80, rx: 10, fill: 'none', stroke: COLORS.purple, 'stroke-width': 2 });
    svg.appendChild(linBox);
    const linTitle = svgEl('text', {
      x: 190, y: 148, fill: COLORS.purple,
      'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', 'font-family': 'sans-serif',
    });
    linTitle.textContent = 'Linear Attention';
    svg.appendChild(linTitle);
    const linEq = svgEl('text', {
      x: 190, y: 172, fill: COLORS.text,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    linEq.textContent = 'φ_q(q)ᵀ S_n  ·  O(d·d\')';
    svg.appendChild(linEq);

    // Softmax window path
    const swBox = svgEl('rect', { x: 380, y: 120, width: 260, height: 80, rx: 10, fill: 'none', stroke: COLORS.pink, 'stroke-width': 2 });
    svg.appendChild(swBox);
    const swTitle = svgEl('text', {
      x: 510, y: 148, fill: COLORS.pink,
      'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', 'font-family': 'sans-serif',
    });
    swTitle.textContent = 'Sliding Window Softmax';
    svg.appendChild(swTitle);
    const swEq = svgEl('text', {
      x: 510, y: 172, fill: COLORS.text,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    swEq.textContent = 'exp(qᵀk/√d)  ·  O(w²d)';
    svg.appendChild(swEq);

    // Merge box
    const mergeBox = svgEl('rect', { x: 240, y: 240, width: 220, height: 55, rx: 10, fill: 'none', stroke: COLORS.green, 'stroke-width': 2 });
    svg.appendChild(mergeBox);
    const mergeTitle = svgEl('text', {
      x: 350, y: 265, fill: COLORS.green,
      'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', 'font-family': 'sans-serif',
    });
    mergeTitle.textContent = 'Combined Output ŷ_n';
    svg.appendChild(mergeTitle);
    const mergeEq = svgEl('text', {
      x: 350, y: 283, fill: COLORS.text,
      'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
    });
    mergeEq.textContent = 'Weighted sum · Subquadratic';
    svg.appendChild(mergeEq);

    // Arrows from processing boxes to merge
    [[190, 200, 300, 240], [510, 200, 400, 240]].forEach(([x1, y1, x2, y2]) => {
      const line = svgEl('line', { x1, y1, x2, y2, stroke: 'rgba(255,255,255,0.2)', 'stroke-width': 1.5 });
      svg.appendChild(line);
      const ah = svgEl('polygon', {
        points: `${x2},${y2} ${x2 - 4},${y2 - 6} ${x2 + 4},${y2 - 6}`,
        fill: 'rgba(255,255,255,0.2)',
      });
      svg.appendChild(ah);
    });

    // Animated dots
    const paths = [
      `M190,200 L300,240`,
      `M510,200 L400,240`,
    ];
    const dotColors = [COLORS.purple, COLORS.pink];
    paths.forEach((p, i) => {
      const c = svgEl('circle', { r: 3, fill: dotColors[i] });
      const a = svgEl('animateMotion', { dur: '2s', repeatCount: 'indefinite', begin: `${i * 0.6}s`, path: p });
      c.appendChild(a);
      svg.appendChild(c);
    });

    container.appendChild(svg);
  }

  /* ============================
     Canvas: Training Perplexity Curve
     ============================ */
  function drawPerplexityChart() {
    const canvas = document.getElementById('loss-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 30, right: 30, bottom: 50, left: 70 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Perplexity data: starts high (pre-transfer), drops with attention transfer, drops more with LoRA
    const dataLen = 100;
    const data = [];
    for (let i = 0; i < dataLen; i++) {
      const t = i / dataLen;
      let ppl;
      if (t < 0.4) {
        // Stage 1: attention transfer — rapid drop
        ppl = 1500 * Math.exp(-8 * t) + 60 + (Math.random() - 0.5) * 15 * (1 - t);
      } else {
        // Stage 2: LoRA — gradual refinement
        const t2 = (t - 0.4) / 0.6;
        ppl = 55 * Math.exp(-2.5 * t2) + 8 + (Math.random() - 0.5) * 2 * (1 - t2);
      }
      data.push(Math.max(7, ppl));
    }

    // Use log scale for y
    const maxPPL = 1600;
    const minPPL = 5;

    function toX(i) { return pad.left + (i / (dataLen - 1)) * plotW; }
    function toY(v) {
      const logMin = Math.log10(minPPL);
      const logMax = Math.log10(maxPPL);
      const logV = Math.log10(Math.max(v, minPPL));
      return pad.top + (1 - (logV - logMin) / (logMax - logMin)) * plotH;
    }

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines (log scale)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const gridPPLs = [10, 50, 100, 500, 1000];
    ctx.fillStyle = COLORS.muted;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    gridPPLs.forEach(v => {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillText(`${v}`, pad.left - 10, y + 4);
    });

    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i < dataLen; i += 20) {
      ctx.fillText(`${i}`, toX(i), h - pad.bottom + 20);
    }

    // Stage divider
    const stageX = toX(40);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(stageX, pad.top);
    ctx.lineTo(stageX, h - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stage labels
    ctx.fillStyle = COLORS.cyan;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Stage 1', (pad.left + stageX) / 2, pad.top + 16);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('Stage 2', (stageX + w - pad.right) / 2, pad.top + 16);

    // Axis titles
    ctx.fillStyle = COLORS.text;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Training Step', w / 2, h - 8);

    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Perplexity (log)', 0, 0);
    ctx.restore();

    // Self-drawing animation
    let drawn = 0;
    function drawFrame() {
      const end = Math.min(drawn + 2, dataLen);

      // Area fill
      if (drawn > 0) {
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i <= Math.min(end - 1, dataLen - 1); i++) {
          ctx.lineTo(toX(i), toY(data[i]));
        }
        ctx.lineTo(toX(Math.min(end - 1, dataLen - 1)), toY(minPPL));
        ctx.lineTo(toX(0), toY(minPPL));
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Line — color based on stage
      for (let i = 1; i <= Math.min(end - 1, dataLen - 1); i++) {
        ctx.beginPath();
        ctx.moveTo(toX(i - 1), toY(data[i - 1]));
        ctx.lineTo(toX(i), toY(data[i]));
        ctx.strokeStyle = i < 40 ? COLORS.cyan : COLORS.green;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Glow tip
      if (end < dataLen) {
        const tipX = toX(end - 1);
        const tipY = toY(data[end - 1]);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = end - 1 < 40 ? COLORS.cyan : COLORS.green;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
        ctx.fillStyle = end - 1 < 40 ? 'rgba(0,240,255,0.2)' : 'rgba(16,185,129,0.2)';
        ctx.fill();
      }

      drawn = end;
      if (drawn < dataLen) requestAnimationFrame(drawFrame);
    }
    drawFrame();
  }

  /* ============================
     Canvas: MMLU Comparison
     ============================ */
  function drawMMLUChart() {
    const canvas = document.getElementById('mmlu-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 30, right: 40, bottom: 30, left: 160 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const bars = [
      { label: 'LoLCATs (Ours)', value: 73.1, color: COLORS.cyan },
      { label: 'Llama 3 8B', value: 66.6, color: COLORS.purple },
      { label: 'Mamba2 2.7B', value: 63.5, color: COLORS.pink },
      { label: 'SUPRA 8B', value: 53.7, color: COLORS.amber },
      { label: 'T2R 8B', value: 52.3, color: COLORS.green },
    ];

    const barH = plotH / bars.length * 0.6;
    const gapH = plotH / bars.length * 0.4;
    const maxVal = 80;
    const minVal = 40;
    const range = maxVal - minVal;

    const duration = 1500;
    const startTime = performance.now();

    function drawFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let v = minVal; v <= maxVal; v += 10) {
        const x = pad.left + ((v - minVal) / range) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.stroke();
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${v}`, x, h - pad.bottom + 18);
      }

      bars.forEach((bar, i) => {
        const y = pad.top + i * (barH + gapH) + gapH / 2;
        const valClamped = Math.max(bar.value, minVal);
        const barWidth = ((valClamped - minVal) / range) * plotW * eased;

        // Track
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.roundRect(pad.left, y, plotW, barH, 4);
        ctx.fill();

        // Bar
        if (barWidth > 0) {
          ctx.fillStyle = bar.color;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(pad.left, y, barWidth, barH, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Label
        ctx.fillStyle = COLORS.text;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(bar.label, pad.left - 12, y + barH / 2 + 5);

        // Value
        if (barWidth > 30) {
          const displayVal = minVal + (bar.value - minVal) * eased;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${displayVal.toFixed(1)}`, pad.left + barWidth - 8, y + barH / 2 + 5);
        }
      });

      if (progress < 1) requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  }

  /* ============================
     Counter Animation
     ============================ */
  function animateCounter(el) {
    const from = parseFloat(el.dataset.from) || 0;
    const to = parseFloat(el.dataset.to) || 0;
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const valueEl = el.querySelector('.stat-value');
    if (!valueEl) return;

    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      if (decimals > 0) {
        valueEl.textContent = current.toFixed(decimals) + suffix;
      } else {
        valueEl.textContent = Math.round(current).toLocaleString('en-US') + suffix;
      }

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================
     Boot
     ============================ */
  function boot() {
    if (typeof Effects !== 'undefined' && Effects.initParticles) {
      Effects.initParticles();
    }

    if (typeof renderMathInElement === 'function') {
      initMath();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMath, 100);
      });
    }

    initScrollObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
