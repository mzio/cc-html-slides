/**
 * blog.js — KaTeX init, math hover effects, scroll observer,
 *           SVG figure builders, canvas chart drawers, counter animation
 */
(() => {
  'use strict';

  const COLORS = {
    cyan: '#0891b2',
    purple: '#7c3aed',
    pink: '#db2777',
    green: '#059669',
    text: '#4b5563',
    muted: '#9ca3af',
    bg: '#f9fafb',
    surface: '#ffffff',
    line: 'rgba(0, 0, 0, 0.08)',
    gridLine: 'rgba(0, 0, 0, 0.06)',
  };
  const ACCENT_CYCLE = [COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.green];

  // Track which figures have been initialized
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

  /* ============================
     Math Hover Effects
     ============================ */
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

        // Scroll-reveal sections
        if (el.classList.contains('scroll-reveal')) {
          el.classList.add('visible');
        }

        // Animated figures — lazy init SVG/canvas
        if (el.classList.contains('animated-figure')) {
          el.classList.add('visible');
          const figType = el.dataset.figure;
          if (figType && !initialized.has(figType)) {
            initialized.add(figType);
            buildFigure(figType);
          }
        }

        // Counter elements
        if (el.hasAttribute('data-counter')) {
          if (!el._counterDone) {
            el._counterDone = true;
            animateBlogCounter(el);
          }
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
      case 'forward-pass': buildForwardPassDiagram(); break;
      case 'gradient-descent': buildGradientDescent(); break;
      case 'neural-network': buildNeuralNetwork(); break;
      case 'loss-chart': drawLossChart(); break;
      case 'accuracy-chart': drawAccuracyChart(); break;
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
     SVG: Forward Pass Flow Diagram
     ============================ */
  function buildForwardPassDiagram() {
    const container = document.getElementById('forward-svg');
    if (!container) return;

    const svg = svgEl('svg', { viewBox: '0 0 750 200' });
    const y = 100;

    // Stages: x → W¹x+b¹ → σ → W²a¹+b² → softmax → ŷ
    const stages = [
      { label: 'x',         x: 50,  color: COLORS.cyan,   w: 60 },
      { label: 'W⁽¹⁾x+b⁽¹⁾', x: 175, color: COLORS.purple, w: 110 },
      { label: 'σ',         x: 310, color: COLORS.pink,   w: 60 },
      { label: 'W⁽²⁾a⁽¹⁾+b⁽²⁾', x: 435, color: COLORS.purple, w: 110 },
      { label: 'softmax',   x: 575, color: COLORS.pink,   w: 80 },
      { label: 'ŷ',         x: 700, color: COLORS.green,  w: 60 },
    ];

    // Sub-labels below each box
    const subLabels = ['Input', 'z⁽¹⁾', 'a⁽¹⁾', 'z⁽²⁾', '', 'Output'];

    // Draw connections first
    for (let i = 0; i < stages.length - 1; i++) {
      const x1 = stages[i].x + stages[i].w / 2;
      const x2 = stages[i + 1].x - stages[i + 1].w / 2;
      const line = svgEl('line', { x1, y1: y, x2, y2: y, stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1.5 });
      svg.appendChild(line);
      // Arrow head
      const arrow = svgEl('polygon', {
        points: `${x2},${y} ${x2 - 6},${y - 4} ${x2 - 6},${y + 4}`,
        fill: 'rgba(0,0,0,0.1)',
      });
      svg.appendChild(arrow);
    }

    // Draw boxes and labels
    stages.forEach((s, i) => {
      const rect = svgEl('rect', {
        x: s.x - s.w / 2, y: y - 25, width: s.w, height: 50,
        rx: 8, fill: 'none', stroke: s.color, 'stroke-width': 2,
      });
      svg.appendChild(rect);

      const text = svgEl('text', {
        x: s.x, y: y + 5, fill: s.color,
        'text-anchor': 'middle', 'font-size': '13', 'font-weight': '600', 'font-family': 'sans-serif',
      });
      text.textContent = s.label;
      svg.appendChild(text);

      if (subLabels[i]) {
        const sub = svgEl('text', {
          x: s.x, y: y + 45, fill: COLORS.muted,
          'text-anchor': 'middle', 'font-size': '11', 'font-family': 'sans-serif',
        });
        sub.textContent = subLabels[i];
        svg.appendChild(sub);
      }
    });

    // Animated dots flowing left to right
    for (let i = 0; i < stages.length - 1; i++) {
      const x1 = stages[i].x + stages[i].w / 2;
      const x2 = stages[i + 1].x - stages[i + 1].w / 2;
      const pathD = `M${x1},${y} L${x2},${y}`;
      const circle = svgEl('circle', { r: 3, fill: stages[i].color });
      const anim = svgEl('animateMotion', {
        dur: '1.2s', repeatCount: 'indefinite',
        begin: `${i * 0.4}s`, path: pathD,
      });
      circle.appendChild(anim);
      svg.appendChild(circle);
    }

    container.appendChild(svg);
  }

  /* ============================
     SVG: Gradient Descent
     ============================ */
  function buildGradientDescent() {
    const container = document.getElementById('gradient-svg');
    if (!container) return;

    const svg = svgEl('svg', { viewBox: '0 0 500 400' });

    // Concentric contour ellipses
    const centerX = 320, centerY = 280;
    const rings = [140, 115, 90, 65, 45, 25];
    rings.forEach((r, i) => {
      const ratio = i / (rings.length - 1);
      const r1 = Math.round(139 * (1 - ratio));
      const g1 = Math.round(92 * (1 - ratio) + 240 * ratio);
      const b1 = Math.round(246 * (1 - ratio) + 255 * ratio);
      const color = `rgb(${r1}, ${g1}, ${b1})`;
      const ellipse = svgEl('ellipse', {
        cx: centerX, cy: centerY,
        rx: r * 1.3, ry: r,
        fill: 'none', stroke: color, 'stroke-width': 1.2, opacity: 0.4 + ratio * 0.3,
      });
      svg.appendChild(ellipse);
    });

    // Minimum marker
    const minDot = svgEl('circle', { cx: centerX, cy: centerY, r: 5, fill: COLORS.green });
    svg.appendChild(minDot);
    const minLabel = svgEl('text', { x: centerX, y: centerY + 22, fill: COLORS.green, 'text-anchor': 'middle', 'font-size': '12', 'font-family': 'sans-serif' });
    minLabel.textContent = 'minimum';
    svg.appendChild(minLabel);

    // Descent path (curved)
    const pathPoints = [
      [80, 80], [120, 120], [165, 155], [200, 190],
      [240, 220], [270, 245], [295, 262], [310, 273], [318, 278],
    ];
    let pathD = `M${pathPoints[0][0]},${pathPoints[0][1]}`;
    for (let i = 1; i < pathPoints.length; i++) {
      const [px, py] = pathPoints[i - 1];
      const [cx, cy] = pathPoints[i];
      const mx = (px + cx) / 2;
      const my = (py + cy) / 2;
      pathD += ` Q${px + (cx - px) * 0.5},${py} ${cx},${cy}`;
    }

    const descentPath = svgEl('path', {
      d: pathD, fill: 'none', stroke: COLORS.cyan,
      'stroke-width': 2, 'stroke-dasharray': '6,4', opacity: 0.6,
    });
    svg.appendChild(descentPath);

    // Animated ball following descent path
    const ball = svgEl('circle', { r: 7, fill: COLORS.cyan });
    const ballGlow = svgEl('circle', { r: 12, fill: `${COLORS.cyan}33` });
    const anim1 = svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: pathD });
    const anim2 = svgEl('animateMotion', { dur: '4s', repeatCount: 'indefinite', path: pathD });
    ballGlow.appendChild(anim2);
    ball.appendChild(anim1);
    svg.appendChild(ballGlow);
    svg.appendChild(ball);

    // Axis labels
    const xLabel = svgEl('text', { x: 460, y: 380, fill: COLORS.muted, 'font-size': '13', 'font-family': 'sans-serif' });
    xLabel.textContent = 'θ₁';
    svg.appendChild(xLabel);
    const yLabel = svgEl('text', { x: 15, y: 30, fill: COLORS.muted, 'font-size': '13', 'font-family': 'sans-serif' });
    yLabel.textContent = 'θ₂';
    svg.appendChild(yLabel);

    // Start label
    const startLabel = svgEl('text', { x: pathPoints[0][0], y: pathPoints[0][1] - 12, fill: COLORS.text, 'text-anchor': 'middle', 'font-size': '12', 'font-family': 'sans-serif' });
    startLabel.textContent = 'start';
    svg.appendChild(startLabel);

    container.appendChild(svg);
  }

  /* ============================
     SVG: Neural Network
     ============================ */
  function buildNeuralNetwork() {
    const container = document.getElementById('network-svg');
    if (!container) return;

    const svg = svgEl('svg', { viewBox: '0 0 600 400' });
    const layers = [3, 4, 2];
    const layerColors = [COLORS.cyan, COLORS.purple, COLORS.green];
    const layerLabels = ['Input (x)', 'Hidden (a⁽¹⁾)', 'Output (ŷ)'];
    const xSpacing = 600 / (layers.length + 1);
    const nodeRadius = 14;
    const positions = []; // [layer][node] = {x, y}

    // Calculate node positions
    layers.forEach((count, li) => {
      const x = xSpacing * (li + 1);
      const totalHeight = (count - 1) * 55;
      const startY = 200 - totalHeight / 2;
      const layerPos = [];
      for (let ni = 0; ni < count; ni++) {
        layerPos.push({ x, y: startY + ni * 55 });
      }
      positions.push(layerPos);
    });

    // Draw connections first (behind nodes)
    for (let li = 0; li < layers.length - 1; li++) {
      positions[li].forEach(from => {
        positions[li + 1].forEach(to => {
          const line = svgEl('line', {
            x1: from.x, y1: from.y, x2: to.x, y2: to.y,
            stroke: 'rgba(0,0,0,0.06)', 'stroke-width': 1,
          });
          // Animated dash pulse
          const len = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
          line.setAttribute('stroke-dasharray', `${len}`);
          line.setAttribute('stroke-dashoffset', `${len}`);
          const anim = svgEl('animate', {
            attributeName: 'stroke-dashoffset', from: `${len}`, to: '0',
            dur: '2s', begin: `${li * 0.5}s`, fill: 'freeze',
          });
          line.appendChild(anim);
          svg.appendChild(line);
        });
      });
    }

    // Draw nodes
    positions.forEach((layerPos, li) => {
      layerPos.forEach(pos => {
        // Glow
        const glow = svgEl('circle', {
          cx: pos.x, cy: pos.y, r: nodeRadius + 4,
          fill: 'none', stroke: layerColors[li], 'stroke-width': 1, opacity: 0.2,
        });
        svg.appendChild(glow);
        // Node
        const circle = svgEl('circle', {
          cx: pos.x, cy: pos.y, r: nodeRadius,
          fill: COLORS.surface, stroke: layerColors[li], 'stroke-width': 2,
        });
        svg.appendChild(circle);
        // Inner dot
        const inner = svgEl('circle', {
          cx: pos.x, cy: pos.y, r: 4, fill: layerColors[li], opacity: 0.6,
        });
        svg.appendChild(inner);
      });
    });

    // Layer labels
    positions.forEach((layerPos, li) => {
      const x = layerPos[0].x;
      const label = svgEl('text', {
        x, y: 385, fill: COLORS.muted,
        'text-anchor': 'middle', 'font-size': '12', 'font-family': 'sans-serif',
      });
      label.textContent = layerLabels[li];
      svg.appendChild(label);
    });

    container.appendChild(svg);
  }

  /* ============================
     Canvas: Training Loss Curve
     ============================ */
  function drawLossChart() {
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
    const pad = { top: 30, right: 30, bottom: 50, left: 60 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Generate loss data: exponential decay + noise
    const dataLen = 100;
    const data = [];
    for (let i = 0; i < dataLen; i++) {
      const t = i / dataLen;
      const loss = 2.5 * Math.exp(-3.5 * t) + 0.15 + (Math.random() - 0.5) * 0.08 * (1 - t);
      data.push(Math.max(0.1, loss));
    }
    const maxLoss = 2.8;
    const minLoss = 0;

    // Helper: data coords to canvas coords
    function toX(i) { return pad.left + (i / (dataLen - 1)) * plotW; }
    function toY(v) { return pad.top + (1 - (v - minLoss) / (maxLoss - minLoss)) * plotH; }

    // Draw background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= maxLoss; v += 0.5) {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }
    for (let i = 0; i < dataLen; i += 20) {
      const x = toX(i);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, h - pad.bottom);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = COLORS.muted;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxLoss; v += 0.5) {
      ctx.fillText(v.toFixed(1), pad.left - 10, toY(v) + 4);
    }
    ctx.textAlign = 'center';
    for (let i = 0; i < dataLen; i += 20) {
      ctx.fillText(`${i}`, toX(i), h - pad.bottom + 20);
    }

    // Axis titles
    ctx.fillStyle = COLORS.text;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Epoch', w / 2, h - 8);

    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Loss', 0, 0);
    ctx.restore();

    // Self-drawing animation
    let drawn = 0;
    function drawFrame() {
      const end = Math.min(drawn + 2, dataLen);

      // Draw area fill up to current point
      if (drawn > 0) {
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i <= Math.min(end - 1, dataLen - 1); i++) {
          ctx.lineTo(toX(i), toY(data[i]));
        }
        ctx.lineTo(toX(Math.min(end - 1, dataLen - 1)), toY(minLoss));
        ctx.lineTo(toX(0), toY(minLoss));
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        grad.addColorStop(0, 'rgba(8, 145, 178, 0.18)');
        grad.addColorStop(1, 'rgba(8, 145, 178, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw line
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(data[0]));
      for (let i = 1; i <= Math.min(end - 1, dataLen - 1); i++) {
        ctx.lineTo(toX(i), toY(data[i]));
      }
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow dot at tip
      if (end < dataLen) {
        const tipX = toX(end - 1);
        const tipY = toY(data[end - 1]);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.cyan;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8, 145, 178, 0.25)';
        ctx.fill();
      }

      drawn = end;
      if (drawn < dataLen) {
        requestAnimationFrame(drawFrame);
      }
    }
    drawFrame();
  }

  /* ============================
     Canvas: Accuracy Comparison
     ============================ */
  function drawAccuracyChart() {
    const canvas = document.getElementById('accuracy-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 30, right: 40, bottom: 30, left: 140 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const bars = [
      { label: 'NeuralFlow', value: 99.2, color: COLORS.cyan },
      { label: 'GPT-4', value: 94.1, color: COLORS.purple },
      { label: 'Claude 3', value: 92.8, color: COLORS.pink },
      { label: 'Gemini', value: 90.5, color: COLORS.green },
      { label: 'LLaMA 3', value: 87.3, color: '#f59e0b' },
    ];

    const barH = plotH / bars.length * 0.6;
    const gapH = plotH / bars.length * 0.4;
    const maxVal = 100;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= 100; v += 20) {
      const x = pad.left + (v / maxVal) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, h - pad.bottom);
      ctx.stroke();
      // Label
      ctx.fillStyle = COLORS.muted;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${v}%`, x, h - pad.bottom + 18);
    }

    // Animate bars
    const duration = 1500; // ms
    const startTime = performance.now();

    function drawFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      // Clear plot area
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Redraw grid
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for (let v = 0; v <= 100; v += 20) {
        const x = pad.left + (v / maxVal) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, h - pad.bottom);
        ctx.stroke();
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${v}%`, x, h - pad.bottom + 18);
      }

      bars.forEach((bar, i) => {
        const y = pad.top + i * (barH + gapH) + gapH / 2;
        const barWidth = (bar.value / maxVal) * plotW * eased;

        // Bar background track
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.beginPath();
        ctx.roundRect(pad.left, y, plotW, barH, 4);
        ctx.fill();

        // Filled bar
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

        // Value label
        if (barWidth > 40) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${(bar.value * eased).toFixed(1)}%`, pad.left + barWidth - 8, y + barH / 2 + 5);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(drawFrame);
      }
    }
    requestAnimationFrame(drawFrame);
  }

  /* ============================
     Counter Animation
     ============================ */
  function animateBlogCounter(el) {
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
    // Particle background (reuse from effects.js)
    if (typeof Effects !== 'undefined' && Effects.initParticles) {
      Effects.initParticles();
    }

    // KaTeX rendering — wait for auto-render to load
    if (typeof renderMathInElement === 'function') {
      initMath();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        // auto-render.min.js has defer, so wait a tick
        setTimeout(initMath, 100);
      });
    }

    // Scroll observer
    initScrollObserver();
  }

  // Run on DOM ready or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
