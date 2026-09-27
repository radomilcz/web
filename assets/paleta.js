/* Volba barev stránky.
   Barvy drží :root[data-paleta]; skript jen přepíná ten atribut a pamatuje si volbu
   v localStorage. Běží v hlavičce, aby se uložená paleta nasadila ještě před vykreslením
   a stránka neproblikla výchozími barvami. Když localStorage není (soukromé okno,
   zakázaná data), přepínání funguje dál, jen si volbu stránka nezapamatuje. */
(function () {
  var KLIC = 'web-paleta';
  var koren = document.documentElement;

  function uloz(jmeno) {
    try { localStorage.setItem(KLIC, jmeno); } catch (chyba) { /* bez paměti to taky jde */ }
  }

  function prohlizec() {
    var meta = document.querySelector('meta[name="theme-color"]');
    var barva = getComputedStyle(koren).getPropertyValue('--ground').trim();
    if (meta && barva) { meta.setAttribute('content', barva); }
  }

  try {
    var ulozena = localStorage.getItem(KLIC);
    if (ulozena) { koren.dataset.paleta = ulozena; }
  } catch (chyba) { /* viz výše */ }

  document.addEventListener('DOMContentLoaded', function () {
    prohlizec();
    var obal = document.querySelector('.paleta');
    if (!obal) { return; }
    var prepinac = obal.querySelector('.prepinac');
    var menu = obal.querySelector('.paleta-menu');
    var volby = Array.prototype.slice.call(menu.querySelectorAll('button'));

    function oznac() {
      var ted = koren.dataset.paleta || volby[0].dataset.paleta;
      volby.forEach(function (volba) {
        volba.setAttribute('aria-checked', String(volba.dataset.paleta === ted));
      });
    }

    function zavri() {
      menu.hidden = true;
      prepinac.setAttribute('aria-expanded', 'false');
    }

    function otevri() {
      oznac();
      menu.hidden = false;
      prepinac.setAttribute('aria-expanded', 'true');
    }

    oznac();

    prepinac.addEventListener('click', function (udalost) {
      udalost.stopPropagation();
      if (menu.hidden) { otevri(); } else { zavri(); }
    });

    volby.forEach(function (volba) {
      volba.addEventListener('click', function () {
        koren.dataset.paleta = volba.dataset.paleta;
        uloz(volba.dataset.paleta);
        prohlizec();
        oznac();
        zavri();
        prepinac.focus();
      });
    });

    document.addEventListener('click', function (udalost) {
      if (!menu.hidden && !obal.contains(udalost.target)) { zavri(); }
    });
    document.addEventListener('keydown', function (udalost) {
      if (udalost.key === 'Escape' && !menu.hidden) { zavri(); prepinac.focus(); }
    });
  });
})();
