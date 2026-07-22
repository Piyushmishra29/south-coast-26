/* BKAS base runtime: scroll reveals */
window.BKAS = window.BKAS || {};
(function () {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14 });
  function arm() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  }
  window.BKAS.armReveals = arm;
  if (document.readyState !== 'loading') arm();
  else document.addEventListener('DOMContentLoaded', arm);
})();
