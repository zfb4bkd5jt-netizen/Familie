/*
 * Inhalt der Push-Benachrichtigungen: reine Logik ohne DOM.
 * Klassisches Script, braucht familie.js, aufgaben-daten.js und heute-logik.js.
 * Stellt global `PushNachrichten` bereit. Läuft im Browser und auf dem Server (push/senden.js).
 *
 * Modi:
 *   morgens: was heute ansteht (Hinweise wie Sport, überfällige und heute fällige Aufgaben)
 *   abends:  Vorschau auf morgen (Sportzeug einpacken, morgen fällige Aufgaben)
 *
 * Gerät: { id, personId, morgens, abends } aus "familie.push.v1".
 * Aufgaben mit personId gehen nur an Geräte dieser Person (oder ohne Person). Aufgaben ohne personId an alle.
 */
(function (global) {
  "use strict";

  var KEY = "familie.push.v1";
  // Öffentlicher VAPID-Schlüssel (kein Geheimnis). Der private Teil liegt nur als GitHub-Secret VAPID_PRIVATE_KEY vor.
  var VAPID_PUBLIC = "BDFEDPwweC2l1bk7zN5iaYAb-kri6-n4tP13PXQr2MbTUx-vGVdqlAETwMSwp-UPfj7bjV8Ko0aMhBAdktyT328";
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function plusTage(iso, n) {
    var d = Familie.ausIso(iso);
    d.setDate(d.getDate() + n);
    return Familie.isoDatum(d);
  }

  function fuerGeraet(a, geraet) {
    return !a.personId || !geraet || !geraet.personId || a.personId === geraet.personId;
  }

  function symbol(a) {
    return (Aufgaben.KATEGORIEN[a.kategorie] || { symbol: "📌" }).symbol;
  }

  /* Nachricht für ein Gerät, oder null, wenn nichts ansteht.
     -> { titel, text, url, tag } */
  function bauen(modus, heuteIso, geraet) {
    var zeilen = [];
    var tag = modus === "abends" ? plusTage(heuteIso, 1) : heuteIso;
    var abgehakt = Familie.laden("familie.heute.abgehakt", {}) || {};

    HeuteLogik.hinweise(tag).forEach(function (h) {
      if (abgehakt[tag + "|" + h.id]) return;
      zeilen.push(h.symbol + " " + (modus === "abends" ? h.text.replace(/mitgeben$/, "einpacken") : h.text));
    });

    var offen = Aufgaben.alle().filter(function (a) { return a.faellig && fuerGeraet(a, geraet); });
    if (modus === "abends") {
      offen.filter(function (a) { return a.faellig === tag; }).forEach(function (a) {
        zeilen.push(symbol(a) + " " + a.titel);
      });
    } else {
      var heute = offen.filter(function (a) { return a.faellig === tag; });
      var ueber = offen.filter(function (a) { return a.faellig < tag; });
      heute.forEach(function (a) { zeilen.push(symbol(a) + " " + a.titel); });
      if (ueber.length === 1) zeilen.push("⏰ Noch offen: " + ueber[0].titel);
      else if (ueber.length > 1) zeilen.push("⏰ " + ueber.length + " Aufgaben noch offen");
    }

    if (!zeilen.length) return null;
    var d = Familie.ausIso(tag);
    return {
      titel: (modus === "abends" ? "Morgen, " : "Heute, ") + TAGE[d.getDay()],
      text: zeilen.join("\n"),
      url: "./",
      tag: "familie-" + modus
    };
  }

  function geraete() {
    var g = Familie.laden(KEY, []);
    return Array.isArray(g) ? g : [];
  }

  global.PushNachrichten = { KEY: KEY, VAPID_PUBLIC: VAPID_PUBLIC, bauen: bauen, geraete: geraete, plusTage: plusTage };
})(typeof window !== "undefined" ? window : globalThis);
