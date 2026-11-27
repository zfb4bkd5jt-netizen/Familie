/*
 * Gemeinsame Basis für alle Familien-Module (Aufgaben, Essen, Kalender).
 * Klassisches Script, stellt das globale Objekt `Familie` bereit.
 *
 * Daten liegen im Browser (localStorage). Alle Schlüssel beginnen mit "familie.",
 * damit Export/Import alles auf einmal sichern kann. Ist der Abgleich eingerichtet
 * (gemeinsam/sync.js), werden sie mit den anderen Familien-Handys zusammengeführt.
 * Keys mit ".geraet." bleiben nur auf diesem Gerät.
 */
(function () {
  "use strict";

  var PRAEFIX = "familie.";
  var PERSONEN_KEY = "familie.personen";
  var FARBEN = ["#e07a5f", "#3d85c6", "#81b29a", "#f2cc8f", "#9b72cf", "#e5989b"];

  function laden(key, fallback) {
    try {
      var roh = localStorage.getItem(key);
      return roh === null ? fallback : JSON.parse(roh);
    } catch (e) {
      return fallback;
    }
  }

  /* Speichert lokal und gibt die Änderung an den Abgleich weiter (falls eingerichtet). */
  function speichern(key, wert) {
    localStorage.setItem(key, JSON.stringify(wert));
    if (window.FamilieSync && window.FamilieSync.aktiv) window.FamilieSync.aktiv.geaendert(key);
  }

  function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function personen() {
    return laden(PERSONEN_KEY, []);
  }

  function personenSpeichern(liste) {
    speichern(PERSONEN_KEY, liste);
  }

  function person(pid) {
    return personen().find(function (p) { return p.id === pid; }) || null;
  }

  function personHinzufuegen(name) {
    var liste = personen();
    var p = { id: id(), name: name, farbe: FARBEN[liste.length % FARBEN.length] };
    liste.push(p);
    personenSpeichern(liste);
    return p;
  }

  function personEntfernen(pid) {
    personenSpeichern(personen().filter(function (p) { return p.id !== pid; }));
  }

  /* Datum -> "2026-11-30" (lokale Zeit, nicht UTC). */
  function isoDatum(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var t = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + t;
  }

  /* "2026-11-30" -> Date um 00:00 lokaler Zeit. */
  function ausIso(s) {
    var teile = s.split("-").map(Number);
    return new Date(teile[0], teile[1] - 1, teile[2]);
  }

  function heute() {
    return isoDatum(new Date());
  }

  /* Alle familie.*-Daten als Objekt (für Export). */
  function exportieren() {
    var daten = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      // Anmelde-Token gehören nicht in eine Sicherung
      if (k.indexOf(PRAEFIX) === 0 && k.indexOf(".geraet.token") < 0) daten[k] = laden(k, null);
    }
    return { format: "familie-export", version: 1, erstellt: new Date().toISOString(), daten: daten };
  }

  /* Überschreibt die enthaltenen Schlüssel. Andere bleiben unberührt. */
  function importieren(obj) {
    if (!obj || obj.format !== "familie-export" || typeof obj.daten !== "object") {
      throw new Error("Das ist keine gültige Familie-Sicherung.");
    }
    Object.keys(obj.daten).forEach(function (k) {
      if (k.indexOf(PRAEFIX) === 0) speichern(k, obj.daten[k]);
    });
  }

  function exportHerunterladen() {
    var blob = new Blob([JSON.stringify(exportieren(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "familie-sicherung-" + heute() + ".json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  window.Familie = {
    laden: laden,
    speichern: speichern,
    id: id,
    personen: personen,
    personenSpeichern: personenSpeichern,
    person: person,
    personHinzufuegen: personHinzufuegen,
    personEntfernen: personEntfernen,
    isoDatum: isoDatum,
    ausIso: ausIso,
    heute: heute,
    exportieren: exportieren,
    importieren: importieren,
    exportHerunterladen: exportHerunterladen
  };
})();
