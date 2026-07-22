/* ── 02 HERO ── gentle scroll parallax on the aerial bg (transform-only, rAF, RM-safe) ── */
(function () {
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (rm && rm.matches) return;

  var hero = document.getElementById('hero');
  if (!hero) return;
  var bg = hero.querySelector('.hero-bg');
  if (!bg) return;

  var ticking = false;
  var inView = true;

  // gate scroll work to when the hero is actually on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
    }).observe(hero);
  }

  function apply() {
    ticking = false;
    if (!inView) return;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    // slow drift: bg moves at ~18% of scroll, kept subtle and clamped
    var shift = Math.min(y * 0.18, 120);
    bg.style.transform = 'scale(1.06) translate3d(0,' + shift.toFixed(2) + 'px,0)';
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(apply);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  apply();
})();
