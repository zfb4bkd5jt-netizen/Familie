// Tests für den Bring-Plan: node --test bringen/logik.test.js
"use strict";
const test = require("node:test");
const assert = require("assert");
const B = require("./logik.js");

const personen = [
  { id: "m", name: "Matthias" }, { id: "k", name: "Maike" },
  { id: "b", name: "Benno" }, { id: "t", name: "Tilda" }
];
const ferien = iso => iso >= "2026-12-23" && iso <= "2027-01-06";

test("Kinder bringen sich nicht selbst", () => {
  assert.deepStrictEqual(B.standardKandidaten(personen), ["m", "k"]);
  const p = B.neuerPlan(personen);
  assert.deepStrictEqual(p.wege.map(w => w.id), ["tilda-kita", "benno-bus"]);
  assert.strictEqual(p.wege[0].regel[1], "m");
});

test("Regelplan je Wochentag, Wochenende frei", () => {
  const p = B.neuerPlan(personen);
  p.wege[0].regel[2] = "k";                       // Di bringt Maike Tilda
  assert.strictEqual(B.tag(p, "2026-11-30")[0].personId, "m");   // Mo
  assert.strictEqual(B.tag(p, "2026-12-01")[0].personId, "k");   // Di
  assert.strictEqual(B.tag(p, "2026-11-28").length, 0);          // Sa
});

test("Bus nicht in den Schulferien, Kita schon", () => {
  const p = B.neuerPlan(personen);
  const t = B.tag(p, "2026-12-28", ferien);
  assert.deepStrictEqual(t.map(e => e.weg.id), ["tilda-kita"]);
});

test("Tausch mit einem Tipp, zweiter Tipp tauscht zurück", () => {
  const p = B.neuerPlan(personen);
  assert.strictEqual(B.tauschen(p, "tilda-kita", "2026-11-30"), "k");
  let e = B.tag(p, "2026-11-30")[0];
  assert.strictEqual(e.personId, "k");
  assert.ok(e.getauscht);
  assert.strictEqual(B.tag(p, "2026-12-07")[0].personId, "m", "nur dieser Tag");
  B.tauschen(p, "tilda-kita", "2026-11-30");
  e = B.tag(p, "2026-11-30")[0];
  assert.strictEqual(e.personId, "m");
  assert.ok(!e.getauscht);
  assert.deepStrictEqual(p.tage, {}, "zurück zum Plan hinterlässt keine Abweichung");
});

test("Opa Eddy erst nach Ankreuzen, dann reihum", () => {
  const ps = personen.concat({ id: "e", name: "Opa Eddy" });
  const p = B.neuerPlan(ps);
  assert.deepStrictEqual(p.wege[1].kandidaten, ["m", "k"]);
  p.wege[1].kandidaten.push("e");
  assert.deepStrictEqual(["k", "e", "m"].map(() => B.tauschen(p, "benno-bus", "2026-12-02")), ["k", "e", "m"]);
});

test("Ohne Regel: erster Tipp setzt jemanden", () => {
  const p = B.neuerPlan(personen);
  delete p.wege[1].regel[3];
  assert.strictEqual(B.tag(p, "2026-12-02")[1].personId, null);
  assert.strictEqual(B.tauschen(p, "benno-bus", "2026-12-02"), "m");
});

test("Fällt aus und wieder normal", () => {
  const p = B.neuerPlan(personen);
  B.ausfallUmschalten(p, "tilda-kita", "2026-11-30");
  assert.ok(B.tag(p, "2026-11-30")[0].ausfall);
  B.tauschen(p, "tilda-kita", "2026-11-30");       // Tipp nach Ausfall: wieder jemand bringt
  assert.strictEqual(B.tag(p, "2026-11-30")[0].personId, "m");
  B.ausfallUmschalten(p, "tilda-kita", "2026-11-30");
  B.ausfallUmschalten(p, "tilda-kita", "2026-11-30");
  assert.deepStrictEqual(p.tage, {});
});

test("Aufräumen: gelöschte Personen raus, alte Tage weg", () => {
  const p = B.neuerPlan(personen);
  p.tage["2026-11-01|tilda-kita"] = "k";
  p.tage["2026-11-30|tilda-kita"] = "k";
  assert.ok(B.aufraeumen(p, personen.filter(x => x.id !== "m"), "2026-11-28"));
  assert.deepStrictEqual(p.wege[0].kandidaten, ["k"]);
  assert.strictEqual(p.wege[0].regel[1], undefined);
  assert.deepStrictEqual(Object.keys(p.tage), ["2026-11-30|tilda-kita"]);
  assert.ok(!B.aufraeumen(p, personen.filter(x => x.id !== "m"), "2026-11-28"));
});

test("Heute-Karte: morgens heute, später der nächste Bring-Tag", () => {
  const p = B.neuerPlan(personen);
  assert.deepStrictEqual(B.anzeigeTag(p, "2026-11-30", "07:10"), { iso: "2026-11-30", heute: true });
  assert.strictEqual(B.anzeigeTag(p, "2026-11-30", "18:00").iso, "2026-12-01");
  assert.ok(B.anzeigeTag(p, "2026-11-30", "18:00").morgen);
  assert.strictEqual(B.anzeigeTag(p, "2026-11-27", "18:00"), null);              // Fr abends: Wochenende
  assert.strictEqual(B.anzeigeTag(p, "2026-11-28", "10:02"), null);              // Sa: nichts
  assert.strictEqual(B.anzeigeTag(p, "2026-11-29", "18:00").iso, "2026-11-30");   // So -> Mo
});

test("Montag der Woche", () => {
  assert.strictEqual(B.montag("2026-11-28"), "2026-11-23");
  assert.strictEqual(B.montag("2026-11-29"), "2026-11-23");
  assert.strictEqual(B.montag("2026-11-30"), "2026-11-30");
});

test("Plan ohne Personen bekommt sie später", () => {
  const p = B.neuerPlan([]);
  assert.ok(B.aufraeumen(p, personen, "2026-11-28"));
  assert.deepStrictEqual(p.wege[1].kandidaten, ["m", "k"]);
  assert.strictEqual(p.wege[1].regel[5], "m");
});
