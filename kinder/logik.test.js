// Tests: node --test kinder/
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./logik.js');

const HEUTE = '2026-11-27'; // Freitag

test('Datum finden', () => {
  assert.equal(L.datumFinden('Elternabend am 03.12.2026', HEUTE).datum, '2026-12-03');
  assert.equal(L.datumFinden('am 5.12. ist Nikolausfeier', HEUTE).datum, '2026-12-05');
  assert.equal(L.datumFinden('Ausflug am 14. Januar', HEUTE).datum, '2027-01-14');
  assert.equal(L.datumFinden('Fest am 20.11.', HEUTE).datum, '2026-11-20');
  assert.equal(L.datumFinden('Am 8.3.27 Fotograf', HEUTE).datum, '2027-03-08');
  assert.equal(L.datumFinden('Bitte bis Mittwoch abgeben', HEUTE).datum, '2026-12-02');
  assert.equal(L.datumFinden('am Freitag', HEUTE).datum, '2026-12-04');
  assert.equal(L.datumFinden('morgen bitte Turnbeutel', HEUTE).datum, '2026-11-28');
  assert.equal(L.datumFinden('Wir haben 3 Kinder', HEUTE), null);
  assert.equal(L.datumFinden('Kosten 2.50 Euro', HEUTE), null);
});

test('Uhrzeit finden', () => {
  assert.equal(L.uhrzeitFinden('um 19:30 Uhr in der Aula'), '19:30');
  assert.equal(L.uhrzeitFinden('ab 15 Uhr'), '15:00');
  assert.equal(L.uhrzeitFinden('von 9 bis 12 Uhr'), '9:00–12:00');
  assert.equal(L.uhrzeitFinden('ohne Zeit'), null);
});

test('Nachricht aus der Schul-App', () => {
  const text = `Liebe Eltern der 1b,
am Donnerstag, 03.12., findet um 19:30 Uhr der Elternabend in der Aula statt.
Am 11.12. machen wir unseren Ausflug ins Theater. Bitte geben Sie Ihrem Kind 5 € mit und denken Sie an wetterfeste Kleidung.
Viele Grüße, Frau Schumacher`;
  const v = L.vorschlaege(text, HEUTE);
  assert.equal(v.length, 3);
  assert.deepEqual(v.map(x => [x.art, x.datum]), [
    ['termin', '2026-12-03'], ['termin', '2026-12-11'], ['aufgabe', '2026-12-11']
  ]);
  assert.equal(v[0].uhrzeit, '19:30');
  assert.deepEqual(v.map(x => x.titel), ['Elternabend in der Aula', 'Ausflug ins Theater',
    '5 € mitgeben und denken Sie an wetterfeste Kleidung']);
});

test('Nachricht aus der Kita-App', () => {
  const text = 'Hallo zusammen! Die Kita ist am 24.12. und 31.12. geschlossen. Für das Basteln bitte bis Montag eine leere Küchenrolle mitbringen.';
  const v = L.vorschlaege(text, HEUTE);
  assert.deepEqual(v.map(x => [x.art, x.datum]), [['termin', '2026-12-24'], ['termin', '2026-12-31'], ['aufgabe', '2026-11-30']]);
  assert.equal(v[0].titel, 'Kita ist am 24.12. und 31.12. geschlossen');
  assert.equal(v[2].titel, 'Für das Basteln bitte eine leere Küchenrolle mitbringen');
});

test('Ohne Datum und ohne Aufgabe kommt nichts', () => {
  assert.deepEqual(L.vorschlaege('Heute war ein schöner Tag im Wald. Alle hatten Spaß', HEUTE), []);
  assert.equal(L.vorschlaege('Heute bitte Hausschuhe mitbringen', HEUTE)[0].datum, HEUTE);
  assert.deepEqual(L.vorschlaege('', HEUTE), []);
});

test('Elternbrief Förderverein (Foto)', () => {
  const text = `Der Advent „Auf der Burg" findet am Samstag, den 28.11.2026, statt.
Die Abgabe der Kuchen ist am 28.11.2026 in der Zeit von 10:00 Uhr bis 11:30 Uhr im Bürgerhaus Niederschelden.
Wichtig ist, dass die Kuchenboxen mit dem Namen versehen werden.
Die Abholung der Kuchenboxen muss ebenfalls im Bürgerhaus von 17:00 Uhr bis 19:00 Uhr erfolgen.
Bitte geben Sie den unteren Abschnitt bis zum 20.11.2026 bei der Klassenlehrerin ab.`;
  const v = L.vorschlaege(text, '2026-11-15');
  assert.deepEqual(v.map(x => [x.art, x.datum, x.uhrzeit, x.titel]), [
    ['termin', '2026-11-28', null, 'Advent „Auf der Burg"'],
    ['termin', '2026-11-28', '10:00–11:30', 'Abgabe der Kuchen ist im Bürgerhaus Niederschelden'],
    ['aufgabe', '2026-11-28', null, 'Wichtig ist, dass die Kuchenboxen mit dem Namen versehen werden'],
    ['aufgabe', '2026-11-28', '17:00–19:00', 'Abholung der Kuchenboxen muss ebenfalls im Bürgerhaus erfolgen'],
    ['aufgabe', '2026-11-20', null, 'Geben Sie den unteren Abschnitt bei der Klassenlehrerin ab']
  ]);
});
