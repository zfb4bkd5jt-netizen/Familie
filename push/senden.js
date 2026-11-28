#!/usr/bin/env node
/*
 * Verschickt die Push-Benachrichtigungen an alle eingeschalteten Handys der Familie.
 * Läuft per GitHub Actions (.github/workflows/push.yml), braucht keinen eigenen Server.
 *
 *   node push/senden.js [auto|morgens|abends|test]
 *
 * Umgebung:
 *   FAMILIE_CODE       Familien-Code (32 Zeichen, steht im Einladungslink hinter #familie=)
 *   VAPID_PRIVATE_KEY  privater VAPID-Schlüssel (GitHub-Secret)
 *   TROCKEN=1          nur anzeigen, nichts senden oder speichern
 *
 * auto: morgens zwischen 6 und 9 Uhr, abends zwischen 19 und 22 Uhr (deutsche Zeit),
 * jeweils nur einmal am Tag (gemerkt im Dokument "push.status").
 */
"use strict";
process.env.TZ = "Europe/Berlin";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJEKT = "familie-d3360";
const API_KEY = "AIzaSyDnrP2rEBQZv85L4EM7Sv0JpKV09ijSSBo";
const STATUS_DOC = "push.status";    // ohne "familie."-Präfix: die App gleicht es nicht ab
const SUBJECT = "https://zfb4bkd5jt-netizen.github.io/Familie/";

/* ---------- App-Logik in einer Sandbox mit den Familiendaten laden ---------- */

function umgebung(daten) {
  const speicher = {};
  Object.keys(daten).forEach((k) => { speicher[k] = JSON.stringify(daten[k]); });
  const localStorage = {
    getItem: (k) => (k in speicher ? speicher[k] : null),
    setItem: (k, v) => { speicher[k] = String(v); },
    removeItem: (k) => { delete speicher[k]; },
    key: (i) => Object.keys(speicher)[i],
    get length() { return Object.keys(speicher).length; }
  };
  const ctx = { localStorage, Date, Math, JSON, String, Number, Array, Object, RegExp, parseInt, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["gemeinsam/familie.js", "aufgaben/aufgaben-daten.js", "heute/heute-logik.js", "bringen/logik.js", "push/nachrichten.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx, { filename: f });
  }
  return ctx;
}

/* Welche Nachricht geht an welches Gerät? -> [{ geraet, nachricht }] */
function planen(daten, modus, heuteIso) {
  const ctx = umgebung(daten);
  const P = ctx.PushNachrichten;
  return P.geraete().filter((g) => g.abo && g.abo.endpoint).map((g) => {
    let n;
    if (modus === "test") n = { titel: "Familie", text: "🔔 Test: Benachrichtigungen kommen an.", url: "./", tag: "familie-test" };
    else if (g[modus] === false) n = null;
    else n = P.bauen(modus, heuteIso, g);
    return n ? { geraet: g, nachricht: n } : null;
  }).filter(Boolean);
}

function modusFuer(stunde) {
  if (stunde >= 6 && stunde < 9) return "morgens";
  if (stunde >= 19 && stunde < 22) return "abends";
  return null;
}

/* ---------- Firestore (REST, wie der Siri-Kurzbefehl) ---------- */

function basis(code) {
  return "https://firestore.googleapis.com/v1/projects/" + PROJEKT + "/databases/(default)/documents/familien/" + code + "/daten";
}

async function allesLesen(code) {
  const daten = {}, zeiten = {};
  let token = "";
  do {
    const r = await fetch(basis(code) + "?pageSize=300&key=" + API_KEY + (token ? "&pageToken=" + encodeURIComponent(token) : ""));
    if (!r.ok) throw new Error("Firestore lesen: " + r.status + " " + (await r.text()));
    const j = await r.json();
    (j.documents || []).forEach((d) => {
      const id = decodeURIComponent(d.name.split("/").pop());
      zeiten[id] = d.updateTime;
      try { daten[id] = JSON.parse(d.fields.json.stringValue); } catch (e) { /* kein JSON-Dokument */ }
    });
    token = j.nextPageToken || "";
  } while (token);
  return { daten, zeiten };
}

async function schreiben(code, id, wert, updateTime) {
  const bedingung = updateTime ? "currentDocument.updateTime=" + encodeURIComponent(updateTime) : "currentDocument.exists=false";
  const r = await fetch(basis(code) + "/" + encodeURIComponent(id) + "?key=" + API_KEY + "&" + bedingung, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: {
      json: { stringValue: JSON.stringify(wert) },
      geaendert: { integerValue: String(Date.now()) },
      geraet: { stringValue: "push-versand" }
    } })
  });
  if (!r.ok) throw Object.assign(new Error("Firestore schreiben " + id + ": " + r.status + " " + (await r.text())), { status: r.status });
}

