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

  /* ---- 3. FILM: wideo scrubowane scrollem + kinetyczne beaty (GSAP) ---- */
  var film = document.querySelector('.film');
  if (film && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var video = film.querySelector('.film__video');
    var caps  = Array.prototype.slice.call(film.querySelectorAll('.film__cap'));
    var tags  = Array.prototype.slice.call(film.querySelectorAll('.film__tag'));
    var dots  = Array.prototype.slice.call(film.querySelectorAll('.film__dots i'));
    var BEATS = parseInt(film.getAttribute('data-beats'), 10) || 4;
    var current = -1;

    function setBeat(i) {
      if (i === current) return; current = i;
      caps.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });
      tags.forEach(function (t) { t.classList.toggle('is-active', parseInt(t.dataset.beat, 10) === i); });
      film.classList.toggle('is-pointing', i === 2); // strzałka przy „wpada zlecenie"
    }

    function whenReady(cb) {
      if (video.readyState >= 1 && video.duration) { cb(); }
      else { video.addEventListener('loadedmetadata', cb, { once: true }); }
    }

    var mm = gsap.matchMedia();

    // DESKTOP — pin + scrub wideo + beaty
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
      video.removeAttribute('autoplay'); video.removeAttribute('loop');
      video.preload = 'auto'; video.load();           // wymuś wczytanie (Chrome odracza offscreen)
      try { video.pause(); } catch (e) {}
      var st = ScrollTrigger.create({
        trigger: film,
        start: 'top top',
        end: function () { return '+=' + (window.innerHeight * 4); },
        pin: '.film__sticky',
        scrub: 1,
        anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress, d = video.duration;
          if (d && isFinite(d)) {
            var t = p * (d - 0.05);
            if (Math.abs(t - video.currentTime) > 0.005) { try { video.currentTime = t; } catch (e) {} }
          }
          setBeat(Math.max(0, Math.min(BEATS - 1, Math.floor(p * BEATS))));
        }
      });
      setBeat(0);
      video.addEventListener('loadedmetadata', function () { ScrollTrigger.refresh(); }, { once: true });
      return function () { st.kill(); };
    });

    // MOBILE / reduced-motion — bez pinu: film gra autoplay-loop, wszystkie beaty widoczne (CSS)
    mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', function () {
      video.setAttribute('loop', ''); video.muted = true; video.setAttribute('playsinline', '');
      var tryPlay = function () { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); };
      whenReady(tryPlay);
      caps.forEach(function (c) { c.classList.add('is-active'); });
      tags.forEach(function (t) { t.classList.remove('is-active'); });
    });
  }

})();
