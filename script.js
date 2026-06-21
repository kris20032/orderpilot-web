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
            var t = p >= 0.999 ? d - 0.02 : p * (d - 0.03);  // dobij do końcówki, ale nie do równego duration
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
      return function () { st.kill(); current = -1; film.classList.remove('is-pointing'); };
    });

    // MOBILE / reduced-motion — bez pinu: film gra autoplay-loop, wszystkie beaty widoczne (CSS)
    mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', function () {
      if (reduce) {
        // użytkownik nie chce ruchu — zostaw statyczny poster, nie autoodtwarzaj (WCAG 2.2.2)
        try { video.pause(); } catch (e) {}
        video.removeAttribute('loop'); video.removeAttribute('autoplay');
      } else {
        video.setAttribute('loop', ''); video.muted = true; video.setAttribute('playsinline', '');
        var tryPlay = function () { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); };
        whenReady(tryPlay);
      }
      caps.forEach(function (c) { c.classList.add('is-active'); });
      tags.forEach(function (t) { t.classList.remove('is-active'); });
    });

    // gdy karta wraca z tła — Chrome odracza wczytanie wideo w ukrytych kartach; dociągnij ORAZ odśwież scrub
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      if (video.readyState < 1) { try { video.load(); } catch (e) {} }
      if (window.ScrollTrigger && ScrollTrigger.getAll().length) { ScrollTrigger.refresh(); }
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

  /* ---- 5. Count-up liczb w sekcji proof (premium-detal, w viewport) ---- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window) || reduce) {
      counters.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suf || ''); });
    } else {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, to = parseFloat(el.dataset.count) || 0, suf = el.dataset.suf || '', start = null;
          io2.unobserve(el);
          requestAnimationFrame(function tick(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / 900), eased = p * (2 - p); // easeOutQuad
            el.textContent = Math.round(to * eased) + suf;
            if (p < 1) requestAnimationFrame(tick); else el.textContent = to + suf;
          });
          // siatka bezpieczeństwa: rAF bywa dławiony (karta w tle) — dociągnij finalną liczbę
          setTimeout(function () { el.textContent = to + suf; }, 1100);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { io2.observe(el); });
    }
  }

  /* ---- 6. Galeria coverflow — żywy karuzel (klik/hover centrują, autoplay, kropki, swipe) ---- */
  var gallery = document.querySelector('.shots');
  if (gallery) {
    var cards = Array.prototype.slice.call(gallery.querySelectorAll('.shot'));
    var N = cards.length;
    if (N) {
      var dotsWrap = document.querySelector('.shots__dots');
      var dots = null;
      var active = cards.findIndex(function (c) { return c.getAttribute('data-pos') === '0'; });
      if (active < 0) active = Math.floor(N / 2);
      var desktopMQ = window.matchMedia('(min-width: 901px)');
      var auto = null, AUTO_MS = 3800;

      function layout() {
        for (var i = 0; i < N; i++) {
          var rel = ((i - active) % N + N) % N;          // 0..N-1
          var pos = rel > N / 2 ? rel - N : rel;          // N=5 → -2..2
          cards[i].setAttribute('data-pos', (pos < -2 || pos > 2) ? 'hide' : String(pos));
          cards[i].setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
        }
        if (dots) dots.forEach(function (d, n) { d.classList.toggle('is-active', n === active); });
      }
      function go(i) { active = ((i % N) + N) % N; layout(); }
      function next() { go(active + 1); }
      function prev() { go(active - 1); }
      function startAuto() { if (reduce || !desktopMQ.matches || auto) return; auto = setInterval(next, AUTO_MS); }
      function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
      function restartAuto() { stopAuto(); startAuto(); }

      // kropki nawigacji
      if (dotsWrap) {
        dots = cards.map(function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Pokaż zrzut ' + (i + 1));
          b.addEventListener('click', function () { go(i); restartAuto(); });
          dotsWrap.appendChild(b);
          return b;
        });
      }

      // klik centruje; hover centruje (tylko desktop — żeby na dotyku nie skakało)
      cards.forEach(function (c, i) {
        c.addEventListener('click', function () { go(i); restartAuto(); });
        c.addEventListener('mouseenter', function () { if (desktopMQ.matches) go(i); });
      });

      // autoplay pauzuje na hover całej galerii
      gallery.addEventListener('mouseenter', stopAuto);
      gallery.addEventListener('mouseleave', startAuto);

      // klawiatura
      gallery.setAttribute('tabindex', '0');
      gallery.setAttribute('aria-label', 'Galeria zrzutów — strzałki zmieniają widok');
      gallery.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { next(); restartAuto(); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { prev(); restartAuto(); e.preventDefault(); }
      });

      // swipe / drag
      var sx = null;
      gallery.addEventListener('pointerdown', function (e) { sx = e.clientX; });
      window.addEventListener('pointerup', function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); restartAuto(); }
      });

      if (desktopMQ.addEventListener) {
        desktopMQ.addEventListener('change', function () { if (desktopMQ.matches) { layout(); startAuto(); } else stopAuto(); });
      }

      layout();
      // autoplay rusza dopiero gdy galeria jest w widoku
      if ('IntersectionObserver' in window) {
        var iog = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) startAuto(); else stopAuto(); });
        }, { threshold: 0.35 });
        iog.observe(gallery);
      } else { startAuto(); }
    }
  }

})();
