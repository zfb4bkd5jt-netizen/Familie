// Tests: node --test push/nachrichten.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { planen, modusFuer } = require("./senden.js");

const abo = { endpoint: "https://web.push.apple.com/x", keys: { p256dh: "p", auth: "a" } };
const papa = { id: "g1", name: "Matthias", personId: "p-matthias", abo };
const mama = { id: "g2", name: "Maike", personId: "p-maike", abo, abends: false };
const aufgaben = [
  { id: "a1", titel: "Restmüll rausstellen", kategorie: "muell", personId: null, faellig: "2026-11-30" },
  { id: "a2", titel: "Zahnarzt anrufen", kategorie: "arzt", personId: "p-maike", faellig: "2026-11-30" },
  { id: "a3", titel: "Geschenk für Opa Eddy", kategorie: "geburtstag", personId: "p-matthias", faellig: "2026-11-25" },
  { id: "a4", titel: "Erledigt", kategorie: "haushalt", faellig: null }
];
const daten = { "familie.push.v1": [papa, mama], "familie.aufgaben.v1": aufgaben };

test("morgens: Sport, heute fällige und überfällige Aufgaben je Person", () => {
  const plan = planen(daten, "morgens", "2026-11-30");   // Montag
  assert.equal(plan.length, 2);
  assert.equal(plan[0].nachricht.titel, "Heute, Montag");
  assert.deepEqual(plan[0].nachricht.text.split("\n"), [
    "🎽 Benno hat Sport: Sportzeug mitgeben", "🗑️ Restmüll rausstellen", "⏰ Noch offen: Geschenk für Opa Eddy"]);
  assert.deepEqual(plan[1].nachricht.text.split("\n"), [
    "🎽 Benno hat Sport: Sportzeug mitgeben", "🗑️ Restmüll rausstellen", "🩺 Zahnarzt anrufen"]);
});

test("abends: Vorschau auf morgen, abgeschaltete Geräte bekommen nichts", () => {
  const plan = planen(daten, "abends", "2026-11-29");   // Sonntag -> Montag
  assert.equal(plan.length, 1);
  assert.equal(plan[0].geraet.id, "g1");
  assert.equal(plan[0].nachricht.titel, "Morgen, Montag");
  assert.deepEqual(plan[0].nachricht.text.split("\n"), ["🎽 Benno hat Sport: Sportzeug einpacken", "🗑️ Restmüll rausstellen"]);
});

test("nichts los: keine Nachricht", () => {
  assert.equal(planen({ "familie.push.v1": [papa] }, "abends", "2026-11-30").length, 0);   // Di: kein Sport
  assert.equal(planen({ "familie.push.v1": [papa] }, "morgens", "2026-12-28").length, 0);  // Ferien-Montag
});

test("abgehakter Hinweis kommt nicht mehr", () => {
  const d = { "familie.push.v1": [papa], "familie.heute.abgehakt": { "2026-11-30|benno-sport": true } };
  assert.equal(planen(d, "morgens", "2026-11-30").length, 0);
});

test("Test-Nachricht an alle Geräte mit Abo", () => {
  const d = { "familie.push.v1": [papa, mama, { id: "g3", name: "ohne Abo" }] };
  assert.equal(planen(d, "test", "2026-11-30").length, 2);
});

test("Versandzeiten", () => {
  assert.equal(modusFuer(5), null);
  assert.equal(modusFuer(6), "morgens");
  assert.equal(modusFuer(8), "morgens");
  assert.equal(modusFuer(12), null);
  assert.equal(modusFuer(19), "abends");
  assert.equal(modusFuer(22), null);
});
