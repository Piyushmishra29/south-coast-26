/* 055 — Real interactive Leaflet map, lazy-loaded from unpkg on scroll approach.
   Degrades to a static SVG fallback if Leaflet fails to load/init within 6s. */
(function () {
  var section = document.getElementById('realmap');
  if (!section) return;
  var canvas = document.getElementById('realmap-canvas');
  if (!canvas) return;

  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var LEAFLET_VER = '1.9.4';
  var CDN = 'https://unpkg.com/leaflet@' + LEAFLET_VER + '/dist/';
  var started = false, done = false;

  // BKAS 12-point sunburst star (from assets/brand/sunburst-star-icon-cream.svg)
  var STAR = '<svg viewBox="0 0 1120 1120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path fill="#F2E9CE" d="M560,60 L637.6,270.2 L810,127 L772.1,347.9 L993,310 L849.8,482.4 '
    + 'L1060,560 L849.8,637.6 L993,810 L772.1,772.1 L810,993 L637.6,849.8 L560,1060 L482.4,849.8 '
    + 'L310,993 L347.9,772.1 L127,810 L270.2,637.6 L60,560 L270.2,482.4 L127,310 L347.9,347.9 '
    + 'L310,127 L482.4,270.2 Z"/></svg>';

  // real coordinates + real night split (CONTRACT-R2)
  var STOPS = [
    { name: 'CMB Airport', lat: 7.1808, lng: 79.8841, meta: 'Arrival & departure', img: 'assets/img/hero.jpg', kind: 'air' },
    { name: 'Ahangama', lat: 5.9738, lng: 80.3626, meta: '2 nights · Tue 01–Thu 03', img: 'assets/img/ahangama.jpg' },
    { name: 'Weligama', lat: 5.9721, lng: 80.4297, meta: '3 nights · THE BASE · Thu 03–Sun 06', img: 'assets/img/weligama.jpg', kind: 'base' },
    { name: 'Mirissa', lat: 5.9448, lng: 80.4590, meta: 'Day trips from base', img: 'assets/img/mirissa.jpg' },
    { name: 'Hiriketiya', lat: 5.9773, lng: 80.6955, meta: '2 nights · Sun 06–Tue 08', img: 'assets/img/hiriketiya.jpg' }
  ];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function fail() {
    if (done) return;
    done = true;
    section.style.display = 'none';
  }

  function build() {
    if (typeof L === 'undefined') { fail(); return; }

    var map = L.map(canvas, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: !reduce,
      zoomAnimation: !reduce,
      markerZoomAnimation: !reduce
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    var pts = [];
    STOPS.forEach(function (t) {
      var mod = t.kind === 'base' ? ' realmap-pin--base' : (t.kind === 'air' ? ' realmap-pin--air' : '');
      var size = t.kind === 'base' ? 42 : 34;
      var icon = L.divIcon({
        className: 'realmap-pin-wrap',
        html: '<div class="realmap-pin' + mod + '">' + STAR + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 2]
      });
      var m = L.marker([t.lat, t.lng], { icon: icon, title: t.name, keyboard: true }).addTo(map);
      var html = '<div class="realmap-pop">'
        + '<img class="realmap-pop-img" src="' + t.img + '" alt="' + esc(t.name) + '" width="180">'
        + '<div class="realmap-pop-body">'
        + '<p class="realmap-pop-name">' + esc(t.name) + '</p>'
        + '<p class="realmap-pop-meta mono">' + esc(t.meta) + '</p>'
        + '</div></div>';
      m.bindPopup(html, { closeButton: true, maxWidth: 220, autoPanPadding: [24, 24] });
      pts.push([t.lat, t.lng]);
    });

    // real OSM-derived route polylines (arrival + coastal trip); [lng,lat] -> [lat,lng]
    fetch('assets/geo/routes.geojson').then(function (r) { return r.json(); }).then(function (geo) {
      [geo.arrival, geo.trip].forEach(function (seg) {
        if (!seg || !seg.length) return;
        var ll = seg.map(function (c) { return [c[1], c[0]]; });
        L.polyline(ll, { color: '#EF3E2E', weight: 3, opacity: .92, dashArray: '6 8', lineCap: 'round', lineJoin: 'round' }).addTo(map);
      });
    }).catch(function () {
      // no geojson: straight dashed segments between stops
      L.polyline(pts, { color: '#EF3E2E', weight: 3, opacity: .92, dashArray: '6 8', lineCap: 'round' }).addTo(map);
    });

    // fit the coast with padding; include CMB but leave headroom up north so the
    // southern towns sit lower/prominent (view biased south)
    map.fitBounds(L.latLngBounds(pts), {
      paddingTopLeft: [28, 74],
      paddingBottomRight: [28, 28],
      animate: false
    });

    // don't hijack page scroll: wheel-zoom only after the user clicks in
    map.on('click focus', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout blur', function () { map.scrollWheelZoom.disable(); });

    done = true;
    canvas.classList.add('is-ready');
    setTimeout(function () { map.invalidateSize(); }, 60);
    if (!reduce) setTimeout(function () { canvas.classList.add('hint-hidden'); }, 5200);
  }

  function boot() {
    if (started) return;
    started = true;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CDN + 'leaflet.css';
    document.head.appendChild(link);

    var s = document.createElement('script');
    s.src = CDN + 'leaflet.js';
    var to = setTimeout(function () { s.onload = s.onerror = null; fail(); }, 6000);
    s.onload = function () { clearTimeout(to); try { build(); } catch (e) { fail(); } };
    s.onerror = function () { clearTimeout(to); fail(); };
    document.head.appendChild(s);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { io.disconnect(); boot(); }
    });
  }, { rootMargin: '400px 0px' });
  io.observe(section);
})();
