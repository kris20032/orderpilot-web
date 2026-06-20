/* ============================================================
   OrderPilot — landing interactions (powściągliwie)
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 0. Lenis smooth-scroll (maślany feel; desktop, spięty z GSAP) ---- */
  if (window.Lenis && window.gsap && !reduce && window.matchMedia('(min-width: 901px)').matches) {
    var lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    if (window.ScrollTrigger) { lenis.on('scroll', ScrollTrigger.update); }
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

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
            // beaty zsynchronizowane z momentami filmu: Start <2s · czeka <6.8s · wpada zlecenie <10.5s · decyzja
            setBeat(t < 2 ? 0 : t < 6.8 ? 1 : t < 10.5 ? 2 : 3);
          } else {
            setBeat(Math.max(0, Math.min(BEATS - 1, Math.floor(p * BEATS))));
          }
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

  /* ---- 4. Idle mouse-tilt telefonu (premium „żywy" — quickTo lerp, oddech) ---- */
  var heroPhone = document.getElementById('heroPhone');
  var heroStage = heroPhone && heroPhone.closest('.film__stage');
  var heroSec = document.querySelector('.hero');
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (heroPhone && heroStage && heroSec && window.gsap && !reduce && !touch) {
    gsap.to(heroPhone, { y: 7, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    var TD = 0.6, TE = 'power3';
    var rotX = gsap.quickTo(heroPhone, 'rotationX', { duration: TD, ease: TE });
    var rotY = gsap.quickTo(heroPhone, 'rotationY', { duration: TD, ease: TE });
    var srect = null;
    var refreshRect = function () { srect = heroStage.getBoundingClientRect(); };
    refreshRect();
    window.addEventListener('resize', refreshRect, { passive: true });
    window.addEventListener('scroll', refreshRect, { passive: true });
    heroSec.addEventListener('mousemove', function (e) {
      if (!srect) refreshRect();
      var px = (e.clientX - srect.left) / srect.width - 0.5;
      var py = (e.clientY - srect.top) / srect.height - 0.5;
      px = Math.max(-1.3, Math.min(1.3, px)); py = Math.max(-1.3, Math.min(1.3, py));
      rotY(px * 6); rotX(-py * 6);
    }, { passive: true });
    heroSec.addEventListener('mouseleave', function () { rotX(0); rotY(0); });
  }

})();
