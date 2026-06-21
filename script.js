/* ============================================================
   OrderPilot — landing interactions (powściągliwie)
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 0. Lenis smooth-scroll (maślany feel; desktop, spięty z GSAP) ---- */
  if (window.Lenis && window.gsap && !reduce && window.matchMedia('(min-width: 901px)').matches) {
    var lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      // KLUCZOWE: gdy ScrollTrigger dodaje/zmienia pin-spacer, wysokość strony rośnie —
      // Lenis musi przeliczyć limit, inaczej utyka tuż za pinem (telefon „odjeżdża"/wraca na dole)
      ScrollTrigger.addEventListener('refresh', function () { lenis.resize(); });
    }
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

  /* ---- 2b. Kinetyczny nagłówek hero — duże litery wjeżdżają linia po linii (SplitText) ---- */
  (function () {
    var h1 = document.querySelector('.hero__title');
    if (!h1) return;
    var show = function () { h1.style.opacity = '1'; };
    if (reduce || !window.gsap || !window.SplitText) { show(); return; }
    var run = function () {
      try {
        gsap.registerPlugin(SplitText);
        var sp = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true });
        show();
        gsap.from(sp.lines, { yPercent: 115, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'expo.out' });
      } catch (e) { show(); }
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  })();

  /* ---- 3. FILM: wideo scrubowane scrollem + kinetyczne beaty (GSAP) ---- */
  var film = document.querySelector('.film');
  if (film && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var video = film.querySelector('.film__video');
    var tags  = Array.prototype.slice.call(film.querySelectorAll('.film__tag'));
    var heroCta = document.querySelector('.hero__cta');
    var stageEl = film.querySelector('.film__stage');
    var spot = film.querySelector('.film__spot');
    var BEATS = parseInt(film.getAttribute('data-beats'), 10) || 4;
    var current = -1;

    // cele zmierzone w pikselach wideo (600×1298) → % wideo (ramka trafia DOKŁADNIE, niezależnie od rozmiaru)
    var TARGETS = {
      '1': { x: 0.335, y: 0.033, w: 0.315, h: 0.066, r: 999, side: 'below' }, // pigułka „0,00 zł"
      '2': { x: 0.02,  y: 0.062, w: 0.96,  h: 0.108, r: 13,  side: 'right' }  // belka 34 zł/h
    };
    function placeAnnotation(beat) {
      var t = TARGETS[beat], tag = film.querySelector('.film__tag[data-beat="' + beat + '"]');
      if (!t || !tag || !spot || !video) { film.classList.remove('is-spot'); return; }
      var vr = video.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
      if (!vr.width) { film.classList.remove('is-spot'); return; }
      var vx = vr.left - sr.left, vy = vr.top - sr.top;
      var L = vx + t.x * vr.width, T = vy + t.y * vr.height, Wd = t.w * vr.width, Hd = t.h * vr.height;
      var pad = 5;
      spot.style.left = (L - pad) + 'px'; spot.style.top = (T - pad) + 'px';
      spot.style.width = (Wd + pad * 2) + 'px'; spot.style.height = (Hd + pad * 2) + 'px';
      spot.style.borderRadius = t.r + 'px';
      tag.classList.remove('tail-up', 'tail-left');
      var cw = tag.offsetWidth, ch = tag.offsetHeight, cx, cy;
      if (t.side === 'below') {
        cx = L + Wd / 2 - cw / 2; cy = T + Hd + 16;
        cx = Math.max(6, Math.min(cx, sr.width - cw - 6));   // trzymaj dymek w telefonie
        tag.classList.add('tail-up');
      } else {                                               // po prawej od celu (na zewnątrz telefonu)
        cx = L + Wd + 18; cy = T + Hd / 2 - ch / 2;
        tag.classList.add('tail-left');
      }
      tag.style.left = cx + 'px'; tag.style.top = cy + 'px'; tag.style.right = 'auto'; tag.style.bottom = 'auto';
      film.classList.add('is-spot');
    }

    function setBeat(i) {
      if (i === current) return; current = i;
      tags.forEach(function (t) { t.classList.toggle('is-active', parseInt(t.dataset.beat, 10) === i); });
      if (i === 1 || i === 2) placeAnnotation(i); else film.classList.remove('is-spot');
      if (heroCta) heroCta.classList.toggle('is-revealed', i === 3);
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
      var stickyEl = film.querySelector('.film__sticky');
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
          // hero znika (fade + lekkie uniesienie) pod koniec scrubu — następna sekcja podciągnięta CSS,
          // więc telefon nie „wraca" w trailingu, tylko rozpływa się w treść
          var exit = p > 0.9 ? (p - 0.9) / 0.1 : 0;
          if (stickyEl) gsap.set(stickyEl, { opacity: 1 - exit, y: -exit * 26 });
        }
      });
      setBeat(0);
      video.addEventListener('loadedmetadata', function () { ScrollTrigger.refresh(); }, { once: true });
      return function () { st.kill(); current = -1; if (stickyEl) gsap.set(stickyEl, { opacity: 1, y: 0 }); film.classList.remove('is-spot'); };
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
      // mobile/reduce: pokaż „money beat" (34 zł/h) statycznie + CTA widoczne (wartość + konwersja zostają)
      tags.forEach(function (t) { t.classList.toggle('is-active', parseInt(t.dataset.beat, 10) === 2); });
      if (heroCta) heroCta.classList.add('is-revealed');
    });

    // gdy karta wraca z tła — Chrome odracza wczytanie wideo w ukrytych kartach; dociągnij ORAZ odśwież scrub
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      if (video.readyState < 1) { try { video.load(); } catch (e) {} }
      if (window.ScrollTrigger && ScrollTrigger.getAll().length) { ScrollTrigger.refresh(); }
    });

    // ramka/dymek zależą od layoutu — przelicz przy zmianie rozmiaru
    var spotRaf;
    window.addEventListener('resize', function () {
      if (spotRaf) cancelAnimationFrame(spotRaf);
      spotRaf = requestAnimationFrame(function () { if (current === 1 || current === 2) placeAnnotation(current); });
    }, { passive: true });

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
      var capEl = document.querySelector('.shots__cap');
      var dots = null;
      var active = cards.findIndex(function (c) { return c.getAttribute('data-pos') === '0'; });
      if (active < 0) active = Math.floor(N / 2);
      var desktopMQ = window.matchMedia('(min-width: 901px)');
      var auto = null, AUTO_MS = 3800, capTimer = null;

      function setCap() {
        if (!capEl) return;
        var txt = cards[active].getAttribute('data-cap') || '';
        if (txt === capEl._cur) return;
        if (capEl._cur == null) { capEl._cur = txt; capEl.textContent = txt; capEl.classList.add('is-in'); return; }
        capEl._cur = txt;
        capEl.classList.remove('is-in');                 // wyblakanie
        clearTimeout(capTimer);
        capTimer = setTimeout(function () { capEl.textContent = txt; capEl.classList.add('is-in'); }, 220);
      }
      function layout() {
        for (var i = 0; i < N; i++) {
          var rel = ((i - active) % N + N) % N;          // 0..N-1
          var pos = rel > N / 2 ? rel - N : rel;          // N=5 → -2..2
          cards[i].setAttribute('data-pos', (pos < -2 || pos > 2) ? 'hide' : String(pos));
          cards[i].setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
        }
        if (dots) dots.forEach(function (d, n) { d.classList.toggle('is-active', n === active); });
        setCap();
      }
      function go(i) {
        var from = active;
        active = ((i % N) + N) % N;
        var d = Math.abs(active - from); d = Math.min(d, N - d);          // dystans cyrkularny (1..2)
        gallery.style.setProperty('--slide-dur', (0.5 + Math.max(0, d - 1) * 0.45).toFixed(2) + 's'); // stała prędkość
        layout();
      }
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

      // klik centruje wprost; hover robi JEDEN krok w stronę karty (z pauzą — bez „spiny")
      var hoverLock = false;
      cards.forEach(function (c, i) {
        c.addEventListener('click', function () { go(i); restartAuto(); });
        c.addEventListener('mouseenter', function () {
          if (!desktopMQ.matches || hoverLock) return;
          var p = parseInt(c.getAttribute('data-pos'), 10) || 0;
          if (p === 0) return;                       // środek — nic nie rób
          hoverLock = true;
          setTimeout(function () { hoverLock = false; }, 520);
          if (p > 0) next(); else prev();            // jeden spokojny krok w stronę najechanej karty
        });
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

      // scroll-zoom: ekrany rosną gdy się zbliżasz → krótko pełny rozmiar → maleją (bez twardego pinu)
      if (window.gsap && window.ScrollTrigger && !reduce) {
        var mmZ = gsap.matchMedia();
        mmZ.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
          var ez = gsap.parseEase('power2.inOut');                  // krzywa kinowa zamiast liniowej
          var st = ScrollTrigger.create({
            trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: 0.9,  // cięższa bezwładność
            onUpdate: function (self) {
              var p = self.progress, k;
              if (p < 0.42) k = ez(p / 0.42);                       // wjazd: przyspiesz→wyhamuj
              else if (p < 0.58) k = 1;                             // plateau: pełny rozmiar (autoplay przesuwa)
              else k = ez(1 - (p - 0.58) / 0.42);                   // wyjazd: miękko rusz→zejdź
              gallery.style.setProperty('--zoom', (0.8 + k * 0.2).toFixed(3));
            }
          });
          return function () { st.kill(); gallery.style.setProperty('--zoom', '1'); };
        });
      }
    }
  }

})();
