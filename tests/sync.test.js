/*
 * Tests für gemeinsam/sync.js ohne Browser: node tests/sync.test.js
 * Simuliert einen Server und zwei Handys (Matthias, Maike).
 */
"use strict";
const assert = require("assert");
global.window = global;
require("../gemeinsam/sync.js");
const { merge, erstellen } = global.FamilieSync;

let fehler = 0;
let kette = Promise.resolve();
function test(name, fn) {
  kette = kette.then(async () => {
    try { await fn(); console.log("✓ " + name); } catch (e) { fehler++; console.log("✗ " + name + "\n  " + e.message); }
  });
}

/* ---------- Merge ---------- */

test("Objekte: verschiedene Felder geändert -> beides bleibt", () => {
  const b = { a: 1, b: 1 };
  assert.deepStrictEqual(merge(b, { a: 2, b: 1 }, { a: 1, b: 3 }), { a: 2, b: 3 });
});
test("Objekte: gelöschtes Feld wird übernommen", () => {
  const b = { abgehakt: { milch: true, brot: true } };
  const lokal = { abgehakt: { brot: true } };            // Milch wieder offen
  const remote = { abgehakt: { milch: true, brot: true, eier: true } };
  assert.deepStrictEqual(merge(b, lokal, remote), { abgehakt: { brot: true, eier: true } });
});
test("Listen mit id: beide fügen hinzu, einer ändert, einer löscht", () => {
  const b = [{ id: "1", t: "a" }, { id: "2", t: "b" }, { id: "3", t: "c" }];
  const lokal = [{ id: "1", t: "A" }, { id: "2", t: "b" }, { id: "3", t: "c" }, { id: "4", t: "neu lokal" }];
  const remote = [{ id: "1", t: "a" }, { id: "3", t: "c" }, { id: "5", t: "neu remote" }];
  assert.deepStrictEqual(merge(b, lokal, remote),
    [{ id: "1", t: "A" }, { id: "3", t: "c" }, { id: "4", t: "neu lokal" }, { id: "5", t: "neu remote" }]);
});
test("Mengen: Strings hinzufügen und entfernen", () => {
  assert.deepStrictEqual(merge(["a", "b"], ["a", "b", "c"], ["b", "d"]), ["b", "c", "d"]);
});
test("Ohne Basis (beide Geräte hatten schon Daten): Vereinigung", () => {
  assert.deepStrictEqual(merge(undefined, [{ id: "m" }], [{ id: "k" }]), [{ id: "m" }, { id: "k" }]);
});
test("Gleiches Feld beide verschieden: lokales Gerät gewinnt", () => {
  assert.deepStrictEqual(merge({ x: 1 }, { x: 2 }, { x: 3 }), { x: 2 });
});

/* ---------- Zwei Geräte mit Server ---------- */

function speicher() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    key: i => [...m.keys()][i],
    get length() { return m.size; }
  };
}
const warte = ms => new Promise(r => setTimeout(r, ms));

function server() {
  const daten = {};
  const zuhoerer = [];
  let sperre = Promise.resolve();
  return {
    daten,
    adapter(verzoegerung) {
      return {
        beobachten(fn) { zuhoerer.push(fn); },
        aktualisieren(key, fn) {
          // Transaktion: serialisiert wie bei Firestore (Wiederholung bei Konflikt)
          const lauf = sperre.then(async () => {
            await warte(verzoegerung);
            const neu = fn(daten[key] === undefined ? undefined : JSON.parse(daten[key]));
            if (neu === undefined) delete daten[key]; else daten[key] = JSON.stringify(neu);
            setTimeout(() => zuhoerer.forEach(z => z(key, neu === undefined ? undefined : JSON.parse(daten[key] || "null"))), 5);
          });
          sperre = lauf.catch(() => {});
          return lauf;
        }
      };
    }
  };
}

function geraet(srv, verzoegerung) {
  const s = speicher();
  const sync = erstellen({ speicher: s, adapter: srv.adapter(verzoegerung) });
  return {
    s, sync,
    lesen: k => JSON.parse(s.getItem(k)),
    schreiben(k, w) { s.setItem(k, JSON.stringify(w)); return sync.geaendert(k); }
  };
}

async function ruhe(...g) {
  for (let i = 0; i < 5; i++) { await warte(40); await Promise.all(g.map(x => x.sync.fertig())); }
}

