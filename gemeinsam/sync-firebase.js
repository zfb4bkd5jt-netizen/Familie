/*
 * Firebase-Firestore-Anbindung für gemeinsam/sync.js.
 * Lädt das Firebase-SDK nur, wenn ein Familien-Code eingerichtet ist.
 *
 * Datenablage: familien/{familienCode}/daten/{key} = { json: "<JSON-Text>", geaendert, geraet }
 * (als Text, weil Firestore keine verschachtelten Arrays speichern kann).
 */
(function () {
  "use strict";

  // Öffentliche Web-Konfiguration aus der Firebase-Konsole (kein Geheimnis).
  var FIREBASE_KONFIG = null; // wird eingetragen, sobald das Firebase-Projekt existiert

  var SDK = "https://www.gstatic.com/firebasejs/10.14.1/";

  function scriptLaden(url) {
    return new Promise(function (ok, fehler) {
      var s = document.createElement("script");
      s.src = url; s.onload = ok; s.onerror = function () { fehler(new Error("Konnte " + url + " nicht laden")); };
      document.head.appendChild(s);
    });
  }

  var geraet = (function () {
    var k = "familieSync.geraet";
    var g = localStorage.getItem(k);
    if (!g) { g = Math.random().toString(36).slice(2, 10); localStorage.setItem(k, g); }
    return g;
  })();

  window.FamilieSyncAdapter = function (familienCode) {
    if (!FIREBASE_KONFIG) return null;

    var bereit = scriptLaden(SDK + "firebase-app-compat.js")
      .then(function () { return scriptLaden(SDK + "firebase-firestore-compat.js"); })
      .then(function () {
        var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_KONFIG);
        return app.firestore();
      });

    function sammlung(db) {
      return db.collection("familien").doc(familienCode).collection("daten");
    }
    function lesen(snap) {
      if (!snap.exists) return undefined;
      try { return JSON.parse(snap.data().json); } catch (e) { return undefined; }
    }

    return {
      beobachten: function (fn) {
        bereit.then(function (db) {
          sammlung(db).onSnapshot(function (snap) {
            snap.docChanges().forEach(function (c) {
              if (c.doc.metadata.hasPendingWrites) return;
              fn(c.doc.id, c.type === "removed" ? undefined : lesen(c.doc));
            });
          }, function (e) {
            window.dispatchEvent(new CustomEvent("familie:sync-status", { detail: { status: "fehler", fehler: e } }));
          });
        });
      },
      aktualisieren: function (key, fn) {
        return bereit.then(function (db) {
          var ref = sammlung(db).doc(key);
          return db.runTransaction(function (t) {
            return t.get(ref).then(function (snap) {
              var neu = fn(lesen(snap));
              if (neu === undefined) t.delete(ref);
              else t.set(ref, { json: JSON.stringify(neu), geaendert: Date.now(), geraet: geraet });
            });
          });
        });
      }
    };
  };
})();
