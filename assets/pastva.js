/* Pastva – co chystáme a kdy se potkáváme.
   Data dává Zvonec: veřejná setkání z public.json (jen to, co vedoucí pustili na web – žádná jména).
   Stránka je jen vykreslí: nahoře „nenech si ujít“ (setkání, které vedoucí zvýraznili), pod tím
   jednorázové akce jako program a nakonec pravidelná setkání, každá řada jednou.
   Fotky leží vedle public.json (images/…), časy jsou místní („2026-10-25T14:00“). */
(function () {
  var ZDROJ = 'https://zvonec.cirkevjakokrava.cz/';
  var DNY = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  var DNY_KRATCE = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
  var V_DEN = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];
  var KAZDY = ['Každou neděli', 'Každé pondělí', 'Každé úterý', 'Každou středu', 'Každý čtvrtek', 'Každý pátek', 'Každou sobotu'];
  var OB = ['Každou druhou neděli', 'Každé druhé pondělí', 'Každé druhé úterý', 'Každou druhou středu', 'Každý druhý čtvrtek',
    'Každý druhý pátek', 'Každou druhou sobotu'];
  var MESICE = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

  // ---------- čas ----------
  function den(t) { return String(t || '').slice(0, 10); }
  function datum(d) { return new Date(d + 'T12:00'); }
  function dnes() {
    var t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
  function hodiny(t) { var h = String(t).slice(11, 16); return h ? Number(h.slice(0, 2)) + '.' + h.slice(3) : ''; }
  function rozsah(e) {
    var od = hodiny(e.start); var doo = e.end && den(e.end) === den(e.start) ? hodiny(e.end) : '';
    return doo && doo !== od ? od + '–' + doo : od;
  }
  function dlouhy(d) { var x = datum(d); return x.getDate() + '. ' + MESICE[x.getMonth()]; }
  function kratky(d) { var x = datum(d); return x.getDate() + '. ' + (x.getMonth() + 1) + '.'; }
  function denTydne(d) { return datum(d).getDay(); }
  function vicedenni(e) { return e.end && den(e.end) !== den(e.start); }

  // ---------- drobnosti ----------
  /** Česká sazba: jednopísmenné předložky a spojky (s, z, k, v, u, o, a, i) nezůstanou na konci řádku
      a číslo s tečkou se neodtrhne od dalšího čísla nebo slova („6. 12.“, „25. října“) – pevná mezera. */
  function spoj(t) {
    return t.replace(/(?<=^|[\s(„–-])([szkvuoaiSZKVUOAI]) +/g, '$1\u00a0').replace(/(?<=\d\.) +(?=[\d\p{Ll}])/gu, '\u00a0');
  }
  function el(tag, trida, obsah) {
    var n = document.createElement(tag);
    if (trida) { n.className = trida; }
    (Array.isArray(obsah) ? obsah : [obsah]).forEach(function (x) {
      if (x == null || x === false) { return; }
      n.append(x.nodeType ? x : document.createTextNode(spoj(String(x))));
    });
    return n;
  }
  /** Místnosti jedné budovy dohromady: „Sál a Malá místnost (Monta)“. */
  function mista(e) {
    var skupiny = [];
    (e.places || []).forEach(function (p) {
      var budova = p.building && p.building !== p.name ? p.building : null;
      var s = skupiny.find(function (x) { return budova && x.budova === budova; });
      if (s) { s.jmena.push(p.name); } else { skupiny.push({ budova: budova, jmena: [p.name] }); }
    });
    return skupiny.map(function (s) {
      var jmena = s.jmena.length > 1 ? s.jmena.slice(0, -1).join(', ') + ' a ' + s.jmena[s.jmena.length - 1] : s.jmena[0];
      return s.budova ? jmena + ' (' + s.budova + ')' : jmena;
    }).join(', ');
  }
  function mapa(e) {
    var p = (e.places || []).find(function (x) { return Number.isFinite(x.lat) && Number.isFinite(x.lon); });
    if (p) { return 'https://mapy.cz/zakladni?source=coor&id=' + p.lon + '%2C' + p.lat + '&q=' + encodeURIComponent(p.name); }
    var s = (e.places || []).find(function (x) { return x.address; });
    return s ? 'https://mapy.cz/zakladni?q=' + encodeURIComponent(s.address) : null;
  }
  function fotka(e) {
    if (!e.image) { return null; }
    var obal = el('div', 'foto');
    var img = el('img');
    img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.src = ZDROJ + e.image;
    img.addEventListener('error', function () { obal.remove(); }, { once: true });
    obal.append(img);
    return obal;
  }

  // .ics jednoho setkání – časy jsou místní, bez pásma (kalendář je bere jako tady a teď)
  function ics(e) {
    var cas = function (t) { return String(t).replace(/[-:]/g, '').slice(0, 13) + '00'; };
    var text = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&'); };
    var radky = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Církev jako kráva//Pastva//CS', 'BEGIN:VEVENT',
      'UID:' + e.id + '@cirkevjakokrava.cz', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART:' + cas(e.start), 'DTEND:' + cas(e.end || e.start), 'SUMMARY:' + text(e.title),
      'LOCATION:' + text((e.places || []).map(function (p) { return [p.name, p.address].filter(Boolean).join(', '); }).join('; ')),
      'DESCRIPTION:' + text(e.description), 'END:VEVENT', 'END:VCALENDAR'];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(radky.join('\r\n'));
  }
  function odkazy(e) {
    if (e.cancelled) { return null; }
    var a = el('a', null, 'Přidej si do kalendáře');
    a.href = ics(e); a.download = (e.title || 'setkani').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase() + '.ics';
    var m = mapa(e);
    var b = m ? el('a', null, 'Otevři v mapě') : null;
    if (b) { b.href = m; b.target = '_blank'; b.rel = 'noopener'; }
    return el('p', 'akce__odkazy', [a, b]);
  }

  // ---------- kousky stránky ----------
  /** Kdy, jak se to čte: „ne 25. října, 14.00–18.00“, u víc dní „pá 13. listopadu – ne 15. listopadu“.
      Datum i čas drží pohromadě – řádek se smí zlomit jen za čárkou (nebo u pomlčky mezi dny). */
  function kdy(e) {
    var d = den(e.start);
    var celek = function (t) { return el('span', 'celek', t); };
    if (vicedenni(e)) { return [celek(DNY_KRATCE[denTydne(d)] + ' ' + dlouhy(d)), ' – ', celek(DNY_KRATCE[denTydne(den(e.end))] + ' ' + dlouhy(den(e.end)))]; }
    return [celek(DNY_KRATCE[denTydne(d)] + ' ' + dlouhy(d) + ','), ' ', celek(rozsah(e))];
  }

  function zvyraznena(e) {
    return el('article', 'hlavni mrizka', [
      fotka(e),
      el('div', 'hlavni__text', [
        el('h3', 'hlavni__nazev', e.title),
        el('p', 'hlavni__kdy', kdy(e)),
        mista(e) ? el('p', 'akce__kde', mista(e)) : null,
        e.description ? el('p', 'akce__popis', e.description) : null,
        odkazy(e),
      ]),
    ]);
  }

  /** Jedna položka programu: vlevo datum, uprostřed co a kde, vpravo fotka. */
  function polozka(e, vlevo, navic) {
    var d = den(e.start) < dnes() ? dnes() : den(e.start);
    return el('li', 'akce mrizka' + (e.cancelled ? ' akce--zrusena' : ''), [
      vlevo || el('p', 'akce__datum', [el('b', null, kratky(d)), el('span', null, DNY[denTydne(d)])]),
      el('div', 'akce__text', [
        el('h3', 'akce__nazev', e.title),
        el('p', 'akce__kdy', [e.cancelled ? el('span', 'zruseno', 'Zrušeno. ') : null].concat(vicedenni(e) ? kdy(e) : rozsah(e), mista(e) ? ' · ' + mista(e) : '')),
        e.description ? el('p', 'akce__popis', e.description) : null,
        navic || null,
        odkazy(e),
      ]),
      fotka(e),
    ]);
  }

  function chystame(akce) {
    if (!akce.length) { return null; }
    return el('section', 'blok', [el('h2', 'stitek', 'co chystáme'), el('ul', 'program', akce.map(function (e) { return polozka(e); }))]);
  }

  function rytmus(e) {
    var d = denTydne(den(e.start));
    if (e.repeat === 'biweekly') { return OB[d]; }
    if (e.repeat === 'monthly') { return 'Jednou za měsíc ' + V_DEN[d]; }
    return KAZDY[d];
  }

  function pravidelne(udalosti) {
    var rady = [];
    udalosti.forEach(function (e) {
      if (!e.repeat || !e.seriesId) { return; }
      var r = rady.find(function (x) { return x.id === e.seriesId; });
      if (!r) { r = { id: e.seriesId, akce: [] }; rady.push(r); }
      r.akce.push(e);
    });
    var polozky = rady.map(function (r) {
      var dalsi = r.akce.find(function (e) { return !e.cancelled; });
      if (!dalsi) { return null; }
      var d = den(dalsi.start) < dnes() ? dnes() : den(dalsi.start);
      var volno = r.akce.filter(function (e) { return e.cancelled; }).slice(0, 2)
        .map(function (e) { return V_DEN[denTydne(den(e.start))] + ' ' + kratky(den(e.start)); });
      var vlevo = el('p', 'akce__datum akce__datum--rytmus', [el('b', null, hodiny(dalsi.start)), el('span', null, rytmus(dalsi).toLocaleLowerCase('cs'))]);
      var navic = el('p', 'akce__pristi', ['Příště ' + V_DEN[denTydne(d)] + ' ' + dlouhy(d) + '.',
        volno.length ? el('span', 'zruseno', ' Nescházíme se ' + volno.join(' a ')) : null]);
      var li = polozka(dalsi, vlevo, navic);
      li.querySelector('.akce__kdy').textContent = spoj(mista(dalsi));
      return li;
    }).filter(Boolean);
    if (!polozky.length) { return null; }
    return el('section', 'blok', [el('h2', 'stitek', 'pravidelně'), el('ul', 'program', polozky)]);
  }

  function vykresli(data) {
    var misto = document.querySelector('.pastva__obsah');
    var dnesni = dnes();
    var udalosti = (data.events || []).filter(function (e) { return den(e.end || e.start) >= dnesni; });
    var hlavni = udalosti.filter(function (e) { return e.featured && !e.cancelled; });
    var jednou = udalosti.filter(function (e) { return !e.repeat && !(e.featured && !e.cancelled); });
    var casti = [
      hlavni.length ? el('section', 'blok blok--hlavni', [el('h2', 'stitek', 'nenech si ujít')].concat(hlavni.map(zvyraznena))) : null,
      chystame(jednou),
      pravidelne(udalosti),
    ].filter(Boolean);
    misto.replaceChildren.apply(misto, casti.length ? casti : [el('p', 'pastva__zprava', 'Teď nic nechystáme. Mrkni sem později.')]);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch(ZDROJ + 'public.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
      .then(vykresli)
      .catch(function () {
        document.querySelector('.pastva__obsah').replaceChildren(
          el('p', 'pastva__zprava', 'Program se teď nepodařilo načíst. Zkus to za chvíli znovu.'));
      });
  });
}());
