/**
 * engine.js — Core slide deck engine
 *
 * Fetches manifest + markdown, builds slides, handles navigation.
 */
(async function () {
  const MANIFEST_URL = window.SLIDES_MANIFEST || 'slides.json';

  let manifest = null;
  let slides = [];        // { el, config } for each slide
  let currentIndex = 0;
  let isTransitioning = false;

  const container = document.getElementById('slides-container');
  const progressFill = document.getElementById('progress-fill');
  const slideCounter = document.getElementById('slide-counter');
  const navHint = document.getElementById('nav-hint');

  /* ============================
     Initialization
     ============================ */
  async function init() {
    // Start particle background
    Effects.initParticles();

    // Load manifest
    manifest = await fetchJSON(MANIFEST_URL);
    if (!manifest || !manifest.slides) {
      container.innerHTML = '<p style="color:#f66;text-align:center;padding:4rem;">Failed to load slides.json</p>';
      return;
    }

    // Fetch and render all slides
    await Promise.all(manifest.slides.map(async (cfg, i) => {
      const md = await fetchText(cfg.src);
      const html = Renderer.render(md);

      const section = document.createElement('section');
      section.className = 'slide';
      section.dataset.index = i;
      section.dataset.transition = cfg.transition || manifest.defaults?.transition || 'fade';
      section.innerHTML = `<div class="slide-content">${html}</div>`;

      container.appendChild(section);

      // Activate interactive components
      Renderer.activateComponents(section);

      slides[i] = { el: section, config: cfg };
    }));

    // Navigate to hash or first slide
    const hashIndex = parseInt(location.hash.replace('#', ''), 10);
    currentIndex = (hashIndex >= 0 && hashIndex < slides.length) ? hashIndex : 0;

    // Show first slide
    goToSlide(currentIndex, true);

    // Bind navigation
    bindKeyboard();
    bindTouch();
    bindHashChange();

    // Hide nav hint after first interaction
    setTimeout(() => navHint?.classList.add('hidden'), 5000);
  }

  /* ============================
     Navigation
     ============================ */
  function goToSlide(index, isInit = false) {
    if (index < 0 || index >= slides.length) return;
    if (!isInit && index === currentIndex) return;
    if (isTransitioning && !isInit) return;

    const forward = index >= currentIndex;
    const fromSlide = isInit ? null : slides[currentIndex]?.el;
    const toSlide = slides[index].el;
    const transType = toSlide.dataset.transition || 'fade';

    isTransitioning = true;

    Transitions.run(fromSlide, toSlide, transType, forward);

    currentIndex = index;
    updateProgress();
    updateHash();

    // Trigger slide-enter effects after transition starts
    setTimeout(() => {
      Effects.onSlideEnter(toSlide);
      AIDemos.onSlideEnter(toSlide);
    }, 100);

    // Unlock after transition completes
    setTimeout(() => {
      isTransitioning = false;
    }, Transitions.DURATION + 50);
  }

  function next() {
    if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
  }

  function prev() {
    if (currentIndex > 0) goToSlide(currentIndex - 1);
  }

  function updateProgress() {
    const pct = slides.length > 1
      ? (currentIndex / (slides.length - 1)) * 100
      : 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (slideCounter) slideCounter.textContent = `${currentIndex + 1} / ${slides.length}`;
  }

  function updateHash() {
    history.replaceState(null, '', '#' + currentIndex);
  }

  /* ============================
     Input bindings
     ============================ */
  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      // Don't capture if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      hideNavHint();

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
      }
    });
  }

  function bindTouch() {
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Only trigger on horizontal swipe with sufficient distance
      if (absDx > 50 && absDx > absDy * 1.5) {
        hideNavHint();
        if (dx < 0) next();
        else prev();
      }
    }, { passive: true });
  }

  function bindHashChange() {
    window.addEventListener('hashchange', () => {
      const hashIndex = parseInt(location.hash.replace('#', ''), 10);
      if (hashIndex >= 0 && hashIndex < slides.length && hashIndex !== currentIndex) {
        goToSlide(hashIndex);
      }
    });
  }

  function hideNavHint() {
    navHint?.classList.add('hidden');
  }

  /* ============================
     Fetch helpers
     ============================ */
  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch JSON:', url, e);
      return null;
    }
  }

  async function fetchText(url) {
    try {
      const res = await fetch(url);
      return await res.text();
    } catch (e) {
      console.error('Failed to fetch markdown:', url, e);
      return `# Error\n\nFailed to load: ${url}`;
    }
  }

  /* ============================
     Boot
     ============================ */
  init();
})();
