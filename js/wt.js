/* WT - WINDOWS TOMORROW · chování webu
   Stejná logika jako na webech Solatube a GLASSFLOOR:
   hlavička po scrollu, odhalování sekcí, mobilní menu.
   Navíc přepínání situací v sekci "Jak potřebujete světlo přivést". */

(function () {
  'use strict';

  /* ---- hlavička ---- */
  var hd = document.getElementById('hd');
  function updHd() { hd.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', updHd, { passive: true });
  window.addEventListener('load', updHd);
  updHd();

  /* ---- odhalování při scrollu ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv, .rv-img').forEach(function (el) { io.observe(el); });

  /* ---- mobilní menu ---- */
  var mbtn = document.getElementById('mbtn');
  var mmenu = document.getElementById('mmenu');
  function setMenu(open) {
    hd.classList.toggle('menu-open', open);
    mbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  mbtn.addEventListener('click', function () { setMenu(!hd.classList.contains('menu-open')); });
  mmenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  var mq = window.matchMedia('(min-width:1081px)');
  var onMq = function (e) { if (e.matches) setMenu(false); };
  if (mq.addEventListener) { mq.addEventListener('change', onMq); } else { mq.addListener(onMq); }

  /* ---- výběr architektonické situace (taby podle WAI-ARIA) ----
     Seznam vlevo je tablist, obrázek s popisem vpravo je tabpanel.
     Myš i dotyk: kliknutí, na desktopu i najetí myší.
     Klávesnice: šipky přepínají situaci, Home/End skočí na první a poslední,
     Tab z tablistu přejde rovnou do otevřeného panelu (roving tabindex). */
  var items = Array.prototype.slice.call(document.querySelectorAll('.sit-item'));
  var details = Array.prototype.slice.call(document.querySelectorAll('.sit-detail'));
  var hoverOk = window.matchMedia('(hover:hover) and (min-width:1001px)');
  var aktivni = 0;

  function show(i, prenesFokus) {
    aktivni = i;
    items.forEach(function (b, n) {
      var je = n === i;
      b.classList.toggle('on', je);
      b.setAttribute('aria-selected', je ? 'true' : 'false');
      b.setAttribute('tabindex', je ? '0' : '-1');
    });
    details.forEach(function (d, n) {
      var je = n === i;
      d.classList.toggle('on', je);
      d.setAttribute('aria-hidden', je ? 'false' : 'true');
      d.setAttribute('tabindex', je ? '0' : '-1');
    });
    if (prenesFokus && items[i]) { items[i].focus(); }
  }

  items.forEach(function (b, i) {
    b.addEventListener('click', function () { show(i); });
    b.addEventListener('mouseenter', function () { if (hoverOk.matches) show(i); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, posun = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') { posun = 1; }
      else if (k === 'ArrowUp' || k === 'ArrowLeft') { posun = -1; }
      else if (k === 'Home') { e.preventDefault(); show(0, true); return; }
      else if (k === 'End') { e.preventDefault(); show(items.length - 1, true); return; }
      else { return; }
      e.preventDefault();
      show((aktivni + posun + items.length) % items.length, true);
    });
  });
  if (items.length) { show(0); }

  var NL = '\n';
  /* ---- výběr technologie a poptávkový formulář ----
     Kliknutí na dlaždici rovnou otevře formulář pro danou technologii;
     mění se popisek jedné otázky a předmět zprávy. Formulář zatím nemá server,
     odesláním se otevře e-mail s vyplněnými údaji. */
  var kvBlok = document.getElementById('kon-vyber');
  var kfForm = document.getElementById('kon-form');
  if (kvBlok && kfForm) {
    var TEMATA = {
      solatube:   { nazev: 'světlovody Solatube', nazev4: 'světlovody Solatube',
                    predmet: 'Poptávka - tubusové světlovody Solatube',
                    otazka: 'Odkud povede světlo (podlaží, vzdálenost od střechy)' },
      glassfloor: { nazev: 'pochozí zasklení GLASSFLOOR', nazev4: 'pochozí zasklení GLASSFLOOR',
                    predmet: 'Poptávka - pochozí zasklení GLASSFLOOR',
                    otazka: 'Rozměr plochy a provoz po ní (chůze, nebo i pojezd)' },
      sachta:     { nazev: 'zrcadlová šachta HELIOBUS', nazev4: 'zrcadlovou šachtu HELIOBUS',
                    predmet: 'Poptávka - zrcadlová světelná šachta HELIOBUS',
                    otazka: 'Jak hluboko pod terénem prostor je' },
      lamilux:    { nazev: 'střešní světlíky LAMILUX', nazev4: 'střešní světlíky LAMILUX',
                    predmet: 'Poptávka - střešní světlíky LAMILUX',
                    otazka: 'Typ střechy a přibližný rozměr otvoru' },
      nevim:      { nazev: 'pomoc s výběrem technologie', nazev4: 'pomoc s výběrem vhodné technologie',
                    predmet: 'Poptávka - poradenství s výběrem technologie',
                    otazka: 'Co už o stavbě víte (podlaží, střecha, rozměry)' }
    };
    var kfTema = document.getElementById('kf-tema');
    var kfSpecPopis = document.getElementById('kf-spec-popis');
    var aktualni = TEMATA.solatube;

    function nastavTema(klic, otevrit) {
      aktualni = TEMATA[klic] || TEMATA.solatube;
      kfTema.textContent = aktualni.nazev;
      kfSpecPopis.textContent = aktualni.otazka;
      if (otevrit) {
        var bylSkryty = kfForm.hidden;
        kfForm.hidden = false;
        if (bylSkryty) {
          window.setTimeout(function () {
            kfForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 60);
        }
      }
    }

    kvBlok.querySelectorAll('input[name="kv-tema"]').forEach(function (i) {
      i.addEventListener('change', function () { nastavTema(i.value, true); });
      i.addEventListener('click', function () { nastavTema(i.value, true); });
    });
    var vychozi = kvBlok.querySelector('input[name="kv-tema"]:checked');
    nastavTema(vychozi ? vychozi.value : 'solatube', false);

    kfForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!kfForm.reportValidity()) { return; }
      var d = new FormData(kfForm);
      function v(k) { return (d.get(k) || '').toString().trim(); }
      var telo = 'Dobrý den,' + NL + NL
        + 'mám zájem o ' + aktualni.nazev4 + '.' + NL + NL
        + 'Jméno: ' + v('jmeno') + NL
        + 'E-mail: ' + v('email') + NL
        + 'Telefon: ' + (v('telefon') || '-') + NL
        + 'Kde stavba je: ' + (v('obec') || '-') + NL
        + aktualni.otazka + ': ' + (v('spec') || '-') + NL + NL
        + 'Popis situace:' + NL + v('popis') + NL + NL
        + 'Děkuji.' + NL;
      window.location.href = 'mailto:info@solatube.cz?subject='
        + encodeURIComponent(aktualni.predmet) + '&body=' + encodeURIComponent(telo);
    });

    /* po kliknutí na Konzultace blok krátce zvýraznit, ať je výběr vidět */
    document.querySelectorAll('a[href="#kontakt"]').forEach(function (a) {
      a.addEventListener('click', function () {
        kvBlok.classList.remove('hl');
        window.setTimeout(function () { kvBlok.classList.add('hl'); }, 400);
        window.setTimeout(function () { kvBlok.classList.remove('hl'); }, 2200);
      });
    });
  }

  /* ---- rok v patičce ---- */
  var y = document.getElementById('rok');
  if (y) { y.textContent = new Date().getFullYear(); }
})();
