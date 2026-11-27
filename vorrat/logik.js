// Vorrat: reine Logik ohne DOM. Nutzt die Einkaufslisten aus dem Essensplan
// (Key "familie.essen.v1"): Ein Tipp auf „fast leer“ legt dort einen Artikel an,
// genau so, wie man ihn im Reiter Einkauf selbst eintragen würde.
// Läuft im Browser (window.VorratLogik, nach essen/logik.js) und in Node (Tests).
(function (global) {
  'use strict';
  const L = global.EssenLogik || (typeof require !== 'undefined' ? require('../essen/logik.js') : null);

  // Wie in essen/essen.js: Woche läuft Fr bis Do, LIDL ist die Standardliste.
  const WOCHENBEGINN = 5;
  const LISTEN = [['lidl', 'LIDL'], ['dm', 'DM'], ['heimweg', 'Heimweg'], ['ikea', 'IKEA'], ['baumarkt', 'Baumarkt'], ['apotheke', 'Apotheke']];
  const STANDARDLISTE = 'lidl';
  const BEREICHE = ['Kühlschrank', 'Vorratsschrank', 'Bad', 'Haushalt', 'Hausapotheke'];

  // Häufige Dinge zum Start. Feste ids, damit zwei Handys dieselbe Liste anlegen.
  const START = [
    ['Kühlschrank', ['Milch', 'Butter', 'Eier', 'Käse', 'Joghurt', 'Aufschnitt', 'Frischkäse']],
    ['Vorratsschrank', ['Brot', 'Kaffee', 'Tee', 'Müsli', 'Haferflocken', 'Nudeln', 'Reis', 'Mehl', 'Zucker', 'Öl', 'Salz', 'Pfeffer', 'Passierte Tomaten', 'Brühe', 'Honig', 'Marmelade', 'Ketchup']],
    ['Bad', ['Toilettenpapier', 'Taschentücher', ['Zahnpasta', 'dm'], ['Duschgel', 'dm'], ['Shampoo', 'dm'], ['Deo', 'dm'], ['Feuchttücher', 'dm'], ['Wattepads', 'dm']]],
    ['Haushalt', ['Küchenrolle', 'Spülmittel', 'Spülmaschinentabs', 'Waschmittel', 'Müllbeutel', 'Frischhaltefolie', 'Alufolie', 'Backpapier', 'Schwämme', ['Batterien', 'dm']]],
    ['Hausapotheke', [['Pflaster', 'dm'], ['Fiebersaft', 'apotheke'], ['Nasenspray', 'apotheke']]]
  ];
  const slug = name => 'v-' + L.normalisiere(name).replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-');

  function startArtikel() {
    return START.flatMap(([bereich, liste]) => liste.map(a => {
      const [name, l] = Array.isArray(a) ? a : [a, null];
      const art = { id: slug(name), name, bereich };
      if (l) art.liste = l;
      return art;
    }));
  }

  function neuerVorrat() { return { version: 1, artikel: startArtikel() }; }

  const wocheVon = datum => L.isoDatum(L.wochenStart(datum, WOCHENBEGINN));

  function leererEssensplan() { return { version: 1, gerichte: [], plan: {}, einkauf: {} }; }

  // Gelernte Zuordnung aus dem Einkauf (⇄ verschieben) geht vor, sonst die Liste des Artikels.
  function listeFuer(artikel, essen) {
    const gelernt = ((essen && essen.zuordnung) || {})[L.namensSchluessel(artikel.name)];
    return gelernt || artikel.liste || STANDARDLISTE;
  }

  // Legt den Artikel auf die Einkaufsliste der laufenden Woche. Ändert essen und artikel.
  function aufDieListe(essen, artikel, jetzt = new Date()) {
    const k = wocheVon(jetzt);
    essen.einkauf = essen.einkauf || {};
    const w = essen.einkauf[k] || (essen.einkauf[k] = { abgehakt: {}, extra: [] });
    w.extra = w.extra || []; w.abgehakt = w.abgehakt || {};
    const id = 'vorrat-' + artikel.id + '-' + jetzt.getTime().toString(36);
    const liste = listeFuer(artikel, essen);
    w.extra.push({ id, menge: null, einheit: '', name: artikel.name, kategorie: L.kategorieRaten(artikel.name), schluessel: 'extra|' + id, liste, vorrat: artikel.id });
    artikel.knapp = { woche: k, id, am: L.isoDatum(jetzt) };
    return liste;
  }

  // Wo steht der Artikel gerade?
  // {zustand: 'da'} | {zustand: 'offen', liste} | {zustand: 'gekauft'} (abgehakt) | {zustand: 'weg'} (von Hand entfernt)
  function zustand(essen, artikel) {
    const k = artikel.knapp;
    if (!k) return { zustand: 'da' };
    const einkauf = (essen && essen.einkauf) || {};
    const x = ((einkauf[k.woche] || {}).extra || []).find(e => e.id === k.id);
    if (!x) return { zustand: 'weg' };
    const pid = 'extra|' + k.id;
    // In der eigenen Woche heißt der Haken wie der Artikel, in Folgewochen (Übertrag) "woche>schluessel".
    const gekauft = Object.entries(einkauf).some(([w, e]) => {
      const hak = (e && e.abgehakt) || {};
      return (w === k.woche && hak[pid]) || (w > k.woche && hak[k.woche + '>' + pid]);
    });
    return gekauft ? { zustand: 'gekauft' } : { zustand: 'offen', liste: x.liste || STANDARDLISTE };
  }

  // „Doch nicht“: Eintrag samt Haken wieder von der Liste nehmen.
  function vonDerListe(essen, artikel) {
    const k = artikel.knapp;
    if (!k) return;
    const w = ((essen && essen.einkauf) || {})[k.woche];
    if (w) {
      w.extra = (w.extra || []).filter(e => e.id !== k.id);
      if (w.abgehakt) delete w.abgehakt['extra|' + k.id];
    }
    for (const e of Object.values((essen && essen.einkauf) || {})) if (e && e.abgehakt) delete e.abgehakt[k.woche + '>extra|' + k.id];
    delete artikel.knapp;
  }

  // Abgehakte Einträge abschließen: knapp weg, Kaufdatum merken. Gibt true zurück, wenn sich etwas geändert hat.
  // 'weg' wird bewusst nicht aufgeräumt: Der Essensplan kann auf diesem Handy noch auf dem Weg sein.
  // Angezeigt wird so ein Artikel trotzdem als „da“, und ein neuer Tipp überschreibt knapp.
  function aufraeumen(vorrat, essen, heute = new Date()) {
    let geaendert = false;
    for (const a of vorrat.artikel) {
      if (zustand(essen, a).zustand !== 'gekauft') continue;
      a.gekauft = L.isoDatum(heute); delete a.knapp; geaendert = true;
    }
    return geaendert;
  }

  const api = { WOCHENBEGINN, LISTEN, STANDARDLISTE, BEREICHE, startArtikel, neuerVorrat, slug, wocheVon, leererEssensplan, listeFuer, aufDieListe, zustand, vonDerListe, aufraeumen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.VorratLogik = api;
})(typeof window !== 'undefined' ? window : globalThis);
