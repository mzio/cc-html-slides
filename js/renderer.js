/**
 * renderer.js — Markdown→HTML rendering with special component injection
 *
 * Detects :::component blocks in markdown and replaces them with
 * interactive HTML widgets (counters, typewriter, ai-chat, code-gen).
 */
const Renderer = (() => {
  /**
   * Parse custom :::component{attrs} blocks from raw markdown.
   * Replaces them with placeholder divs before marked processes the text,
   * then the engine calls activateComponents() on the rendered slide.
   */
  function preprocessMarkdown(md) {
    // Match :::component{attrs}\ncontent\n::: blocks
    const blockRe = /^:::(\w[\w-]*)\{?([^}\n]*)?\}?\s*\n([\s\S]*?)^:::\s*$/gm;

    return md.replace(blockRe, (_match, name, attrs, content) => {
      const attrStr = (attrs || '').trim();
      const escapedContent = content.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<div class="component" data-component="${name}" data-attrs="${attrStr}" data-content="${escapedContent}"></div>`;
    });

  }

  /**
   * Render a markdown string to HTML.
   */
  function render(md) {
    const processed = preprocessMarkdown(md);
    return marked.parse(processed);
  }

  /**
   * Scan a slide element for component placeholders and activate them.
   */
  function activateComponents(slideEl) {
    const placeholders = slideEl.querySelectorAll('.component[data-component]');
    placeholders.forEach(el => {
      const name = el.dataset.component;
      const attrsRaw = el.dataset.attrs || '';
      const content = el.dataset.content || '';

      // Parse key=value attributes
      const attrs = {};
      attrsRaw.replace(/(\w+)=("[^"]*"|\S+)/g, (_m, k, v) => {
        attrs[k] = v.replace(/^"|"$/g, '');
      });

      switch (name) {
        case 'counter':
          Effects.createCounter(el, attrs);
          break;
        case 'typewriter':
          Effects.createTypewriter(el, content);
          break;
        case 'ai-chat':
          AIDemos.createChat(el, content);
          break;
        case 'code-gen':
          AIDemos.createCodeGen(el, content);
          break;
        case 'feature-grid':
          renderFeatureGrid(el, content);
          break;
        case 'team-grid':
          renderTeamGrid(el, content);
          break;
        case 'pricing-grid':
          renderPricingGrid(el, content);
          break;
        case 'funds-chart':
          renderFundsChart(el, content);
          break;
        default:
          el.innerHTML = `<p style="color: #f66;">[Unknown component: ${name}]</p>`;
      }
    });
  }

  /* Layout components rendered from structured content */

  function renderFeatureGrid(el, content) {
    const items = content.split(/\n{2,}/).filter(Boolean);
    let html = '<div class="feature-grid">';
    items.forEach(item => {
      const lines = item.split('\n');
      const title = lines[0] || '';
      const desc = lines.slice(1).join(' ');
      html += `<div class="feature-item"><h4>${decodeHTML(title)}</h4><p>${decodeHTML(desc)}</p></div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderTeamGrid(el, content) {
    const members = content.split(/\n{2,}/).filter(Boolean);
    let html = '<div class="team-grid">';
    members.forEach(member => {
      const lines = member.split('\n');
      const name = decodeHTML(lines[0] || '');
      const role = decodeHTML(lines[1] || '');
      const bio = decodeHTML(lines.slice(2).join(' '));
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2);
      html += `<div class="team-card">
        <div class="avatar">${initials}</div>
        <h4>${name}</h4>
        <div class="role">${role}</div>
        <p>${bio}</p>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderPricingGrid(el, content) {
    const tiers = content.split(/\n{2,}/).filter(Boolean);
    let html = '<div class="pricing-grid">';
    tiers.forEach(tier => {
      const lines = tier.split('\n');
      const name = decodeHTML(lines[0] || '');
      const price = decodeHTML(lines[1] || '');
      const featured = name.toLowerCase().includes('pro') ? ' featured' : '';
      const features = lines.slice(2).map(f => `<li>${decodeHTML(f)}</li>`).join('');
      html += `<div class="pricing-card${featured}">
        <h4>${name}</h4>
        <div class="price">${price}</div>
        <div class="period">per month</div>
        <ul>${features}</ul>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderFundsChart(el, content) {
    const rows = content.split('\n').filter(Boolean);
    let html = '<div class="funds-chart">';
    rows.forEach(row => {
      const parts = row.split('|').map(s => s.trim());
      const label = decodeHTML(parts[0] || '');
      const pct = parseInt(parts[1], 10) || 0;
      html += `<div class="funds-bar" data-pct="${pct}">
        <span class="label">${label}</span>
        <div class="bar-track"><div class="bar-fill"></div></div>
        <span class="pct">${pct}%</span>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function decodeHTML(str) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  return { render, activateComponents };
})();
