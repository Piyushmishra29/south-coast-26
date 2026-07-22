/* THE SPOTS — slider controls */
(function () {
  var track = document.querySelector('#spots .spots-track');
  var list = track && track.querySelector('.spots-list');
  var prevBtn = document.querySelector('#spots .spots-btn--prev');
  var nextBtn = document.querySelector('#spots .spots-btn--next');
  if (!track || !list || !prevBtn || !nextBtn) return;

  function cardStep() {
    var card = list.querySelector('.spots-card');
    if (!card) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(list).columnGap || getComputedStyle(list).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function updateButtons() {
    var maxScroll = track.scrollWidth - track.clientWidth - 1;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = maxScroll <= 0 || track.scrollLeft >= maxScroll;
  }

  prevBtn.addEventListener('click', function () {
    track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', function () {
    track.scrollBy({ left: cardStep(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
})();
