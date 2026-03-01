/**
 * transitions.js — Slide transition orchestration
 *
 * Applies CSS animation classes based on per-slide transition config.
 * Supports: fade, slide, cube, zoom.
 */
const Transitions = (() => {
  const DURATION = 700; // ms — matches longest CSS animation

  /**
   * Transition from one slide to another.
   * @param {HTMLElement} fromEl  - Current slide element (may be null on init)
   * @param {HTMLElement} toEl    - Next slide element
   * @param {string} type         - Transition type from manifest
   * @param {boolean} forward     - Direction of navigation
   */
  function run(fromEl, toEl, type, forward) {
    // Clean any leftover transition classes
    if (fromEl) stripTransitionClasses(fromEl);
    stripTransitionClasses(toEl);

    const dir = forward ? 'forward' : 'backward';

    if (!fromEl) {
      // First slide — just fade in
      toEl.classList.add('active');
      toEl.classList.add('transition-fade-enter');
      toEl.addEventListener('animationend', () => {
        stripTransitionClasses(toEl);
      }, { once: true });
      return;
    }

    // Exit animation on current slide
    const exitClass = getExitClass(type, dir);
    fromEl.classList.add(exitClass);

    // Enter animation on next slide
    const enterClass = getEnterClass(type, dir);
    toEl.classList.add('active');
    toEl.classList.add(enterClass);

    // Clean up after animations complete
    setTimeout(() => {
      fromEl.classList.remove('active');
      stripTransitionClasses(fromEl);
      stripTransitionClasses(toEl);
    }, DURATION);
  }

  function getEnterClass(type, dir) {
    switch (type) {
      case 'cube':  return `transition-cube-enter-${dir}`;
      case 'zoom':  return 'transition-zoom-enter';
      case 'slide': return `transition-slide-enter-${dir}`;
      case 'fade':
      default:      return 'transition-fade-enter';
    }
  }

  function getExitClass(type, dir) {
    switch (type) {
      case 'cube':  return `transition-cube-exit-${dir}`;
      case 'zoom':  return 'transition-zoom-exit';
      case 'slide': return `transition-slide-exit-${dir}`;
      case 'fade':
      default:      return 'transition-fade-exit';
    }
  }

  function stripTransitionClasses(el) {
    if (!el) return;
    const toRemove = [];
    el.classList.forEach(c => {
      if (c.startsWith('transition-')) toRemove.push(c);
    });
    toRemove.forEach(c => el.classList.remove(c));
  }

  return { run, DURATION };
})();
