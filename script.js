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

  /* ---- 3. Story scrollytelling (przyklejony telefon + kroki) ---- */
  var story = document.querySelector('.story');
  var steps = document.querySelectorAll('.story__step');
  if (story && steps.length && 'IntersectionObserver' in window) {
    story.classList.add('story--js'); // dopiero z JS przygaszamy nieaktywne kroki (bez JS = wszystkie widoczne)
    var shots = document.querySelectorAll('.story__shot-img');
    var callout = document.querySelector('.story__callout');
    function activate(n) {
      steps.forEach(function (s) { s.classList.toggle('is-active', s.dataset.step === n); });
      shots.forEach(function (s) { s.classList.toggle('is-active', s.dataset.step === n); });
      var active = document.querySelector('.story__step[data-step="' + n + '"]');
      if (callout && active && active.dataset.callout) callout.textContent = active.dataset.callout;
    }
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
  }

})();
