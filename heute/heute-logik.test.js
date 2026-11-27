// Tests für die Heute-Ansicht: node --test heute/heute-logik.test.js
"use strict";
const test = require("node:test");
const assert = require("assert");
require("./heute-logik.js");
const L = globalThis.HeuteLogik;

test("Sport-Hinweis nur Mo und Do", () => {
  assert.strictEqual(L.hinweise("2026-11-30").length, 1);   // Mo
  assert.strictEqual(L.hinweise("2026-12-03").length, 1);   // Do
  assert.strictEqual(L.hinweise("2026-12-01").length, 0);   // Di
  assert.strictEqual(L.hinweise("2026-11-27").length, 0);   // Fr
});
test("kein Sport in den Weihnachtsferien und nach dem Halbjahr", () => {
  assert.strictEqual(L.hinweise("2026-12-28").length, 0);   // Mo, Ferien
  assert.strictEqual(L.hinweise("2027-01-04").length, 0);   // Mo, Ferien
  assert.strictEqual(L.hinweise("2027-01-07").length, 1);   // Do, wieder Schule
  assert.strictEqual(L.hinweise("2027-02-08").length, 0);   // Mo, neuer Stundenplan
});
test("nicht doppelt, wenn der Google Kalender schon erinnert", () => {
  assert.strictEqual(L.hinweise("2026-11-30", [{ titel: "🎽 Sportzeug für Benno mitgeben" }]).length, 0);
});
test("Essen des Tages", () => {
  const d = { gerichte: [{ id: "a", name: "Lasagne" }, { id: "b", name: "Pfannkuchen" }],
    plan: { "2026-11-28": { mittag: "b", abend: "a" }, "2026-11-29": { abend: "weg" } } };
  assert.deepStrictEqual(L.essen(d, "2026-11-28").map(m => m.mahlzeit + ": " + m.name), ["Mittag: Pfannkuchen", "Abend: Lasagne"]);
  assert.deepStrictEqual(L.essen(d, "2026-11-29"), []);
  assert.deepStrictEqual(L.essen(null, "2026-11-29"), []);
});
test("Termine sortiert, ganztags zuerst, doppelte raus", () => {
  const t = L.termine([
    { titel: "Zahnarzt", datum: "2026-11-30", uhrzeit: "15:00" },
    { titel: "Kita-Fest", datum: "2026-11-30", uhrzeit: "10:00" },
    { titel: "Kita-Fest", datum: "2026-11-30", uhrzeit: "10:00" },
    { titel: "Restmüll", datum: "2026-11-30", uhrzeit: null },
    { titel: "Morgen", datum: "2026-12-01", uhrzeit: "09:00" }
  ], "2026-11-30");
  assert.deepStrictEqual(t.map(x => x.titel), ["Restmüll", "Kita-Fest", "Zahnarzt"]);
});
