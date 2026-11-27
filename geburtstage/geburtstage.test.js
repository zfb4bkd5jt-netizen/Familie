// Tests: node --test geburtstage/geburtstage.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Lädt familie.js, aufgaben-daten.js und geburtstage-daten.js mit festem "heute". */
function umgebung(heuteIso) {
  const daten = {};
  const localStorage = {
    getItem: (k) => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v); },
    removeItem: (k) => { delete daten[k]; },
    key: (i) => Object.keys(daten)[i],
    get length() { return Object.keys(daten).length; }
  };
  const [j, m, t] = heuteIso.split('-').map(Number);
  const EchtesDate = Date;
  class FestesDate extends EchtesDate {
    constructor(...a) { if (a.length) super(...a); else super(j, m - 1, t, 12); }
    static now() { return new EchtesDate(j, m - 1, t, 12).getTime(); }
  }
  const ctx = { localStorage, Date: FestesDate, Math, JSON, String, Number, Array, Object, parseInt, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['gemeinsam/familie.js', 'aufgaben/aufgaben-daten.js', 'geburtstage/geburtstage-daten.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

test('nächstes und letztes Datum, Alter', () => {
  const { Anlaesse } = umgebung('2026-11-27');
  const a = { tag: '03-12', jahr: 1951 };
  assert.equal(Anlaesse.naechstesDatum(a), '2027-03-12');
  assert.equal(Anlaesse.letztesDatum(a), '2026-03-12');
  assert.equal(Anlaesse.wievielte(a), 76);
  assert.equal(Anlaesse.naechstesDatum({ tag: '11-27' }), '2026-11-27', 'heute zählt als nächstes');
  assert.equal(Anlaesse.letztesDatum({ tag: '11-27' }), '2025-11-27');
  assert.equal(Anlaesse.naechstesDatum({ tag: '02-29' }), '2027-02-28');
  assert.equal(Anlaesse.naechstesDatum({ tag: '02-29' }, '2028-01-01'), '2028-02-29');
});

test('sortiert nach nächstem Datum', () => {
  const { Anlaesse } = umgebung('2026-11-27');
  Anlaesse.speichern({ name: 'A', tag: '01-05', vorlaufTage: 0 });
  Anlaesse.speichern({ name: 'B', tag: '12-01', vorlaufTage: 0 });
  Anlaesse.speichern({ name: 'C', tag: '11-26', vorlaufTage: 0 });
  assert.deepEqual([...Anlaesse.demnaechst().map((e) => e.anlass.name)], ['B', 'A', 'C']);
  assert.equal(Anlaesse.demnaechst()[0].tage, 4);
});

test('Erinnerung als jährliche Aufgabe, nicht doppelt', () => {
  const { Anlaesse, Aufgaben } = umgebung('2026-11-27');
  const a = Anlaesse.speichern({ name: 'Opa Eddy', tag: '03-12', vorlaufTage: 14 });
  let auf = Aufgaben.holen('anlass-' + a.id);
  assert.ok(auf);
  assert.equal(auf.faellig, '2027-02-26');
  assert.equal(auf.wiederholung.art, 'jaehrlich');
  assert.equal(auf.kategorie, 'geburtstag');
  assert.match(auf.titel, /Opa Eddy/);
  Anlaesse.speichern({ id: a.id, notiz: 'mag Krimis' });
  assert.equal(Aufgaben.alle().length, 1);

  // Abhaken bleibt beim erneuten Speichern erhalten
  Aufgaben.erledigen(auf.id);
  Anlaesse.speichern({ id: a.id, name: 'Opa Eddy' });
  assert.equal(Aufgaben.holen(auf.id).faellig, '2028-02-26');

  // Datum geändert -> neu berechnet
  Anlaesse.speichern({ id: a.id, tag: '04-01' });
  assert.equal(Aufgaben.holen(auf.id).faellig, '2027-03-18');

  // Keine Erinnerung -> Aufgabe weg; Löschen räumt auf
  Anlaesse.speichern({ id: a.id, vorlaufTage: 0 });
  assert.equal(Aufgaben.holen(auf.id), null);
  Anlaesse.speichern({ id: a.id, vorlaufTage: 7 });
  Anlaesse.loeschen(a.id);
  assert.equal(Aufgaben.alle().length, 0);
});

test('Anlass kurz bevor: Erinnerung ab heute fällig', () => {
  const { Anlaesse, Aufgaben } = umgebung('2026-11-27');
  const a = Anlaesse.speichern({ name: 'Tilda', tag: '12-02', vorlaufTage: 14 });
  const auf = Aufgaben.holen('anlass-' + a.id);
  assert.equal(auf.faellig, '2026-11-27');
  assert.equal(Aufgaben.status(auf), 'heute');
  Aufgaben.erledigen(auf.id);
  assert.equal(Aufgaben.holen(auf.id).faellig, '2027-11-18');
});

test('Ideen: offen, gekauft, nach dem Anlass verschenkt', () => {
  const { Anlaesse } = umgebung('2026-11-27');
  const a = Anlaesse.speichern({ name: 'Maike', tag: '12-10', vorlaufTage: 7 });
  const i = Anlaesse.ideeHinzufuegen(a.id, '  Hörbuch ');
  assert.equal(i.text, 'Hörbuch');
  assert.equal(Anlaesse.ideeHinzufuegen(a.id, '   '), null);
  let x = Anlaesse.holen(a.id);
  assert.equal(Anlaesse.ideeStatus(x, x.ideen[0]).status, 'offen');
  Anlaesse.ideeAendern(a.id, i.id, { gekauftAm: '2026-11-27' });
  x = Anlaesse.holen(a.id);
  assert.equal(Anlaesse.ideeStatus(x, x.ideen[0]).status, 'gekauft');
  assert.deepEqual({ ...Anlaesse.ideeStatus(x, x.ideen[0], '2026-12-11') }, { status: 'verschenkt', jahr: 2026 });
  assert.equal(Anlaesse.ideeStatus(x, x.ideen[0], '2026-12-10').status, 'gekauft', 'am Tag selbst noch gekauft');
  Anlaesse.ideeLoeschen(a.id, i.id);
  assert.equal(Anlaesse.holen(a.id).ideen.length, 0);
});

test('Geschenk gekauft hakt fällige Erinnerung ab, spätere nicht', () => {
  const { Anlaesse, Aufgaben } = umgebung('2026-11-27');
  const a = Anlaesse.speichern({ name: 'Maike', tag: '12-10', vorlaufTage: 14 });
  const i = Anlaesse.ideeHinzufuegen(a.id, 'Buch');
  assert.equal(Aufgaben.holen('anlass-' + a.id).faellig, '2026-11-27');
  Anlaesse.ideeAendern(a.id, i.id, { gekauftAm: '2026-11-27' });
  assert.equal(Aufgaben.holen('anlass-' + a.id).faellig, '2027-11-26');
  assert.equal(Aufgaben.holen('anlass-' + a.id).titel, 'Geschenk für Maike (Geburtstag 10.12.)');

  const b = Anlaesse.speichern({ name: 'Benno', tag: '06-01', vorlaufTage: 14 });
  const j = Anlaesse.ideeHinzufuegen(b.id, 'Fahrrad');
  Anlaesse.ideeAendern(b.id, j.id, { gekauftAm: '2026-11-27' });
  assert.equal(Aufgaben.holen('anlass-' + b.id).faellig, '2027-05-18');
});

test('termineZwischen für Kalender', () => {
  const { Anlaesse } = umgebung('2026-11-27');
  Anlaesse.speichern({ name: 'Benno', tag: '12-24', vorlaufTage: 0 });
  Anlaesse.speichern({ art: 'sonstiges', titel: 'Muttertag', tag: '05-09', vorlaufTage: 0 });
  const t = Anlaesse.termineZwischen('2026-12-01', '2027-12-31');
  assert.deepEqual([...t.map((e) => e.datum)], ['2026-12-24', '2027-05-09', '2027-12-24']);
  assert.equal(t[0].titel, 'Geburtstag Benno');
  assert.equal(t[1].titel, 'Muttertag');
});
