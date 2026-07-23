/* Hero background video: chromeless muted looping embed, poster-first.
   Skips entirely under reduced-motion or Save-Data. */
(function () {
  var mount = document.getElementById('hero-yt');
  var shell = document.querySelector('.hero-video');
  if (!mount || !shell) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.connection && navigator.connection.saveData) return;

  var VIDEO = mount.getAttribute('data-video');

  // best-effort: bias YouTube toward the highest available rendition
  function requestMaxQuality(p) {
    try {
      var levels = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720'];
      var avail = (p.getAvailableQualityLevels && p.getAvailableQualityLevels()) || [];
      for (var i = 0; i < levels.length; i++) {
        if (!avail.length || avail.indexOf(levels[i]) !== -1) { p.setPlaybackQuality(levels[i]); break; }
      }
    } catch (err) {}
  }
  var START = parseInt(mount.getAttribute('data-start') || '0', 10);
  var player = null;

  function init() {
    player = new YT.Player('hero-yt', {
      videoId: VIDEO,
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, start: START,
        playsinline: 1, rel: 0, iv_load_policy: 3, fs: 0, disablekb: 1,
        modestbranding: 1, origin: location.origin
      },
      events: {
        onReady: function (e) {
          window.__heroPlayer = e.target; // debug/ops handle
          e.target.mute();
          requestMaxQuality(e.target);
          e.target.playVideo();
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.PLAYING) {
            // small delay so real frames are rendering before we crossfade in
            setTimeout(function () { shell.classList.add('is-playing'); }, 250);
            requestMaxQuality(e.target);
            startLoopWatch(e.target);
          } else if (e.data === YT.PlayerState.ENDED) {
            // backup only — the loop watcher should restart us before this fires.
            // keep the video layer up: no fade, straight back to the start point.
            e.target.seekTo(START, true);
            e.target.playVideo();
          } else if (e.data === YT.PlayerState.PAUSED) {
            // genuine pause (tab switch etc): fade to poster, never show YT chrome
            shell.classList.remove('is-playing');
            setTimeout(function () { try { e.target.playVideo(); } catch (err) {} }, 150);
          }
        }
      }
    });
  }

  // seamless loop: jump back to START just before the end so YouTube never
  // reaches its end state (no end screen, no fade, no frame flash)
  var loopTimer = null;
  function startLoopWatch(p) {
    if (loopTimer) return;
    loopTimer = setInterval(function () {
      try {
        var st = p.getPlayerState();
        var d = p.getDuration();
        if (st === YT.PlayerState.ENDED) { p.seekTo(START, true); p.playVideo(); return; }
        if (st !== YT.PlayerState.PLAYING) return;
        if (d > 1 && p.getCurrentTime() > d - 1.2) p.seekTo(START, true);
      } catch (err) {}
    }, 250);
  }

  // resume after tab switch / phone unlock instead of sitting on YT's paused UI
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && player && player.playVideo) {
      try { player.mute(); player.playVideo(); } catch (err) {}
    }
  });

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
