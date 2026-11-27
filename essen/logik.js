// Reine Logik ohne DOM: Zutaten lesen, Woche berechnen, Einkaufsliste bilden.
// Läuft im Browser (window.EssenLogik) und in Node (für Tests).
(function (global) {
  'use strict';

  const EINHEITEN = {
    g: 'g', gramm: 'g', kg: 'kg', ml: 'ml', l: 'l', liter: 'l',
    el: 'EL', tl: 'TL', stk: 'Stk', stück: 'Stk', stueck: 'Stk',
    pck: 'Pck', pkt: 'Pck', packung: 'Pck', pkg: 'Pck', dose: 'Dose', dosen: 'Dose',
    becher: 'Becher', bund: 'Bund', glas: 'Glas', prise: 'Prise', zehe: 'Zehe', zehen: 'Zehe',
    scheibe: 'Scheibe', scheiben: 'Scheibe', kopf: 'Kopf', netz: 'Netz', kugel: 'Kugel', kugeln: 'Kugel',
    flasche: 'Flasche', flaschen: 'Flasche', tüte: 'Tüte', tüten: 'Tüte', stange: 'Stange', stangen: 'Stange'
  };

  // Reihenfolge = Weg durch den Supermarkt
  const KATEGORIEN = ['Obst & Gemüse', 'Brot & Backwaren', 'Kühlregal', 'Fleisch & Fisch', 'Vorrat', 'Tiefkühl', 'Getränke', 'Sonstiges'];

  // Stichworte passen als ganzes Wort, als Wortanfang oder als Wortende
  // (deutsche Zusammensetzungen: "Frühstücksfleisch" endet auf "fleisch").
  const STICHWORTE = {
    'Obst & Gemüse': ['süßkartoffel', 'süßkartoffeln', 'chili', 'chilis', 'koriander', 'porree', 'apfel', 'äpfel', 'banane', 'bananen', 'zitrone', 'tomate', 'tomaten', 'gurke', 'gurken', 'paprika', 'paprikaschote', 'zwiebel', 'zwiebeln', 'knoblauch', 'knoblauchzehe', 'kartoffel', 'kartoffeln', 'möhre', 'möhren', 'karotte', 'salat', 'zucchini', 'brokkoli', 'spinat', 'lauch', 'porree', 'pilz', 'pilze', 'champignon', 'champignons', 'kräuter', 'petersilie', 'schnittlauch', 'basilikum', 'aubergine', 'kürbis', 'avocado', 'ingwer', 'sellerie', 'beeren', 'obst', 'gemüse', 'spargel', 'chilischote', 'suppengrün'],
    'Brot & Backwaren': ['brot', 'brötchen', 'toast', 'wrap', 'wraps', 'tortilla', 'baguette'],
    'Kühlregal': ['salami', 'sour', 'bacon', 'baconwürfel', 'schmand', 'katenschinken', 'milch', 'butter', 'margarine', 'sahne', 'joghurt', 'quark', 'käse', 'parmesan', 'mozzarella', 'feta', 'gouda', 'schmand', 'crème', 'creme', 'ei', 'eier', 'frischkäse', 'tofu', 'schinken', 'speck', 'aufschnitt', 'blätterteig', 'tortellini', 'tortelloni', 'fleischwurst'],
    'Fleisch & Fisch': ['hack', 'hackfleisch', 'hähnchen', 'hähnchenbrust', 'huhn', 'pute', 'rind', 'schwein', 'wurst', 'würstchen', 'fisch', 'lachs', 'garnelen', 'fleisch', 'schnitzel'],
    'Vorrat': ['knoblauchpulver', 'kurkuma', 'kreuzkümmel', 'kümmel', 'zimt', 'nelkenpulver', 'gemahlener', 'sauerkraut', 'geschälte', 'remoulade', 'hollandaise', 'sesamöl', 'mirin', 'würzmischung', 'currysauce', 'vollkornmehl', 'nudel', 'nudeln', 'spaghetti', 'penne', 'fussili', 'fusilli', 'farfalle', 'pasta', 'reis', 'mehl', 'zucker', 'salz', 'pfeffer', 'öl', 'olivenöl', 'rapsöl', 'sonnenblumenöl', 'essig', 'brühe', 'linsen', 'bohnen', 'kichererbsen', 'passierte', 'gehackte', 'tomatenmark', 'gewürz', 'paprikapulver', 'curry', 'currypaste', 'kokosmilch', 'sojasauce', 'senf', 'ketchup', 'honig', 'apfelmus', 'haferflocken', 'lasagneplatten', 'couscous', 'backpulver', 'hefe', 'mais', 'maiskörner', 'salsasauce', 'salsa', 'frühstücksfleisch', 'thunfisch', 'gewürzgurken', 'thymian', 'majoran', 'oregano', 'muskat', 'cayennepfeffer', 'chilipulver', 'pinienkerne', 'sonnenblumenkerne', 'speisestärke', 'zitronensaft', 'instantbrühe', 'schmelzkäse', 'sahneschmelzkäse', 'tortillachips', 'chips', 'mayonnaise', 'miracel', 'miracle', 'italienische', 'zwiebelpulver'],
    'Tiefkühl': ['fischletti', 'tiefkühl', 'erbsen', 'fischstäbchen', 'pommes', 'pizza', 'rahmspinat'],
    'Getränke': ['sake', 'sherry', 'grüntee', 'hojicha', 'mineralwasser', 'saft', 'wasser', 'sprudel', 'bier', 'wein', 'rotwein', 'weißwein', 'kaffee', 'tee']
  };

  // Hat jede Küche da: kommt nicht auf die Einkaufsliste, steht aber im Rezept.
  const GRUNDVORRAT = ['salz', 'meersalz', 'pfeffer', 'salz und pfeffer', 'salz, pfeffer', 'wasser', 'öl', 'fett'];
  function istGrundvorrat(name) { return GRUNDVORRAT.includes(normalisiere(name)); }

  function normalisiere(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function kategorieRaten(name) {
    const n = normalisiere(name).replace(/\(.*?\)/g, ' ');
    const teile = n.split(/[\s,\-+/]+/).filter(Boolean);
    if (teile.includes('tk')) return 'Tiefkühl';
    const passt = w => teile.some(t => t === w || (w.length > 3 && (t.startsWith(w) || t.endsWith(w))));
    // Bei mehreren Treffern gewinnt das letzte Wort (der Kern: "passierte Tomaten" → "passierte" zählt vor "Tomaten").
    const reihenfolge = ['Vorrat', 'Kühlregal', 'Fleisch & Fisch', 'Tiefkühl', 'Brot & Backwaren', 'Getränke', 'Obst & Gemüse'];
    for (const kat of reihenfolge) if (STICHWORTE[kat].some(passt)) return kat;
    return 'Sonstiges';
  }

  // "500 g Nudeln" → {menge: 500, einheit: 'g', name: 'Nudeln'}
  // "2 Zwiebeln" → {menge: 2, einheit: '', name: 'Zwiebeln'}; "Salz" → {menge: null, ...}
  function zutatLesen(zeile) {
    const text = String(zeile || '').trim();
    if (!text) return null;
    const m = text.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+|½|¼|¾)\s*([A-Za-zÄÖÜäöüß]+\.?)?\s+(.+)$/) ||
              text.match(/^(\d+(?:[.,]\d+)?)([A-Za-zÄÖÜäöüß]+)$/);
    if (!m) return { menge: null, einheit: '', name: text, kategorie: kategorieRaten(text) };
    let menge = m[1];
    if (menge === '½') menge = 0.5; else if (menge === '¼') menge = 0.25; else if (menge === '¾') menge = 0.75;
    else if (menge.includes('/')) { const [a, b] = menge.split('/').map(Number); menge = a / b; }
    else menge = Number(menge.replace(',', '.'));
    let einheit = '';
    let name = m[3] || '';
    const kandidat = (m[2] || '').replace('.', '').toLowerCase();
    if (kandidat && EINHEITEN[kandidat]) einheit = EINHEITEN[kandidat];
    else if (kandidat) name = (m[2] + ' ' + name).trim();
    return { menge, einheit, name: name.trim(), kategorie: kategorieRaten(name) };
  }

  function zutatSchreiben(z) {
    if (z.menge == null) return z.name;
    const menge = Number.isInteger(z.menge) ? z.menge : String(Math.round(z.menge * 100) / 100).replace('.', ',');
    return [menge, z.einheit, z.name].filter(Boolean).join(' ');
  }

  // --- Datum und Woche (Montag ist der erste Tag) ---
  function isoDatum(d) {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  // beginn: Wochentag, an dem die Woche anfängt (0 = So, 1 = Mo, 5 = Fr).
  function wochenStart(datum, beginn = 1) {
    const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
    d.setDate(d.getDate() - ((d.getDay() - beginn + 7) % 7));
    return d;
  }

  function wochenTage(start) {
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  // ISO-Kalenderwoche, z. B. "2026-W48"
  function isoWoche(datum) {
    const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
    const tag = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - tag);
    const jahrStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const nr = Math.ceil(((d - jahrStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(nr).padStart(2, '0')}`;
  }

  // --- Einkaufsliste ---
  // "Möhre" und "Möhren" sollen zusammengezählt werden: ein End-n wird für den Vergleich ignoriert.
  function namensSchluessel(name) {
    const n = normalisiere(name);
    return n.length > 4 && n.endsWith('n') ? n.slice(0, -1) : n;
  }
  function schluessel(z) { return namensSchluessel(z.name) + '|' + (z.einheit || ''); }

  // Einkauf über mehrere Wochen: Was in einer Woche nicht abgehakt wurde, wandert in die nächste.
  // wochen: Wochen-Schlüssel in Reihenfolge, die letzte ist die angezeigte.
  // eigene(k): Posten der Woche k (mit schluessel), abgehakt(k): {pid: true}.
  // Jeder Posten bekommt herkunft (Woche, aus der er stammt) und pid (Schlüssel fürs Abhaken):
  // in der eigenen Woche der schluessel, übertragen "herkunft>schluessel".
  function einkaufMitUebertrag(wochen, eigene, abgehakt) {
    let mitgenommen = [];
    let alle = [];
    wochen.forEach((k, i) => {
      alle = [...mitgenommen, ...eigene(k).map(p => ({ ...p, herkunft: k, pid: p.schluessel }))];
      if (i === wochen.length - 1) return;
      const hak = abgehakt(k) || {};
      mitgenommen = alle.filter(p => !hak[p.pid])
        .map(p => ({ ...p, pid: p.herkunft === k ? k + '>' + p.schluessel : p.pid }));
    });
    return alle;
  }

  // kg/l werden zum Zusammenzählen in g/ml umgerechnet und danach wieder lesbar gemacht.
  function basisEinheit(z) {
    if (z.menge == null) return z;
    if (z.einheit === 'kg') return { ...z, menge: z.menge * 1000, einheit: 'g' };
    if (z.einheit === 'l') return { ...z, menge: z.menge * 1000, einheit: 'ml' };
    return z;
  }
  function schoeneEinheit(p) {
    if (p.menge != null && p.menge >= 1000 && (p.einheit === 'g' || p.einheit === 'ml')) {
      return { ...p, menge: p.menge / 1000, einheit: p.einheit === 'g' ? 'kg' : 'l' };
    }
    return p;
  }

  // Gleiche Zutat mit gleicher Einheit wird zusammengezählt.
  // Ergebnis: [{schluessel, name, einheit, menge, kategorie, gerichte:[namen]}], sortiert nach Kategorie, dann Name.
  function einkaufslisteBilden(gerichtIds, gerichte) {
    const nachId = new Map(gerichte.map(g => [g.id, g]));
    const posten = new Map();
    for (const id of gerichtIds) {
      const g = nachId.get(id);
      if (!g) continue;
      for (const roh of g.zutaten || []) {
        if (istGrundvorrat(roh.name)) continue;
        const z = basisEinheit(roh);
        const k = schluessel(z);
        const vorhanden = posten.get(k);
        if (vorhanden) {
          if (vorhanden.menge != null && z.menge != null) vorhanden.menge += z.menge;
          else if (z.menge != null) vorhanden.menge = z.menge;
          if (z.name.length > vorhanden.name.length) vorhanden.name = z.name; // Mehrzahl anzeigen
          if (!vorhanden.gerichte.includes(g.name)) vorhanden.gerichte.push(g.name);
        } else {
          posten.set(k, { schluessel: k, name: z.name, einheit: z.einheit || '', menge: z.menge, kategorie: z.kategorie || kategorieRaten(z.name), gerichte: [g.name] });
        }
      }
    }
    return [...posten.values()].map(schoeneEinheit).sort((a, b) =>
      KATEGORIEN.indexOf(a.kategorie) - KATEGORIEN.indexOf(b.kategorie) || a.name.localeCompare(b.name, 'de'));
  }

  function listeAlsText(titel, posten) {
    const zeilen = [titel];
    let kat = null;
    for (const p of posten) {
      if (p.kategorie !== kat) { kat = p.kategorie; zeilen.push('', kat + ':'); }
      zeilen.push('- ' + zutatSchreiben(p));
    }
    return zeilen.join('\n');
  }

  // Füllt leere Plätze mit Gerichten, die in dieser Woche noch nicht vorkommen.
  // zufall() ist austauschbar, damit Tests stabil bleiben.
  function vorschlagen(plaetze, belegt, gerichte, zufall = Math.random) {
    const genutzt = new Set(belegt.filter(Boolean));
    let pool = gerichte.filter(g => !genutzt.has(g.id));
    const ergebnis = {};
    for (const platz of plaetze) {
      if (!pool.length) pool = gerichte.slice();
      if (!pool.length) break;
      const i = Math.floor(zufall() * pool.length);
      ergebnis[platz] = pool[i].id;
      pool.splice(i, 1);
    }
    return ergebnis;
  }

  const api = { KATEGORIEN, istGrundvorrat, kategorieRaten, zutatLesen, zutatSchreiben, isoDatum, wochenStart, wochenTage, isoWoche, einkaufslisteBilden, einkaufMitUebertrag, namensSchluessel, listeAlsText, vorschlagen, normalisiere };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.EssenLogik = api;
})(typeof window !== 'undefined' ? window : globalThis);
