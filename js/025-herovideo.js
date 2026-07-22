/* Hero background video: chromeless muted looping embed, poster-first.
   Skips entirely under reduced-motion or Save-Data. */
(function () {
  var mount = document.getElementById('hero-yt');
  var shell = document.querySelector('.hero-video');
  if (!mount || !shell) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.connection && navigator.connection.saveData) return;

  var VIDEO = mount.getAttribute('data-video');
  var player = null;

  function init() {
    player = new YT.Player('hero-yt', {
      videoId: VIDEO,
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: VIDEO,
        playsinline: 1, rel: 0, iv_load_policy: 3, fs: 0, disablekb: 1,
        modestbranding: 1, origin: location.origin
      },
      events: {
        onReady: function (e) {
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) shell.classList.add('is-playing');
          if (e.data === YT.PlayerState.ENDED) e.target.playVideo();
        }
      }
    });
  }

  function boot() {
    if (window.YT && window.YT.Player) { init(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      init();
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { /* poster image stays — nothing to do */ };
    document.head.appendChild(s);
  }

  // don't compete with the preloader/LCP: start after load (or 2.5s fallback)
  if (document.readyState === 'complete') boot();
  else {
    window.addEventListener('load', function () { setTimeout(boot, 300); });
    setTimeout(boot, 2500);
  }
})();