const KEY = "familie.essen.v1";

test("Gleichzeitiges Abhaken auf zwei Handys geht nicht verloren", async () => {
  const srv = server();
  const matthias = geraet(srv, 10), maike = geraet(srv, 3);
  await matthias.schreiben(KEY, { einkauf: { "2026-W48": { abgehakt: {} } } });
  await ruhe(matthias, maike);
  assert.deepStrictEqual(maike.lesen(KEY), { einkauf: { "2026-W48": { abgehakt: {} } } });
  // beide haken gleichzeitig verschiedene Sachen ab
  matthias.schreiben(KEY, { einkauf: { "2026-W48": { abgehakt: { milch: true } } } });
  maike.schreiben(KEY, { einkauf: { "2026-W48": { abgehakt: { brot: true } } } });
  await ruhe(matthias, maike);
  const erwartet = { einkauf: { "2026-W48": { abgehakt: { milch: true, brot: true } } } };
  assert.deepStrictEqual(matthias.lesen(KEY), erwartet);
  assert.deepStrictEqual(maike.lesen(KEY), erwartet);
  assert.deepStrictEqual(JSON.parse(srv.daten[KEY]), erwartet);
  // Maike nimmt Milch zurück
  maike.schreiben(KEY, { einkauf: { "2026-W48": { abgehakt: { brot: true } } } });
  await ruhe(matthias, maike);
  assert.deepStrictEqual(matthias.lesen(KEY), { einkauf: { "2026-W48": { abgehakt: { brot: true } } } });
});

test("Aufgaben: beide legen gleichzeitig etwas an, einer hakt ab", async () => {
  const srv = server();
  const a = geraet(srv, 8), b = geraet(srv, 2);
  const K = "familie.aufgaben.v1";
  await a.schreiben(K, [{ id: "muell", titel: "Müll", faellig: "2026-11-27" }]);
  await ruhe(a, b);
  a.schreiben(K, [{ id: "muell", titel: "Müll", faellig: "2026-12-11" }]);
  b.schreiben(K, [{ id: "muell", titel: "Müll", faellig: "2026-11-27" }, { id: "oma", titel: "Geburtstag Oma" }]);
  await ruhe(a, b);
  const erwartet = [{ id: "muell", titel: "Müll", faellig: "2026-12-11" }, { id: "oma", titel: "Geburtstag Oma" }];
  assert.deepStrictEqual(a.lesen(K), erwartet);
  assert.deepStrictEqual(b.lesen(K), erwartet);
});

test("Neues Gerät ohne Daten bekommt alles, Gerätelokales bleibt lokal", async () => {
  const srv = server();
  const a = geraet(srv, 1);
  await a.schreiben("familie.personen", [{ id: "m", name: "Matthias" }]);
  await a.schreiben("familie.aufgaben.geraet.filter", "m");
  const b = geraet(srv, 1);
  for (const k of Object.keys(srv.daten)) b.sync.empfangen(k, JSON.parse(srv.daten[k]));
  await ruhe(a, b);
  assert.deepStrictEqual(b.lesen("familie.personen"), [{ id: "m", name: "Matthias" }]);
  assert.strictEqual(srv.daten["familie.aufgaben.geraet.filter"], undefined);
});

test("Offline geänderte Daten werden später nachgeladen", async () => {
  const srv = server();
  const ad = srv.adapter(1);
  let offline = true;
  const s = speicher();
  const sync = erstellen({ speicher: s, adapter: {
    beobachten: ad.beobachten,
    aktualisieren: (k, fn) => offline ? Promise.reject(new Error("offline")) : ad.aktualisieren(k, fn)
  } });
  s.setItem("familie.personen", JSON.stringify([{ id: "t", name: "Tilda" }]));
  await sync.geaendert("familie.personen");
  assert.strictEqual(srv.daten["familie.personen"], undefined);
  offline = false;
  await sync.allesHochladen();
  await sync.fertig();
  assert.deepStrictEqual(JSON.parse(srv.daten["familie.personen"]), [{ id: "t", name: "Tilda" }]);
});

process.on("beforeExit", () => { if (fehler) { console.log(fehler + " Test(s) fehlgeschlagen"); process.exitCode = 1; } });
