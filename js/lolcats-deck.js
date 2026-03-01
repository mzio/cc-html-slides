/**
 * lolcats-deck.js — Custom components for the LoLCATs ICLR deck.
 *
 * Loaded BEFORE engine.js. Wraps Renderer.render to protect LaTeX math
 * from marked.js, adds custom component handlers, and hooks slide-enter
 * for KaTeX rendering + animations.
 */
const LolcatsDeck = (() => {
  'use strict';

  /* ============================
     Rainbow palette
     ============================ */
  const RAINBOW = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  ];

  /* Light-theme diagram colors */
  const C = {
    text: '#374151',
    muted: '#9ca3af',
    border: 'rgba(0,0,0,0.1)',
    surface: '#f3f4f6',
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    pink: '#ec4899',
  };

  /* ============================
     Protect LaTeX from marked.js
     ============================ */
  const _origRender = Renderer.render.bind(Renderer);

  Renderer.render = function (md) {
    const mathStore = [];

    // 1. Protect HTML blocks containing math (e.g. <div class="math-display">$$...$$</div>)
    let safe = md.replace(/<div[^>]*class="math-display"[^>]*>[\s\S]*?<\/div>/gi, (match) => {
      mathStore.push(match);
      return `<!--MATH_${mathStore.length - 1}-->`;
    });

    // 2. Protect display math $$...$$ (multiline)
    safe = safe.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      mathStore.push(match);
      return `<!--MATH_${mathStore.length - 1}-->`;
    });

    // 3. Protect inline math $...$  (single line, non-greedy)
    safe = safe.replace(/\$([^\$\n]+?)\$/g, (match) => {
      mathStore.push(match);
      return `<!--MATH_${mathStore.length - 1}-->`;
    });

    // Run original render (preprocessMarkdown → marked.parse)
    let html = _origRender(safe);

    // Restore math from placeholders
    html = html.replace(/<!--MATH_(\d+)-->/g, (_, idx) => mathStore[parseInt(idx, 10)]);

    return html;
  };

  /* ============================
     Component Registration
     ============================ */
  const _origActivate = Renderer.activateComponents.bind(Renderer);

  Renderer.activateComponents = function (slideEl) {
    slideEl.querySelectorAll('.component[data-component]').forEach(el => {
      const name = el.dataset.component;
      const content = (el.dataset.content || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const attrsRaw = el.dataset.attrs || '';
      const attrs = {};
      attrsRaw.replace(/(\w[\w-]*)=("[^"]*"|\S+)/g, (_m, k, v) => {
        attrs[k] = v.replace(/^"|"$/g, '');
      });

      switch (name) {
        case 'animated-table':
          renderAnimatedTable(el, content, attrs);
          el.removeAttribute('data-component');
          break;
        case 'comparison-bars':
          renderComparisonBars(el, content, attrs);
          el.removeAttribute('data-component');
          break;
        case 'diagram':
          renderDiagram(el, attrs);
          el.removeAttribute('data-component');
          break;
      }
    });

    _origActivate(slideEl);
  };

  /* ============================
     KaTeX Post-Render
     ============================ */
  const _origOnSlideEnter = Effects.onSlideEnter;
  Effects.onSlideEnter = function (slideEl) {
    _origOnSlideEnter(slideEl);

    // Render KaTeX math
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(slideEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }

    // Animate table rows
    animateTableRows(slideEl);

    // Animate comparison bars
    animateCompBars(slideEl);
  };

  /* ============================
     Animated Table
     ============================ */
  function renderAnimatedTable(el, content, attrs) {
    const rows = content.split('\n').filter(Boolean);
    if (rows.length < 2) return;

    const headers = rows[0].split('|').map(s => s.trim());
    const dataRows = rows.slice(2); // skip divider row

    const highlightIdx = attrs.highlight ? parseInt(attrs.highlight, 10) : -1;

    let html = '<div class="animated-table-wrap"><table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    dataRows.forEach((row, i) => {
      const cells = row.split('|').map(s => s.trim());
      const cls = (i === highlightIdx) ? ' class="highlight"' : '';
      html += `<tr${cls}>`;
      cells.forEach(c => { html += `<td>${c}</td>`; });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  function animateTableRows(slideEl) {
    const tables = slideEl.querySelectorAll('.animated-table-wrap tbody tr');
    tables.forEach((tr, i) => {
      tr.classList.remove('visible');
      setTimeout(() => tr.classList.add('visible'), 200 + i * 150);
    });
  }

  /* ============================
     Comparison Bars — Rainbow
     ============================ */
  function renderComparisonBars(el, content, attrs) {
    const rows = content.split('\n').filter(Boolean);
    const maxVal = parseFloat(attrs.max) || 100;

    let html = '<div class="comparison-bars">';
    rows.forEach((row, i) => {
      const parts = row.split('|').map(s => s.trim());
      const label = parts[0] || '';
      const value = parseFloat(parts[1]) || 0;
      // Use rainbow color cycling, or explicit color from content
      const color = parts[2] || RAINBOW[i % RAINBOW.length];
      const pct = (value / maxVal) * 100;

      html += `<div class="comp-bar" data-value="${pct}" data-idx="${i}">
        <span class="comp-label">${label}</span>
        <div class="comp-track">
          <div class="comp-fill" style="background:${color};">
            <span class="comp-value">${value}</span>
          </div>
        </div>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function animateCompBars(slideEl) {
    const bars = slideEl.querySelectorAll('.comp-bar');
    bars.forEach((bar, i) => {
      const fill = bar.querySelector('.comp-fill');
      const pct = bar.dataset.value;
      bar.classList.remove('visible');
      if (fill) {
        fill.style.width = '0%';
        setTimeout(() => {
          bar.classList.add('visible');
          fill.style.width = pct + '%';
        }, 250 + i * 180);
      }
    });
  }

  /* ============================
     SVG Diagrams
     ============================ */
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function renderDiagram(el, attrs) {
    const type = attrs.type;
    el.classList.add('deck-diagram');
    switch (type) {
      case 'pipeline': buildPipelineDiagram(el); break;
      case 'hybrid': buildHybridDiagram(el); break;
      case 'blockwise': buildBlockwiseDiagram(el); break;
      default: el.innerHTML = `<p style="color:${C.muted};">[Diagram: ${type}]</p>`;
    }
  }

  /* ---- Pipeline Diagram ---- */
  function buildPipelineDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 800 180' });

    const stages = [
      { label: 'Pretrained\nTransformer', x: 80, w: 120, color: C.muted },
      { label: 'Attention\nTransfer', x: 280, w: 110, color: C.blue },
      { label: 'Linearized\nModel', x: 470, w: 110, color: C.violet },
      { label: 'LoRA\nFinetuning', x: 640, w: 100, color: C.green },
      { label: 'Final\nModel', x: 790, w: 90, color: C.pink },
    ];

    // Background glow circles
    stages.forEach(s => {
      const glow = svgEl('circle', { cx: s.x, cy: 90, r: 50, fill: s.color, opacity: 0.06 });
      svg.appendChild(glow);
    });

    // Arrows
    for (let i = 0; i < stages.length - 1; i++) {
      const x1 = stages[i].x + stages[i].w / 2;
      const x2 = stages[i + 1].x - stages[i + 1].w / 2;
      const line = svgEl('line', {
        x1, y1: 90, x2, y2: 90,
        stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 2,
      });
      svg.appendChild(line);
      const arrow = svgEl('polygon', {
        points: `${x2},90 ${x2 - 8},85 ${x2 - 8},95`,
        fill: 'rgba(0,0,0,0.12)',
      });
      svg.appendChild(arrow);

      // Animated dot
      const dot = svgEl('circle', { r: 4, fill: stages[i + 1].color, opacity: 0.8 });
      const anim = svgEl('animateMotion', {
        dur: '2s', repeatCount: 'indefinite',
        begin: `${i * 0.5}s`,
        path: `M${x1},90 L${x2},90`,
      });
      dot.appendChild(anim);
      svg.appendChild(dot);
    }

    // Boxes
    stages.forEach(s => {
      const rect = svgEl('rect', {
        x: s.x - s.w / 2, y: 60, width: s.w, height: 60, rx: 12,
        fill: '#ffffff', stroke: s.color, 'stroke-width': 2,
      });
      svg.appendChild(rect);
      const lines = s.label.split('\n');
      lines.forEach((line, li) => {
        const text = svgEl('text', {
          x: s.x, y: 90 + (li - (lines.length - 1) / 2) * 16,
          fill: s.color, 'text-anchor': 'middle',
          'font-size': '12', 'font-weight': '600', 'font-family': 'Roboto, sans-serif',
        });
        text.textContent = line;
        svg.appendChild(text);
      });
    });

    // Stage labels
    [
      { text: 'Stage 1: MSE Loss', x: 280, color: C.blue },
      { text: 'Stage 2: NTP Loss', x: 640, color: C.green },
    ].forEach(sl => {
      const text = svgEl('text', {
        x: sl.x, y: 150, fill: sl.color,
        'text-anchor': 'middle', 'font-size': '11', 'font-weight': '500',
        'font-family': 'Roboto, sans-serif',
      });
      text.textContent = sl.text;
      svg.appendChild(text);
    });

    container.appendChild(svg);
  }

  /* ---- Hybrid Attention Diagram ---- */
  function buildHybridDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 700 200' });

    const tokCount = 20;
    const tokW = 26;
    const tokGap = 3;
    const startX = 350 - (tokCount * (tokW + tokGap)) / 2;
    const tokY = 20;

    for (let i = 0; i < tokCount; i++) {
      const x = startX + i * (tokW + tokGap);
      const isWindow = i >= tokCount - 4;
      const color = isWindow ? C.pink : RAINBOW[i % RAINBOW.length];
      const opacity = isWindow ? 0.7 : 0.35;
      const rect = svgEl('rect', {
        x, y: tokY, width: tokW, height: 16, rx: 3,
        fill: color, opacity,
      });
      svg.appendChild(rect);
    }

    const midLin = startX + (tokCount - 4) * (tokW + tokGap) / 2;
    const midWin = startX + (tokCount - 2) * (tokW + tokGap);
    [
      { text: "Linear Attention — O(d·d')", x: midLin, y: 55, color: C.violet },
      { text: 'Softmax Window — O(w²d)', x: midWin, y: 55, color: C.pink },
    ].forEach(l => {
      const t = svgEl('text', {
        x: l.x, y: l.y, fill: l.color, 'text-anchor': 'middle',
        'font-size': '11', 'font-weight': '600', 'font-family': 'Roboto, sans-serif',
      });
      t.textContent = l.text;
      svg.appendChild(t);
    });

    // Processing boxes
    const boxes = [
      { label: 'φ_q(q)ᵀ S_n', x: 200, y: 85, w: 160, color: C.violet },
      { label: 'exp(qᵀk/√d)', x: 500, y: 85, w: 160, color: C.pink },
    ];
    boxes.forEach(b => {
      const rect = svgEl('rect', {
        x: b.x - b.w / 2, y: b.y, width: b.w, height: 40, rx: 10,
        fill: '#ffffff', stroke: b.color, 'stroke-width': 2,
      });
      svg.appendChild(rect);
      const text = svgEl('text', {
        x: b.x, y: b.y + 25, fill: b.color, 'text-anchor': 'middle',
        'font-size': '13', 'font-weight': '600', 'font-family': 'Roboto, sans-serif',
      });
      text.textContent = b.label;
      svg.appendChild(text);
    });

    // Merge box
    const mergeRect = svgEl('rect', {
      x: 270, y: 150, width: 160, height: 36, rx: 10,
      fill: '#ffffff', stroke: C.green, 'stroke-width': 2,
    });
    svg.appendChild(mergeRect);
    const mergeText = svgEl('text', {
      x: 350, y: 173, fill: C.green, 'text-anchor': 'middle',
      'font-size': '12', 'font-weight': '700', 'font-family': 'Roboto, sans-serif',
    });
    mergeText.textContent = 'Combined ŷ_n';
    svg.appendChild(mergeText);

    // Arrows to merge
    [[200, 125, 310, 150], [500, 125, 390, 150]].forEach(([x1, y1, x2, y2]) => {
      const line = svgEl('line', {
        x1, y1, x2, y2,
        stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1.5,
      });
      svg.appendChild(line);
      // Arrow head
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;
      const px = -uy, py = ux;
      const arrow = svgEl('polygon', {
        points: `${x2},${y2} ${x2 - ux * 7 + px * 4},${y2 - uy * 7 + py * 4} ${x2 - ux * 7 - px * 4},${y2 - uy * 7 - py * 4}`,
        fill: 'rgba(0,0,0,0.12)',
      });
      svg.appendChild(arrow);
    });

    container.appendChild(svg);
  }

  /* ---- Blockwise Training Diagram ---- */
  function buildBlockwiseDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 700 180' });

    const blockCount = 4;
    const blockW = 140;
    const gap = 20;
    const startX = 350 - (blockCount * (blockW + gap) - gap) / 2;

    const colors = [C.blue, C.violet, C.pink, C.green];
    const labels = ['Layers 1–20', 'Layers 21–40', 'Layers 41–60', 'Layers 61–80'];

    for (let i = 0; i < blockCount; i++) {
      const x = startX + i * (blockW + gap);
      const color = colors[i];

      // Glow bg
      const bg = svgEl('rect', {
        x: x - 2, y: 28, width: blockW + 4, height: 84, rx: 12,
        fill: color, opacity: 0.05,
      });
      svg.appendChild(bg);

      // Block outline
      const rect = svgEl('rect', {
        x, y: 30, width: blockW, height: 80, rx: 12,
        fill: '#ffffff', stroke: color, 'stroke-width': 2,
        'stroke-dasharray': '6,3', opacity: 0.8,
      });
      svg.appendChild(rect);

      // Label
      const text = svgEl('text', {
        x: x + blockW / 2, y: 65, fill: color, 'text-anchor': 'middle',
        'font-size': '12', 'font-weight': '700', 'font-family': 'Roboto, sans-serif',
      });
      text.textContent = labels[i];
      svg.appendChild(text);

      // Sub-label
      const sub = svgEl('text', {
        x: x + blockW / 2, y: 85, fill: C.muted, 'text-anchor': 'middle',
        'font-size': '10', 'font-family': 'Roboto, sans-serif',
      });
      sub.textContent = 'Independent MSE';
      svg.appendChild(sub);

      // Checkmark
      const check = svgEl('text', {
        x: x + blockW / 2, y: 145, fill: color, 'text-anchor': 'middle',
        'font-size': '20', 'font-family': 'Roboto, sans-serif',
      });
      check.textContent = '\u2713';
      svg.appendChild(check);

      // GPU label
      const par = svgEl('text', {
        x: x + blockW / 2, y: 165, fill: C.muted, 'text-anchor': 'middle',
        'font-size': '9', 'font-family': 'Roboto, sans-serif',
      });
      par.textContent = 'GPU ' + (i + 1);
      svg.appendChild(par);
    }

    container.appendChild(svg);
  }

  /* ============================
     KaTeX Boot (deferred)
     ============================ */
  function initKaTeX() {
    if (typeof renderMathInElement !== 'function') {
      setTimeout(initKaTeX, 100);
      return;
    }
    // KaTeX ready — will be invoked per-slide in onSlideEnter.
    // Also render the initial slide right away in case it already loaded.
    const active = document.querySelector('.slide.active');
    if (active) {
      renderMathInElement(active, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  }
  setTimeout(initKaTeX, 200);

  return {};
})();
