/* Barvy pastvy.
   Vychází z volby barev na otázkách na tělo, jen tady se pastva přebarvuje i sama:
   dokud si nikdo barvu nevybere, střídají se po --takt (CSS) tři tmavé palety a kroužek
   kolem terče odpočítává do další. Tmavé proto, že přechod mezi tmavým a světlým pozadím
   by v půlce prolnutí srovnal jas textu a pozadí a text by na chvíli zmizel.

   Barvy drží :root[data-paleta]; skript jen přepíná ten atribut. Vybranou barvu si pamatuje
   jen do zavření okna (sessionStorage) – každá nová návštěva začne se zapnutým střídáním.
   Běží v hlavičce, aby se paleta nasadila ještě před vykreslením a stránka při přechodu
   z odkazu na odkaz neproblikla výchozími barvami. Když sessionStorage není (zakázaná data),
   přepínání funguje dál, jen si volbu stránka nezapamatuje.
   Kdo má v systému omezený pohyb, tomu se pastva sama nepřebarvuje, dokud si střídání
   nezapne vypínačem. */
(function () {
  var KLIC = 'web-paleta';
  try { localStorage.removeItem(KLIC); } catch (chyba) { /* úklid po dřívější trvalé paměti */ }
  var SAMY = 'samy';
  var STRIDANI = ['hlina-ruzova', 'modra-krem', 'zelena-krem'];   // pořadí drží kontrast i v půlce prolnutí
  var koren = document.documentElement;
  var klid = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function uloz(hodnota) {
    try { sessionStorage.setItem(KLIC, hodnota); } catch (chyba) { /* bez paměti to taky jde */ }
  }

  function prohlizec() {
    var meta = document.querySelector('meta[name="theme-color"]');
    var barva = getComputedStyle(koren).getPropertyValue('--ground').trim();
    if (meta && barva) { meta.setAttribute('content', barva); }
  }

  var ulozena = null;
  try { ulozena = sessionStorage.getItem(KLIC); } catch (chyba) { /* viz výše */ }
  if (ulozena && ulozena !== SAMY) {
    koren.dataset.paleta = ulozena;
  } else if (!klid || ulozena === SAMY) {
    koren.classList.add('stridani');
  }

  document.addEventListener('DOMContentLoaded', function () {
    prohlizec();
    var obal = document.querySelector('.paleta');
    if (!obal) { return; }
    var prepinac = obal.querySelector('.prepinac');
    var menu = obal.querySelector('.paleta-menu');
    var samy = menu.querySelector('.samy');
    var odpocet = obal.querySelector('.odpocet circle');
    var volby = Array.prototype.slice.call(menu.querySelectorAll('button[data-paleta]'));
    var cekani;


    function oznac() {
      var ted = koren.dataset.paleta || volby[0].dataset.paleta;
      var stridani = koren.classList.contains('stridani');
      volby.forEach(function (volba) {
        volba.setAttribute('aria-checked', String(!stridani && volba.dataset.paleta === ted));
      });
      samy.setAttribute('aria-checked', String(stridani));
    }

    function zavri() {
      menu.hidden = true;
      obal.classList.remove('otevrena');
      prepinac.setAttribute('aria-expanded', 'false');
    }

    function otevri() {
      oznac();
      menu.hidden = false;
      obal.classList.add('otevrena');
      prepinac.setAttribute('aria-expanded', 'true');
    }

    /* barva lišty prohlížeče – až po prolnutí, v jeho průběhu by se četla mezibarva */
    function prohlizecPoProlnuti() {
      clearTimeout(cekani);
      cekani = setTimeout(prohlizec, 2600);
    }

    /* kroužek se obtočil → další barva v řadě */
    odpocet.addEventListener('animationiteration', function () {
      var i = STRIDANI.indexOf(koren.dataset.paleta || STRIDANI[0]);
      koren.dataset.paleta = STRIDANI[(i + 1) % STRIDANI.length];
      prohlizecPoProlnuti();
    });

    oznac();

    prepinac.addEventListener('click', function (udalost) {
      udalost.stopPropagation();
      if (menu.hidden) { otevri(); } else { zavri(); }
    });

    volby.forEach(function (volba) {
      volba.addEventListener('click', function () {
        koren.classList.remove('stridani');
        koren.dataset.paleta = volba.dataset.paleta;
        uloz(volba.dataset.paleta);
        prohlizecPoProlnuti();
        oznac();
        zavri();
        prepinac.focus();
      });
    });

    /* Střídání barev je vypínač: nabídka zůstane otevřená, ať je vidět, kam se přepnul */
    samy.addEventListener('click', function (udalost) {
      udalost.stopPropagation();
      if (koren.classList.contains('stridani')) {
        /* vypnuto – pastva zůstane v barvě, ve které právě je */
        koren.classList.remove('stridani');
        koren.dataset.paleta = koren.dataset.paleta || STRIDANI[0];
        uloz(koren.dataset.paleta);
      } else {
        /* ze světlé palety se do střídání vstoupí rovnou první tmavou */
        if (STRIDANI.indexOf(koren.dataset.paleta || STRIDANI[0]) < 0) {
          koren.dataset.paleta = STRIDANI[0];
          prohlizecPoProlnuti();
        }
        koren.classList.add('stridani');
        uloz(SAMY);
      }
      oznac();
    });

    document.addEventListener('click', function (udalost) {
      if (!menu.hidden && !obal.contains(udalost.target)) { zavri(); }
    });
    document.addEventListener('keydown', function (udalost) {
      if (udalost.key === 'Escape' && !menu.hidden) { zavri(); prepinac.focus(); }
    });
  });
})();
