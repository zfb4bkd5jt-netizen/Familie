// Tests: node --test vorrat/logik.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('./logik.js');

const fr = new Date(2026, 10, 27, 10); // Fr 27.11.2026, Wocheneinkauf
const mo = new Date(2026, 10, 30, 18);
const naechsterFr = new Date(2026, 11, 4, 9);

test('Startliste hat feste, eindeutige ids', () => {
  const a = V.startArtikel();
  assert.ok(a.length > 30);
  assert.equal(new Set(a.map(x => x.id)).size, a.length);
  assert.equal(a.find(x => x.name === 'Spülmittel').id, 'v-spuelmittel');
  assert.equal(a.find(x => x.name === 'Zahnpasta').liste, 'dm');
  assert.ok(a.every(x => V.BEREICHE.includes(x.bereich)));
});

test('Fast leer landet in der laufenden Woche (Fr bis Do) auf der passenden Liste', () => {
  const essen = V.leererEssensplan();
  const vorrat = V.neuerVorrat();
  const spuel = vorrat.artikel.find(a => a.name === 'Spülmittel');
  const zahn = vorrat.artikel.find(a => a.name === 'Zahnpasta');
  assert.equal(V.aufDieListe(essen, spuel, mo), 'lidl');
  assert.equal(V.aufDieListe(essen, zahn, mo), 'dm');
  const w = essen.einkauf['2026-11-27'];
  assert.equal(w.extra.length, 2);
  assert.equal(w.extra[0].name, 'Spülmittel');
  assert.equal(w.extra[0].schluessel, 'extra|' + w.extra[0].id);
  assert.ok(w.extra[0].id, 'Einträge brauchen eine id für den Abgleich');
  assert.deepEqual(V.zustand(essen, zahn), { zustand: 'offen', liste: 'dm' });
});

test('Gelernte Zuordnung aus dem Einkauf geht vor', () => {
  const essen = { ...V.leererEssensplan(), zuordnung: { milch: 'heimweg' } };
  const milch = { id: 'v-milch', name: 'Milch', bereich: 'Kühlschrank' };
  assert.equal(V.aufDieListe(essen, milch, fr), 'heimweg');
});

test('Abhaken im Einkauf heißt gekauft, auch nach Übertrag in die Folgewoche', () => {
  const essen = V.leererEssensplan();
  const vorrat = V.neuerVorrat();
  const kaffee = vorrat.artikel.find(a => a.name === 'Kaffee');
  V.aufDieListe(essen, kaffee, fr);
  const pid = 'extra|' + kaffee.knapp.id;
  essen.einkauf['2026-12-04'] = { abgehakt: { ['2026-11-27>' + pid]: true }, extra: [] };
  assert.equal(V.zustand(essen, kaffee).zustand, 'gekauft');
  assert.equal(V.aufraeumen(vorrat, essen, naechsterFr), true);
  assert.equal(kaffee.knapp, undefined);
  assert.equal(kaffee.gekauft, '2026-12-04');
  assert.equal(V.aufraeumen(vorrat, essen, naechsterFr), false);
});

test('Abhaken in derselben Woche', () => {
  const essen = V.leererEssensplan();
  const a = { id: 'v-eier', name: 'Eier', bereich: 'Kühlschrank' };
  V.aufDieListe(essen, a, fr);
  essen.einkauf['2026-11-27'].abgehakt['extra|' + a.knapp.id] = true;
  assert.equal(V.zustand(essen, a).zustand, 'gekauft');
});

test('Doch nicht: Eintrag verschwindet wieder von der Liste', () => {
  const essen = V.leererEssensplan();
  const a = { id: 'v-reis', name: 'Reis', bereich: 'Vorratsschrank' };
  V.aufDieListe(essen, a, fr);
  V.vonDerListe(essen, a);
  assert.equal(essen.einkauf['2026-11-27'].extra.length, 0);
  assert.equal(V.zustand(essen, a).zustand, 'da');
});

test('Im Einkauf mit × entfernt: zählt als weg, wird aber nicht aufgeräumt', () => {
  const essen = V.leererEssensplan();
  const vorrat = { artikel: [{ id: 'v-tee', name: 'Tee', bereich: 'Vorratsschrank' }] };
  V.aufDieListe(essen, vorrat.artikel[0], fr);
  essen.einkauf['2026-11-27'].extra = [];
  assert.equal(V.zustand(essen, vorrat.artikel[0]).zustand, 'weg');
  assert.equal(V.aufraeumen(vorrat, essen, fr), false);
});

test('Der Einkauf im Essensplan zeigt den Artikel auf der richtigen Liste', () => {
  const L = require('../essen/logik.js');
  const essen = V.leererEssensplan();
  const a = { id: 'v-duschgel', name: 'Duschgel', bereich: 'Bad', liste: 'dm' };
  V.aufDieListe(essen, a, mo);
  const k = '2026-11-27';
  const posten = L.einkaufMitUebertrag([k], w => essen.einkauf[w].extra.map(x => ({ ...x, gerichte: [], extra: true })), w => essen.einkauf[w].abgehakt);
  assert.equal(posten.length, 1);
  assert.equal(posten[0].liste, 'dm');
  assert.equal(posten[0].pid, 'extra|' + a.knapp.id);
  assert.equal(L.zutatSchreiben(posten[0]), 'Duschgel');
});