/* Abgelaufene Abos entfernen (Handy hat Benachrichtigungen aus- oder die App gelöscht). */
async function geraeteEntfernen(code, ids) {
  for (let versuch = 0; versuch < 3; versuch++) {
    const { daten, zeiten } = await allesLesen(code);
    const liste = daten["familie.push.v1"] || [];
    const neu = liste.filter((g) => ids.indexOf(g.id) < 0);
    if (neu.length === liste.length) return;
    try { await schreiben(code, "familie.push.v1", neu, zeiten["familie.push.v1"]); return; }
    catch (e) { if (e.status !== 400 && e.status !== 409 && e.status !== 412) throw e; }
  }
}

/* ---------- Ablauf ---------- */

async function main() {
  const code = process.env.FAMILIE_CODE || "";
  const trocken = !!process.env.TROCKEN;
  if (!/^[0-9a-f]{32}$/.test(code)) throw new Error("FAMILIE_CODE fehlt oder ist ungültig (32 Zeichen 0-9a-f).");

  const jetzt = new Date();
  const heuteIso = jetzt.getFullYear() + "-" + String(jetzt.getMonth() + 1).padStart(2, "0") + "-" + String(jetzt.getDate()).padStart(2, "0");
  let modus = process.argv[2] || "auto";
  const { daten, zeiten } = await allesLesen(code);
  const status = daten[STATUS_DOC] || {};

  if (modus === "auto") {
    modus = modusFuer(jetzt.getHours());
    if (!modus) { console.log("Gerade keine Versandzeit (" + jetzt.toTimeString().slice(0, 5) + ")."); return; }
    if (status[modus] === heuteIso) { console.log(modus + " wurde heute schon verschickt."); return; }
  }

  const plan = planen(daten, modus, heuteIso);
  console.log(modus + " " + heuteIso + ": " + plan.length + " Nachricht(en) für " + (daten["familie.push.v1"] || []).length + " Gerät(e).");
  plan.forEach((p) => console.log("- " + (p.geraet.name || p.geraet.id) + ": " + p.nachricht.titel + " | " + p.nachricht.text.replace(/\n/g, " / ")));
  if (trocken) return;

  const webpush = require("web-push");
  const oeffentlich = umgebung({}).PushNachrichten.VAPID_PUBLIC;
  const privat = process.env.VAPID_PRIVATE_KEY;
  if (!privat) throw new Error("VAPID_PRIVATE_KEY fehlt.");
  webpush.setVapidDetails(SUBJECT, oeffentlich, privat);

  const weg = [];
  let fehler = 0;
  for (const p of plan) {
    try {
      await webpush.sendNotification(p.geraet.abo, JSON.stringify(p.nachricht), { TTL: 4 * 3600 });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) weg.push(p.geraet.id);
      else { fehler++; console.error("Senden an " + (p.geraet.name || p.geraet.id) + " fehlgeschlagen: " + (e.statusCode || "") + " " + (e.body || e.message)); }
    }
  }
  if (weg.length) { console.log(weg.length + " abgelaufene(s) Gerät(e) entfernt."); await geraeteEntfernen(code, weg); }

  if (modus === "morgens" || modus === "abends") {
    status[modus] = heuteIso;
    await schreiben(code, STATUS_DOC, status, zeiten[STATUS_DOC]).catch((e) => console.error(e.message));
  }
  if (fehler) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { main, planen, modusFuer, umgebung };
