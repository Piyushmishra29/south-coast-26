/* ── 026 HERO TICKER — live conditions wire ──────────────────────────────────
   Turns the coral hero marquee into a live "departures board" of surf conditions
   for Weligama. Reuses the surf widget's sessionStorage cache ('bkas-surf-v1') so
   the two never double-fetch. On any failure it leaves the static spot-name
   marquee (authored in the HTML) exactly as-is — that stays the no-JS fallback. */
(function () {
  var ticker = document.querySelector('.hero-ticker');
  if (!ticker) return;
  var track = ticker.querySelector('.hero-ticker-track');
  var groups = ticker.querySelectorAll('.hero-ticker-group');
  if (!track || groups.length < 1) return;

  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(rm && rm.matches);

  /* same endpoints + cache contract as js/075-surf.js (so whichever loads first
     seeds the shared cache and the other reads it) */
  var WX = 'https://api.open-meteo.com/v1/forecast?latitude=5.9721&longitude=80.4297&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia%2FColombo';
  var MR = 'https://marine-api.open-meteo.com/v1/marine?latitude=5.9721&longitude=80.4297&current=wave_height,wave_period,wave_direction,sea_surface_temperature&hourly=sea_level_height_msl&forecast_days=2&timezone=Asia%2FColombo';
  var CACHE_KEY = 'bkas-surf-v1';
  var CACHE_MS = 15 * 60 * 1000;

  var STAR = '\u2003<span class="sep-star"></span>\u2003';   /* the logo's 12-point burst as separator */
  var DEG = '°';
  var DASH = '—';     /* — */
  var MID = '·';      /* · */
  var SPOTS = ['AHANGAMA', 'WELIGAMA', 'MIRISSA', 'HIRIKETIYA'];

  /* ---------- small helpers ---------- */
  function hhmm(iso) { return typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : ''; }
  function round1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  function skyWord(c) {
    if (c === 0) return 'FLAWLESS SUN';
    if (c === 1 || c === 2) return 'HAZY GOLD';
    if (c === 3) return 'CLOUDED OVER';
    if (c === 45 || c === 48) return 'MIST ROLLING IN';
    if (c >= 51 && c <= 65) return 'PASSING RAIN';
    if (c >= 80 && c <= 82) return 'SQUALLS';
    if (c >= 95) return 'THUNDER OUT AT SEA';
    return 'HAZY GOLD';
  }

  /* coast faces SOUTH: wind blows FROM the north quadrant = offshore (clean faces) */
  function windWord(dir) {
    var d = ((dir % 360) + 360) % 360;
    if (d >= 315 || d <= 45) return 'OFFSHORE ' + MID + ' CLEAN';
    if (d >= 135 && d <= 225) return 'ONSHORE ' + MID + ' TEXTURED';
    return 'CROSS-SHORE';
  }

  function feelWord(p) { return p >= 12 ? 'LONG-WALLED' : (p >= 9 ? 'RIDEABLE' : 'SHORT + SCRAPPY'); }

  function crowdWord(month) {
    if (month >= 5 && month <= 9) return 'CROWD: EMPTY ' + DASH + ' OFF-SEASON, THE GOOD KIND';
    if (month === 4 || month === 10 || month === 11) return 'CROWD: LOW ' + DASH + ' SHOULDER SEASON SWEET SPOT';
    return 'CROWD: BUSY ' + DASH + ' HIGH SEASON, GO EARLY';
  }
  function crowdShort(month) {
    if (month >= 5 && month <= 9) return 'CROWD: EMPTY';
    if (month === 4 || month === 10 || month === 11) return 'CROWD: LOW';
    return 'CROWD: BUSY';
  }
  function hourWord(hour) {
    if (hour >= 5 && hour <= 8) return 'DAWN PATROL WINDOW OPEN';
    if (hour >= 16 && hour <= 18) return 'GOLDEN HOUR INCOMING';
    return '';
  }

  /* tide extremes from hourly sea_level_height_msl — same method as the surf widget */
  function analyzeTide(hourly, nowISO) {
    if (!hourly || !hourly.time || !hourly.sea_level_height_msl) return null;
    var t = hourly.time, h = hourly.sea_level_height_msl;
    var now = 0;
    for (var i = 0; i < t.length; i++) { if (t[i] <= nowISO) now = i; else break; }
    if (now >= h.length - 1) return null;

    var rising = h[now + 1] > h[now];
    var nextHigh = '', nextLow = '';
    for (var j = now + 1; j < h.length - 1; j++) {
      var prev = h[j - 1], cur = h[j], nxt = h[j + 1];
      if (!nextHigh && cur >= prev && cur >= nxt && !(cur === prev && cur === nxt)) nextHigh = hhmm(t[j]);
      if (!nextLow && cur <= prev && cur <= nxt && !(cur === prev && cur === nxt)) nextLow = hhmm(t[j]);
      if (nextHigh && nextLow) break;
    }
    return { rising: rising, high: nextHigh, low: nextLow };
  }

  /* local month/hour in Asia/Colombo — the API returns Colombo-local ISO strings */
  function localParts(nowISO) {
    if (typeof nowISO === 'string' && nowISO.length >= 13) {
      return { month: parseInt(nowISO.slice(5, 7), 10), hour: parseInt(nowISO.slice(11, 13), 10) };
    }
    var d = new Date();
    return { month: d.getMonth() + 1, hour: d.getHours() };
  }

  /* ---------- build the wire ---------- */
  function build(data) {
    var wx = data && data.wx && data.wx.current;
    var mr = data && data.mr && data.mr.current;
    if (!wx || !mr) return null;

    var nowISO = mr.time || wx.time || '';
    var parts = localParts(nowISO);

    var temp = Math.round(wx.temperature_2m);
    var sky = skyWord(wx.weather_code);
    var wind = Math.round(wx.wind_speed_10m);
    var waveH = round1(mr.wave_height);
    var waveP = Math.round(mr.wave_period);
    var sst = Math.round(mr.sea_surface_temperature);
    var tide = analyzeTide(data.mr.hourly, nowISO);
    var hf = hourWord(parts.hour);

    var tideSeg = tide ? ('TIDE ' + (tide.rising ? 'RISING' : 'FALLING')) : '';

    /* terse numbers, one charm line (the crowd report) — the band is a wire, not a paragraph */
    var dirShort = windWord(wx.wind_direction_10m).split(' ')[0];
    var segs = [
      'WELIGAMA ' + temp + DEG + ' ' + sky,
      'WIND ' + wind + ' ' + dirShort,
      'SWELL ' + waveH + 'M @ ' + waveP + 'S',
      'WATER ' + sst + DEG,
      tideSeg,
      crowdWord(parts.month),
      '05' + DEG + "58'N 80" + DEG + "25'E"
    ].filter(Boolean);

    var group = segs.join(STAR) + STAR;   /* trailing star = seamless seam between the two groups */
    var summary = temp + DEG + ' ' + sky + ' ' + MID + ' ' + waveH + 'M SWELL ' + MID + ' ' + crowdShort(parts.month);
    return { group: group, summary: summary };
  }

  /* ---------- render ---------- */
  function render(data) {
    var wire = build(data);
    if (!wire) return false;

    if (reduced) {
      /* static, centered single-line summary — never inject the marquee */
      ticker.classList.add('hero-ticker--rm');
      groups[0].innerHTML = wire.summary;
      if (groups[1]) groups[1].textContent = '';
      return true;
    }

    /* live marquee: fill both groups, keep the -50% loop, re-time to hold speed constant */
    for (var i = 0; i < groups.length; i++) groups[i].innerHTML = wire.group;
    requestAnimationFrame(function () {
      var w = track.scrollWidth;
      if (w && isFinite(w)) {
        var dur = w / 70;            /* ~45px/s across the doubled content */
        if (dur < 30) dur = 30;
        track.style.animationDuration = dur.toFixed(1) + 's';
      }
    });
    return true;
  }

  /* ---------- shared cache (identical contract to js/075-surf.js) ---------- */
  function fromCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || (Date.now() - obj.ts) > CACHE_MS) return null;
      return obj.data;
    } catch (e) { return null; }
  }
  function toCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
  }

  function load() {
    var cached = fromCache();
    if (cached && render(cached)) return;

    Promise.all([
      fetch(WX).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch(MR).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    ]).then(function (res) {
      var data = { wx: res[0], mr: res[1] };
      if (render(data)) toCache(data);   /* failure => static marquee stays */
    }).catch(function () { /* stay on the static fallback, no error UI */ });
  }

  /* refresh via the shared 15-min cache; a plain re-render keeps it cheap */
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 3000);
    setInterval(load, CACHE_MS);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
