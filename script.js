/* ============================================================
   OrderPilot — landing interactions (powściągliwie)
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Sticky nav ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- 2. Reveal on scroll (subtelny) ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- 3. Demo belki w hero (cykl: opłaca się → granica → nie warto) ---- */
  var belka = document.getElementById('belka');
  var metrics = document.getElementById('belkaMetrics');
  var price = document.getElementById('orderPrice');
  var row = document.getElementById('orderRow');
  var verdict = document.getElementById('orderVerdict');
  var accept = document.getElementById('orderAccept');

  if (belka && metrics && !reduce) {
    var states = [
      { cls: 'is-green',  m: '44 zł/h · 2,9 zł/km · 18,35 zł · 25 min', p: '18,35 zł', r: '25 min · 6,3 km', v: 'Opłaca się', c: '#1fae5a', vc: '#128a45' },
      { cls: 'is-yellow', m: '29 zł/h · 2,1 zł/km · 21,40 zł · 38 min', p: '21,40 zł', r: '38 min · 8,4 km', v: 'Na granicy', c: '#e0960a', vc: '#9a6800' },
      { cls: 'is-red',    m: '19 zł/h · 1,5 zł/km · 14,48 zł · 41 min', p: '14,48 zł', r: '41 min · 9,1 km', v: 'Nie warto', c: '#e8474d', vc: '#c0282e' }
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
    setInterval(function () {
      i = (i + 1) % states.length;
      apply(states[i]);
    }, 2800);
  }

})();
