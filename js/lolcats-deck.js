/**
 * lolcats-deck.js — Custom components for the LoLCATs ICLR deck.
 *
 * Loaded BEFORE engine.js. Wraps Renderer.activateComponents to handle
 * custom component types: animated-table, comparison-bars, diagram.
 * Also adds KaTeX post-render hook and slide-enter animations.
 */
const LolcatsDeck = (() => {
  'use strict';

  /* ============================
     Component Registration
     ============================ */
  const _origActivate = Renderer.activateComponents.bind(Renderer);

  Renderer.activateComponents = function (slideEl) {
    // Pre-process custom components so the original doesn't mark them as unknown
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
    const divider = rows[1]; // skip the |---|---| row
    const dataRows = rows.slice(2);

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
      setTimeout(() => tr.classList.add('visible'), 150 + i * 120);
    });
  }

  /* ============================
     Comparison Bars
     ============================ */
  function renderComparisonBars(el, content, attrs) {
    const rows = content.split('\n').filter(Boolean);
    const maxVal = parseFloat(attrs.max) || 100;

    let html = '<div class="comparison-bars">';
    rows.forEach(row => {
      const parts = row.split('|').map(s => s.trim());
      const label = parts[0] || '';
      const value = parseFloat(parts[1]) || 0;
      const color = parts[2] || 'var(--accent-cyan)';
      const pct = (value / maxVal) * 100;

      html += `<div class="comp-bar" data-value="${pct}">
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
      if (fill) {
        fill.style.width = '0%';
        setTimeout(() => {
          fill.style.width = pct + '%';
        }, 200 + i * 100);
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
      default: el.innerHTML = `<p style="color:var(--text-muted);">[Diagram: ${type}]</p>`;
    }
  }

  function buildPipelineDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 800 180' });

    const stages = [
      { label: 'Pretrained\nTransformer', x: 80, w: 120, color: '#8888a0' },
      { label: 'Attention\nTransfer', x: 280, w: 110, color: '#00f0ff' },
      { label: 'Linearized\nModel', x: 470, w: 110, color: '#8b5cf6' },
      { label: 'LoRA\nFinetuning', x: 640, w: 100, color: '#10b981' },
      { label: 'Final\nModel', x: 790, w: 90, color: '#ec4899' },
    ];

    // Arrows
    for (let i = 0; i < stages.length - 1; i++) {
      const x1 = stages[i].x + stages[i].w / 2;
      const x2 = stages[i + 1].x - stages[i + 1].w / 2;
      const line = svgEl('line', { x1, y1: 90, x2, y2: 90, stroke: 'rgba(255,255,255,0.2)', 'stroke-width': 2 });
      svg.appendChild(line);
      const arrow = svgEl('polygon', { points: `${x2},90 ${x2 - 8},85 ${x2 - 8},95`, fill: 'rgba(255,255,255,0.2)' });
      svg.appendChild(arrow);

      // Animated dot
      const dot = svgEl('circle', { r: 3, fill: stages[i].color });
      const anim = svgEl('animateMotion', { dur: '2s', repeatCount: 'indefinite', begin: `${i * 0.5}s`, path: `M${x1},90 L${x2},90` });
      dot.appendChild(anim);
      svg.appendChild(dot);
    }

    // Boxes
    stages.forEach(s => {
      const rect = svgEl('rect', { x: s.x - s.w / 2, y: 60, width: s.w, height: 60, rx: 10, fill: 'none', stroke: s.color, 'stroke-width': 2 });
      svg.appendChild(rect);
      const lines = s.label.split('\n');
      lines.forEach((line, li) => {
        const text = svgEl('text', {
          x: s.x, y: 90 + (li - (lines.length - 1) / 2) * 16,
          fill: s.color, 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '600', 'font-family': 'sans-serif',
        });
        text.textContent = line;
        svg.appendChild(text);
      });
    });

    // Stage labels
    const sLabels = [
      { text: 'Stage 1: MSE Loss', x: 280, color: '#00f0ff' },
      { text: 'Stage 2: NTP Loss', x: 640, color: '#10b981' },
    ];
    sLabels.forEach(sl => {
      const text = svgEl('text', {
        x: sl.x, y: 150, fill: sl.color,
        'text-anchor': 'middle', 'font-size': '11', 'font-weight': '500', 'font-family': 'sans-serif',
      });
      text.textContent = sl.text;
      svg.appendChild(text);
    });

    container.appendChild(svg);
  }

  function buildHybridDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 700 200' });

    // Token row
    const tokCount = 20;
    const tokW = 26;
    const tokGap = 3;
    const startX = 350 - (tokCount * (tokW + tokGap)) / 2;
    const tokY = 20;

    for (let i = 0; i < tokCount; i++) {
      const x = startX + i * (tokW + tokGap);
      const isWindow = i >= tokCount - 4;
      const color = isWindow ? '#ec4899' : '#8b5cf6';
      const opacity = isWindow ? 0.65 : 0.25;
      const rect = svgEl('rect', { x, y: tokY, width: tokW, height: 16, rx: 3, fill: color, opacity });
      svg.appendChild(rect);
    }

    // Labels
    const midLin = startX + (tokCount - 4) * (tokW + tokGap) / 2;
    const midWin = startX + (tokCount - 2) * (tokW + tokGap);
    [
      { text: 'Linear Attention — O(d·d\')', x: midLin, y: 55, color: '#8b5cf6' },
      { text: 'Softmax Window — O(w²d)', x: midWin, y: 55, color: '#ec4899' },
    ].forEach(l => {
      const t = svgEl('text', { x: l.x, y: l.y, fill: l.color, 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '600', 'font-family': 'sans-serif' });
      t.textContent = l.text;
      svg.appendChild(t);
    });

    // Processing boxes
    const boxes = [
      { label: 'φ_q(q)ᵀ S_n', x: 200, y: 85, w: 160, color: '#8b5cf6' },
      { label: 'exp(qᵀk/√d)', x: 500, y: 85, w: 160, color: '#ec4899' },
    ];
    boxes.forEach(b => {
      const rect = svgEl('rect', { x: b.x - b.w / 2, y: b.y, width: b.w, height: 40, rx: 8, fill: 'none', stroke: b.color, 'stroke-width': 2 });
      svg.appendChild(rect);
      const text = svgEl('text', { x: b.x, y: b.y + 25, fill: b.color, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '600', 'font-family': 'sans-serif' });
      text.textContent = b.label;
      svg.appendChild(text);
    });

    // Merge
    const mergeBox = svgEl('rect', { x: 270, y: 150, width: 160, height: 36, rx: 8, fill: 'none', stroke: '#10b981', 'stroke-width': 2 });
    svg.appendChild(mergeBox);
    const mergeText = svgEl('text', { x: 350, y: 173, fill: '#10b981', 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '700', 'font-family': 'sans-serif' });
    mergeText.textContent = 'Combined ŷ_n';
    svg.appendChild(mergeText);

    // Arrows to merge
    [[200, 125, 310, 150], [500, 125, 390, 150]].forEach(([x1, y1, x2, y2]) => {
      const line = svgEl('line', { x1, y1, x2, y2, stroke: 'rgba(255,255,255,0.15)', 'stroke-width': 1.5 });
      svg.appendChild(line);
    });

    container.appendChild(svg);
  }

  function buildBlockwiseDiagram(container) {
    const svg = svgEl('svg', { viewBox: '0 0 700 180' });

    // Layer blocks
    const blockCount = 4;
    const blockW = 140;
    const gap = 20;
    const startX = 350 - (blockCount * (blockW + gap) - gap) / 2;

    const colors = ['#00f0ff', '#8b5cf6', '#ec4899', '#10b981'];
    const labels = ['Layers 1–20', 'Layers 21–40', 'Layers 41–60', 'Layers 61–80'];

    for (let i = 0; i < blockCount; i++) {
      const x = startX + i * (blockW + gap);

      // Block outline
      const rect = svgEl('rect', { x, y: 30, width: blockW, height: 80, rx: 10, fill: 'none', stroke: colors[i], 'stroke-width': 2, 'stroke-dasharray': '6,3', opacity: 0.6 });
      svg.appendChild(rect);

      // Label
      const text = svgEl('text', { x: x + blockW / 2, y: 65, fill: colors[i], 'text-anchor': 'middle', 'font-size': '12', 'font-weight': '600', 'font-family': 'sans-serif' });
      text.textContent = labels[i];
      svg.appendChild(text);

      // Sub-label
      const sub = svgEl('text', { x: x + blockW / 2, y: 85, fill: '#8888a0', 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'sans-serif' });
      sub.textContent = 'Independent MSE';
      svg.appendChild(sub);

      // Check mark
      const check = svgEl('text', { x: x + blockW / 2, y: 145, fill: colors[i], 'text-anchor': 'middle', 'font-size': '18', 'font-family': 'sans-serif' });
      check.textContent = '✓';
      svg.appendChild(check);

      // "Parallel" label
      const par = svgEl('text', { x: x + blockW / 2, y: 165, fill: '#555566', 'text-anchor': 'middle', 'font-size': '9', 'font-family': 'sans-serif' });
      par.textContent = 'GPU ' + (i + 1);
      svg.appendChild(par);
    }

    container.appendChild(svg);
  }

  /* ============================
     KaTeX Boot (deferred)
     ============================ */
  function initKaTeX() {
    // Retry until KaTeX is loaded (defer scripts)
    if (typeof renderMathInElement !== 'function') {
      setTimeout(initKaTeX, 100);
      return;
    }
    // KaTeX is ready — it'll be invoked per-slide in onSlideEnter
  }
  setTimeout(initKaTeX, 200);

  return { };
})();
