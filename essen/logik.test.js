// Tests: node --test essen/
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./logik.js');

test('Zutaten lesen', () => {
  assert.deepEqual(L.zutatLesen('500 g Nudeln'), { menge: 500, einheit: 'g', name: 'Nudeln', kategorie: 'Vorrat' });
  assert.deepEqual(L.zutatLesen('2 Zwiebeln'), { menge: 2, einheit: '', name: 'Zwiebeln', kategorie: 'Obst & Gemüse' });
  assert.equal(L.zutatLesen('1,5 l Milch').menge, 1.5);
  assert.equal(L.zutatLesen('½ Bund Petersilie').menge, 0.5);
  assert.equal(L.zutatLesen('Salz').menge, null);
  assert.equal(L.zutatLesen('   '), null);
  assert.equal(L.zutatLesen('1 Dose passierte Tomaten').einheit, 'Dose');
});

test('Kategorien raten', () => {
  const f = L.kategorieRaten;
  assert.equal(f('TK-Erbsen'), 'Tiefkühl');
  assert.equal(f('passierte Tomaten'), 'Vorrat');
  assert.equal(f('Tomaten'), 'Obst & Gemüse');
  assert.equal(f('Eier'), 'Kühlregal');
  assert.equal(f('Eisbergsalat'), 'Obst & Gemüse');
  assert.equal(f('Gemüsebrühe'), 'Vorrat');
  assert.equal(f('Hackfleisch'), 'Fleisch & Fisch');
  assert.equal(f('Olivenöl'), 'Vorrat');
  assert.equal(f('Klopapier'), 'Sonstiges');
});

test('Woche und ISO-Datum', () => {
  const s = L.wochenStart(new Date(2026, 10, 27)); // Fr 27.11.2026
  assert.equal(L.isoDatum(s), '2026-11-23');
  assert.equal(L.isoWoche(s), '2026-W48');
  assert.equal(L.isoWoche(new Date(2027, 0, 1)), '2026-W53');
  assert.equal(L.wochenTage(s).length, 7);
});

test('Einkaufsliste fasst gleiche Zutaten zusammen', () => {
  const g = [
    { id: 'a', name: 'A', zutaten: ['500 g Nudeln', '1 Zwiebel', 'Salz'].map(L.zutatLesen) },
    { id: 'b', name: 'B', zutaten: ['250 g nudeln', '2 Zwiebeln', '1 kg Kartoffeln'].map(L.zutatLesen) }
  ];
  const liste = L.einkaufslisteBilden(['a', 'b', 'a', 'x'], g);
  const nudeln = liste.find(p => p.name.toLowerCase() === 'nudeln');
  assert.equal(nudeln.menge, 1.25);
  assert.equal(nudeln.einheit, 'kg');
  assert.equal(liste.find(p => p.name === 'Kartoffeln').einheit, 'kg');
  assert.deepEqual(nudeln.gerichte, ['A', 'B']);
  assert.equal(liste.find(p => p.name === 'Zwiebeln').menge, 4);
  assert.equal(liste[0].kategorie, 'Obst & Gemüse'); // Supermarkt-Reihenfolge
  assert.match(L.listeAlsText('T', liste), /- 1,25 kg Nudeln/);
});

test('g und kg werden zusammengezählt', () => {
  const g = [{ id: 'a', name: 'A', zutaten: ['500 g Kartoffeln', '1 kg Kartoffeln', '500 ml Brühe', '1 l Brühe', '200 g Reis'].map(L.zutatLesen) }];
  const liste = L.einkaufslisteBilden(['a'], g);
  assert.equal(L.zutatSchreiben(liste.find(p => p.name === 'Kartoffeln')), '1,5 kg Kartoffeln');
  assert.equal(L.zutatSchreiben(liste.find(p => p.name === 'Brühe')), '1,5 l Brühe');
  assert.equal(L.zutatSchreiben(liste.find(p => p.name === 'Reis')), '200 g Reis');
});

test('Vorschläge vermeiden Wiederholungen', () => {
  const g = ['a', 'b', 'c'].map(id => ({ id }));
  const v = L.vorschlagen(['p1', 'p2'], ['a'], g, () => 0);
  assert.deepEqual(Object.values(v).sort(), ['b', 'c']);
  assert.equal(Object.keys(L.vorschlagen(['p1', 'p2', 'p3', 'p4'], [], g, () => 0)).length, 4);
});

test('Grundvorrat kommt nicht auf die Einkaufsliste', () => {
  const g = [{ id: 'a', name: 'A', zutaten: ['1 TL Salz', 'Pfeffer', '250 ml Wasser', '1 EL Fett', '200 g Reis'].map(L.zutatLesen) }];
  assert.deepEqual(L.einkaufslisteBilden(['a'], g).map(p => p.name), ['Reis']);
});

test('Zusammengesetzte Wörter landen in der richtigen Abteilung', () => {
  const f = L.kategorieRaten;
  assert.equal(f('Frühstücksfleisch'), 'Vorrat');
  assert.equal(f('Kidneybohnen'), 'Vorrat');
  assert.equal(f('Bandnudeln'), 'Vorrat');
  assert.equal(f('Frühlingszwiebeln'), 'Obst & Gemüse');
  assert.equal(f('Schlagsahne'), 'Kühlregal');
  assert.equal(f('TK-Rahmspinat'), 'Tiefkühl');
  assert.equal(f('Kichererbsen'), 'Vorrat');
  assert.equal(f('Thymian (getrocknet)'), 'Vorrat');
});

test('Alle Familienrezepte sind lesbar und haben eindeutige ids', () => {
  global.window = {};
  require('./rezepte.js');
  const rezepte = global.window.FAMILIEN_REZEPTE;
  assert.ok(rezepte.length > 0);
  assert.equal(new Set(rezepte.map(r => r.id)).size, rezepte.length);
  for (const r of rezepte) {
    assert.ok(r.name && r.zubereitung, r.id);
    for (const z of r.zutaten) assert.ok(L.zutatLesen(z).name, `${r.id}: ${z}`);
  }
});

test('Woche beginnt am Freitag', () => {
  const s = L.wochenStart(new Date(2026, 11, 3), 5); // Do 3.12.
  assert.equal(L.isoDatum(s), '2026-11-27');
  assert.equal(L.isoDatum(L.wochenStart(new Date(2026, 10, 27), 5)), '2026-11-27');
  assert.equal(L.isoDatum(L.wochenStart(new Date(2026, 10, 26), 5)), '2026-11-20');
});

test('Offene Artikel wandern in die nächste Woche', () => {
  const eigene = { a: [{ schluessel: 'milch|l' }, { schluessel: 'brot|' }], b: [{ schluessel: 'milch|l' }], c: [] };
  const hak = { a: { 'brot|': true }, b: { 'milch|l': true }, c: {} };
  const b = L.einkaufMitUebertrag(['a', 'b'], k => eigene[k], k => hak[k]);
  assert.deepEqual(b.map(p => p.pid), ['a>milch|l', 'milch|l']);
  // In c ist nur noch die Milch aus a offen, die aus b wurde abgehakt.
  const c = L.einkaufMitUebertrag(['a', 'b', 'c'], k => eigene[k], k => hak[k]);
  assert.deepEqual(c.map(p => [p.pid, p.herkunft]), [['a>milch|l', 'a']]);
  // Abgehakt in b: dann ist sie in c weg.
  hak.b['a>milch|l'] = true;
  assert.equal(L.einkaufMitUebertrag(['a', 'b', 'c'], k => eigene[k], k => hak[k]).length, 0);
});
