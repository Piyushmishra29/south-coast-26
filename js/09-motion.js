/* ============================================================
   09-motion.js — BKAS South Coast '26 motion layer
   Vanilla, defensive, IIFE. Loaded with `defer` after all
   section scripts. Every DOM lookup is null-checked; nothing
   throws if a section is missing. All scroll work happens in a
   single rAF loop with one scrollY read and zero layout reads.
   Fully inert under prefers-reduced-motion (CSS handles the
   static fallback).
   ============================================================ */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq && mq.matches) return; // reduced motion: do nothing, CSS stays static.

  var doc = document;
  var body = doc.body;
  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (cb) { return setTimeout(cb, 16); };
  var hasIO = 'IntersectionObserver' in window;

  function ready(fn) {
    if (doc.readyState !== 'loading') fn();
    else doc.addEventListener('DOMContentLoaded', fn);
  }

  // Absolute document top via the offset chain — measured once (and on
  // resize), never inside the scroll loop.
  function docTop(el) {
    var t = 0;
    while (el) { t += el.offsetTop || 0; el = el.offsetParent; }
    return t;
  }

  function observeOnce(el, cb, threshold) {
    if (!el) return;
    if (!hasIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(); io.unobserve(e.target); }
      });
    }, { threshold: threshold || 0.2 });
    io.observe(el);
  }

  // ============================================================
  // 1. HEADLINE RISE — split a heading into rising word masks
  // ============================================================
  function makeMask(cls) {
    var outer = doc.createElement('span');
    outer.className = cls;
    var inner = doc.createElement('span');
    inner.className = cls + '-inner';
    outer.appendChild(inner);
    return { outer: outer, inner: inner };
  }

  function splitHeading(h) {
    if (!h || h.dataset.motionSplit || !h.childNodes.length) return;
    h.dataset.motionSplit = '1';

    var frag = doc.createDocumentFragment();
    var kids = Array.prototype.slice.call(h.childNodes);

    kids.forEach(function (node) {
      if (node.nodeType === 3) {
        // pure text -> split into word masks, keep whitespace as plain nodes
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (p) {
          if (p === '') return;
          if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
          var m = makeMask('motion-word');
          m.inner.textContent = p;
          frag.appendChild(m.outer);
        });
      } else {
        // element child (inline SVG star, accent span, count chip) ->
        // move it whole into its own rising unit; never split its guts.
        var u = makeMask('motion-unit');
        u.inner.appendChild(node); // move (not clone) so references survive
        frag.appendChild(u.outer);
      }
    });

    h.textContent = '';
    h.appendChild(frag);

    var inners = h.querySelectorAll('.motion-word-inner, .motion-unit-inner');
    for (var i = 0; i < inners.length; i++) {
      inners[i].style.transitionDelay = (i * 60) + 'ms';
    }
    h.classList.add('motion-h');
  }

  // ============================================================
  // 3. COUNT-UP — wrap numbers in #money, animate on first reveal
  // ============================================================
  var countEls = [];
  var COUNT_RE = /(₹\s?[\d,]{3,})|(\b21\b)/; // the price and the seat count

  function wrapCounts(root) {
    if (!root || !doc.createTreeWalker) return;
    var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (tn) {
      var parent = tn.parentNode;
      if (!parent || (parent.classList && parent.classList.contains('motion-count'))) return;
      var s = tn.textContent;
      var rx = new RegExp(COUNT_RE.source, 'g');
      if (!rx.test(s)) return;
      rx.lastIndex = 0;

      var frag = doc.createDocumentFragment();
      var last = 0;
      var match;
      while ((match = rx.exec(s))) {
        var token = match[0];
        var start = match.index;
        if (start > last) frag.appendChild(doc.createTextNode(s.slice(last, start)));
        var digits = parseInt(token.replace(/[^\d]/g, ''), 10);
        if (isNaN(digits)) {
          frag.appendChild(doc.createTextNode(token));
        } else {
          var span = doc.createElement('span');
          span.className = 'motion-count';
          span.setAttribute('data-count-to', String(digits));
          span.setAttribute('data-count-rupee', token.indexOf('₹') !== -1 ? '1' : '0');
          span.textContent = token; // final value doubles as no-JS fallback
          countEls.push(span);
          frag.appendChild(span);
        }
        last = start + token.length;
        if (rx.lastIndex === start) rx.lastIndex++; // guard against zero-width
      }
      if (last < s.length) frag.appendChild(doc.createTextNode(s.slice(last)));
      parent.replaceChild(frag, tn);
    });
  }

  function fmtNum(v, rupee) {
    var s;
    try { s = v.toLocaleString('en-IN'); } catch (e) { s = String(v); }
    return rupee ? ('₹' + s) : s;
  }

  function runCounts() {
    countEls.forEach(function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      var to = parseInt(el.getAttribute('data-count-to'), 10);
      var rupee = el.getAttribute('data-count-rupee') === '1';
      if (isNaN(to)) return;
      var dur = 1200;
      var t0 = 0;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmtNum(Math.round(to * eased), rupee);
        if (p < 1) raf(step); else el.textContent = fmtNum(to, rupee);
      }
      raf(step);
    });
  }

  // ============================================================
  // 5. SECTION AMBIENCE — toggle body tone while dark sections show
  // ============================================================
  function setupAmbience() {
    var darks = [doc.getElementById('themes'), doc.getElementById('closing')]
      .filter(Boolean);
    if (!darks.length || !hasIO) return;
    var visible = 0;
    var seen = (typeof WeakSet !== 'undefined') ? new WeakSet() : null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var was = seen ? seen.has(e.target) : e.target.__amb;
        if (e.isIntersecting && !was) {
          if (seen) seen.add(e.target); else e.target.__amb = 1;
          visible++;
        } else if (!e.isIntersecting && was) {
          if (seen) seen.delete(e.target); else e.target.__amb = 0;
          visible--;
        }
      });
      if (visible > 0) body.classList.add('is-ambient');
      else body.classList.remove('is-ambient');
    }, { threshold: 0.35 });
    darks.forEach(function (d) { io.observe(d); });
  }

  // ============================================================
  // 6. TICKER — guarantee seamless loop (duplicate if needed)
  // ============================================================
  function ensureTicker() {
    var track = doc.querySelector('.hero-ticker-track');
    if (!track) return;
    var groups = track.querySelectorAll('.hero-ticker-group');
    if (groups.length === 1) track.appendChild(groups[0].cloneNode(true));
  }

  // ============================================================
  // 2. PARALLAX + 4. NAV SHRINK — one rAF loop, one scrollY read
  // ============================================================
  var targets = [];   // all parallax candidates {el, top, h, range, isBg}
  var active = [];    // subset currently on-screen (IO-gated)
  var vh = window.innerHeight || 800;
  var ticking = false;
  var navOn = false;

  function collect() {
    targets = [];
    var hero = doc.querySelector('.hero-bg');
    var close = doc.querySelector('.closing-bg');
    if (hero) targets.push({ el: hero, top: 0, h: 0, range: 90, isBg: true });
    if (close) targets.push({ el: close, top: 0, h: 0, range: 90, isBg: true });
    var photos = doc.querySelectorAll('.spots-photo, .themes-photo');
    for (var i = 0; i < photos.length; i++) {
      targets.push({ el: photos[i], top: 0, h: 0, range: 8, isBg: false });
    }
    for (var j = 0; j < targets.length; j++) targets[j].el.__mt = targets[j];
  }

  function measure() {
    vh = window.innerHeight || vh;
    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      var geo = t.isBg ? (t.el.closest && t.el.closest('section')) || t.el : t.el;
      t.top = docTop(geo);
      t.h = geo.offsetHeight || 1;
    }
  }

  function apply(y) {
    for (var i = 0; i < active.length; i++) {
      var t = active[i];
      var p = (y + vh - t.top) / (vh + t.h);
      if (p < 0) p = 0; else if (p > 1) p = 1;
      var off = (p - 0.5) * 2 * t.range; // -range .. +range px
      t.el.style.setProperty('--motion-py', off.toFixed(1) + 'px');
    }
  }

  function frame() {
    ticking = false;
    var y = window.pageYOffset || doc.documentElement.scrollTop || 0; // single read
    if (y > 80) {
      if (!navOn) { body.classList.add('scrolled'); navOn = true; }
    } else if (navOn) {
      body.classList.remove('scrolled'); navOn = false;
    }
    apply(y);
  }

  function requestFrame() {
    if (!ticking) { ticking = true; raf(frame); }
  }

  var resizePending = false;
  function onResize() {
    if (resizePending) return;
    resizePending = true;
    raf(function () { resizePending = false; measure(); requestFrame(); });
  }

  function setupScroll() {
    collect();
    if (targets.length) {
      measure();
      if (hasIO) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var t = e.target.__mt;
            if (!t) return;
            var idx = active.indexOf(t);
            if (e.isIntersecting) {
              if (idx === -1) { active.push(t); t.el.style.willChange = 'transform'; }
            } else if (idx !== -1) {
              active.splice(idx, 1);
              t.el.style.willChange = '';
              t.el.style.removeProperty('--motion-py');
            }
          });
          requestFrame();
        }, { rootMargin: '12% 0px 12% 0px', threshold: 0 });
        for (var i = 0; i < targets.length; i++) io.observe(targets[i].el);
      } else {
        active = targets.slice();
      }
      window.addEventListener('resize', onResize, { passive: true });
    }
    // scroll listener always on — nav shrink needs it even with no parallax.
    window.addEventListener('scroll', requestFrame, { passive: true });
    requestFrame();
  }

  // ============================================================
  // INIT
  // ============================================================
  ready(function () {
    // count-up chips must be wrapped BEFORE headings split, so the chip
    // rides along as an intact element unit inside its heading.
    try { wrapCounts(doc.getElementById('money')); } catch (e) {}

    var heads = doc.querySelectorAll('section h1.display, section h2.display');
    for (var i = 0; i < heads.length; i++) {
      try { splitHeading(heads[i]); } catch (e) {}
      (function (h) {
        observeOnce(h, function () { h.classList.add('in-view'); }, 0.2);
      })(heads[i]);
    }

    observeOnce(doc.getElementById('money'), runCounts, 0.12);

    try { setupAmbience(); } catch (e) {}
    try { ensureTicker(); } catch (e) {}
    try { setupScroll(); } catch (e) {}
  });
})();
