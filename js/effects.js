/**
 * effects.js — Particle system, animated counters, typewriter effect
 */
const Effects = (() => {
  /* ============================
     Particle System
     ============================ */
  let particles = [];
  let canvas, ctx;
  let animFrameId;
  const PARTICLE_COUNT = 80;
  const CONNECTION_DIST = 120;

  function initParticles() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    spawnParticles();
    animateParticles();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawnParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animFrameId = requestAnimationFrame(animateParticles);
  }

  /* ============================
     Animated Counter
     ============================ */
  function createCounter(el, attrs) {
    const from = parseFloat(attrs.from) || 0;
    const to = parseFloat(attrs.to) || 0;
    const duration = parseInt(attrs.duration, 10) || 2000;
    const prefix = attrs.prefix || '';
    const suffix = attrs.suffix || '';
    const decimals = attrs.decimals ? parseInt(attrs.decimals, 10) : 0;
    const label = attrs.label || '';

    el.classList.add('counter-widget');
    el.innerHTML = `
      <div class="stat-value counter-value">${prefix}${formatNum(from, decimals)}${suffix}</div>
      ${label ? `<div class="stat-label">${label}</div>` : ''}
    `;

    // Will be triggered when slide becomes active
    el._counterConfig = { from, to, duration, prefix, suffix, decimals };
  }

  function animateCounter(el) {
    const cfg = el._counterConfig;
    if (!cfg) return;
    const valueEl = el.querySelector('.counter-value');
    if (!valueEl) return;

    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / cfg.duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = cfg.from + (cfg.to - cfg.from) * eased;
      valueEl.textContent = cfg.prefix + formatNum(current, cfg.decimals) + cfg.suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatNum(n, decimals) {
    if (decimals > 0) return n.toFixed(decimals);
    // Add commas for large integers
    return Math.round(n).toLocaleString('en-US');
  }

  /* ============================
     Typewriter Effect
     ============================ */
  function createTypewriter(el, text) {
    const decoded = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    el.classList.add('typewriter-widget');
    el.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor">|</span>';
    el._typewriterText = decoded;
  }

  function animateTypewriter(el) {
    const text = el._typewriterText;
    if (!text) return;
    const span = el.querySelector('.typewriter-text');
    if (!span) return;

    let i = 0;
    span.textContent = '';
    const interval = setInterval(() => {
      if (i < text.length) {
        span.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
  }

  /* ============================
     Slide Enter Effects
     ============================ */
  function onSlideEnter(slideEl) {
    // Animate counters
    slideEl.querySelectorAll('.counter-widget').forEach(animateCounter);

    // Animate typewriters
    slideEl.querySelectorAll('.typewriter-widget').forEach(animateTypewriter);

    // Animate fund bars
    slideEl.querySelectorAll('.funds-bar').forEach(bar => {
      const pct = bar.dataset.pct || 0;
      const fill = bar.querySelector('.bar-fill');
      if (fill) {
        fill.style.width = '0%';
        requestAnimationFrame(() => {
          fill.style.width = pct + '%';
        });
      }
    });
  }

  /* ============================
     Typewriter CSS (injected)
     ============================ */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .typewriter-widget {
        font-size: 1.5rem;
        color: var(--accent-cyan);
        font-family: 'SF Mono', 'Fira Code', monospace;
        padding: 1rem 0;
      }
      .typewriter-cursor {
        animation: blink 0.8s step-end infinite;
        color: var(--accent-cyan);
      }
      @keyframes blink {
        50% { opacity: 0; }
      }
      .counter-widget {
        padding: 1rem 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-inject styles on load
  injectStyles();

  return {
    initParticles,
    createCounter,
    createTypewriter,
    onSlideEnter,
  };
})();
