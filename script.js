/* ============================================================
   OrderPilot — landing interactions
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Sticky nav background ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 2. Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- 3. Hero overlay cycling ---- */
  var belka = document.getElementById('belka');
  var metrics = document.getElementById('belkaMetrics');
  var price = document.getElementById('orderPrice');
  var verdict = document.getElementById('orderVerdict');
  var accept = document.getElementById('orderAccept');
  var row = document.getElementById('orderRow');

  if (belka && metrics) {
    var states = [
      { cls: 'is-green',  m: '44 zł/h · 2,9 zł/km · 18,35 zł · 25 min', p: '18,35 zł', r: '⏱ 25 min · 6,3 km', v: 'Opłaca się', c: '#1fae5a', vc: '#0f7a3d' },
      { cls: 'is-yellow', m: '29 zł/h · 2,1 zł/km · 21,40 zł · 38 min', p: '21,40 zł', r: '⏱ 38 min · 8,4 km', v: 'Na granicy', c: '#d9930b', vc: '#9a6800' },
      { cls: 'is-red',    m: '19 zł/h · 1,5 zł/km · 14,48 zł · 41 min', p: '14,48 zł', r: '⏱ 41 min · 9,1 km', v: 'Nie warto', c: '#e8474d', vc: '#c0282e' }
    ];
    var i = 0;
    function apply(s) {
      belka.classList.remove('is-green', 'is-yellow', 'is-red');
      belka.classList.add(s.cls);
      metrics.textContent = s.m;
      if (price)   price.textContent = s.p;
      if (row)     row.textContent = s.r;
      if (verdict) { verdict.textContent = s.v; verdict.style.color = s.vc; }
      if (accept)  accept.style.background = s.c;
    }
    apply(states[0]);
    if (!reduce) {
      setInterval(function () {
        i = (i + 1) % states.length;
        apply(states[i]);
      }, 2600);
    }
  }

  /* ---- 4. Scroll progress bar ---- */
  var progress = document.getElementById('scrollProgress');
  if (progress) {
    var onProg = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (window.scrollY || h.scrollTop) / max : 0;
      progress.style.width = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onProg, { passive: true });
    window.addEventListener('resize', onProg, { passive: true });
    onProg();
  }

  /* ---- 5. Spotlight follow on cards (tylko mysz, bez reduced-motion) ---- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    var spotEls = document.querySelectorAll('.feature, .step, .compare__col');
    spotEls.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---- 6. Number ticker (count-up przy wejściu w kadr) ---- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var dur = 1300, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

})();
