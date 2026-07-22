/* FLOATING LIVE SURF WIDGET — Weligama (Open-Meteo, no keys). Widget stays hidden on any fetch failure. */
(function () {
  var root = document.getElementById('surf');
  if (!root) return;

  var WX = 'https://api.open-meteo.com/v1/forecast?latitude=5.9721&longitude=80.4297&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=Asia%2FColombo';
  var MR = 'https://marine-api.open-meteo.com/v1/marine?latitude=5.9721&longitude=80.4297&current=wave_height,wave_period,wave_direction,sea_surface_temperature&hourly=sea_level_height_msl&forecast_days=2&timezone=Asia%2FColombo';
  var CACHE_KEY = 'bkas-surf-v1';
  var CACHE_MS = 15 * 60 * 1000;

  var pill = root.querySelector('.surf-pill');
  var card = root.querySelector('.surf-card');

  /* ---------- helpers ---------- */
  function q(field) { return root.querySelectorAll('[data-field="' + field + '"]'); }
  function setField(field, text) {
    q(field).forEach(function (el) { el.textContent = text; });
  }
  function hhmm(iso) { return typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : ''; }
  function round1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  /* ---------- tide analysis from hourly sea_level_height_msl ---------- */
  function analyzeTide(hourly, nowISO) {
    if (!hourly || !hourly.time || !hourly.sea_level_height_msl) return null;
    var t = hourly.time, h = hourly.sea_level_height_msl;
    // current-hour index = last time <= now
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

  /* ---------- render ---------- */
  function render(data) {
    var wx = data.wx && data.wx.current;
    var mr = data.mr && data.mr.current;
    if (!wx || !mr) return false;

    var nowISO = mr.time || wx.time || '';

    setField('wave', round1(mr.wave_height) + 'm');
    setField('period', Math.round(mr.wave_period) + 's Swell');
    setField('sst', Math.round(mr.sea_surface_temperature) + '° Water');
    setField('air', Math.round(wx.temperature_2m) + '°');
    setField('wind', Math.round(wx.wind_speed_10m) + ' km/h');

    // wind arrow points toward the direction the wind blows FROM (meteorological bearing)
    q('windarrow').forEach(function (el) { el.style.transform = 'rotate(' + (wx.wind_direction_10m || 0) + 'deg)'; });

    var tide = analyzeTide(data.mr.hourly, nowISO);
    if (tide) {
      setField('tidestate', tide.rising ? 'Rising' : 'Falling');
      q('tidearrow').forEach(function (el) { el.setAttribute('data-dir', tide.rising ? 'rising' : 'falling'); });
      var line = '';
      if (tide.high) line += 'High ' + tide.high;
      if (tide.low) line += (line ? ' · ' : '') + 'Low ' + tide.low;
      setField('tides', line || '—');
    } else {
      setField('tidestate', '');
      setField('tides', '—');
    }

    setField('foot', 'Open-Meteo · Updated ' + (hhmm(nowISO) || '—'));
    return true;
  }

  /* ---------- reveal ---------- */
  function reveal() {
    root.hidden = false;
    // next frame so the transition runs from the hidden start state
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('surf--live'); });
    });
  }

  /* ---------- expand / collapse ---------- */
  function setExpanded(open) {
    root.setAttribute('data-state', open ? 'expanded' : 'collapsed');
    pill.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.hidden = !open;
    if (open) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onOutside, true);
    } else {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutside, true);
    }
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') { setExpanded(false); pill.focus(); } }
  function onOutside(e) { if (!root.contains(e.target)) setExpanded(false); }

  pill.addEventListener('click', function () {
    setExpanded(root.getAttribute('data-state') !== 'expanded');
  });

  /* ---------- data load (cache-first, then network) ---------- */
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
    if (cached && render(cached)) { reveal(); return; }

    Promise.all([
      fetch(WX).then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch(MR).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    ]).then(function (res) {
      var data = { wx: res[0], mr: res[1] };
      if (render(data)) { toCache(data); reveal(); }   // failure => widget stays hidden
    }).catch(function () { /* stay hidden, no error UI */ });
  }

  /* first user-idle, never competing with LCP */
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 3000);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
