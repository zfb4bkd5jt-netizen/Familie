/*
 * Abgleich zwischen Geräten für alle Module.
 * Klassisches Script, nach gemeinsam/familie.js einbinden. Stellt `FamilieSync` bereit.
 *
 * Idee:
 * - Die Module lesen/schreiben weiter synchron über Familie.laden/speichern (localStorage).
 * - Jeder "familie.*"-Key wird als ein Dokument beim Dienst gespeichert.
 *   Ausnahme: Keys mit ".geraet." bleiben auf dem Gerät (z. B. gewählter Filter).
 * - Nichts wird blind überschrieben: Lokaler Stand, Stand vom Server und der zuletzt
 *   gemeinsame Stand ("Basis") werden per Drei-Wege-Merge zusammengeführt.
 *   Objekte feldweise, Arrays von Objekten mit "id" per id, Arrays von Strings/Zahlen
 *   als Menge. Wenn beide dasselbe Feld unterschiedlich ändern, gewinnt das Gerät,
 *   das gerade schreibt.
 * - Schreiben läuft über adapter.aktualisieren(key, fn) = atomares
 *   Lesen-Zusammenführen-Schreiben (Transaktion), damit gleichzeitiges Abhaken
 *   auf zwei Handys nicht verloren geht.
 *
 * Adapter-Schnittstelle (siehe sync-firebase.js, Test-Adapter in tests/):
 *   beobachten(fn(key, wert))      -> ruft fn für jeden Key bei Änderungen auf dem Server
 *   aktualisieren(key, fn(serverWert) -> neuerWert) -> Promise
 */
(function () {
  "use strict";

  var PRAEFIX = "familie.";
  var BASIS_KEY = "familieSync.basis";   // bewusst ohne "familie."-Präfix: nicht synchronisieren/exportieren
  var OFFEN_KEY = "familieSync.offen";

  /* ---------- Drei-Wege-Merge ---------- */

  function gleich(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function istObjekt(x) {
    return x !== null && typeof x === "object" && !Array.isArray(x);
  }

  function istPrimitiv(x) {
    return x === null || ["string", "number", "boolean"].indexOf(typeof x) >= 0;
  }

  function hatIds(arr) {
    return Array.isArray(arr) && arr.every(function (e) { return istObjekt(e) && e.id !== undefined; });
  }

  function zuMap(arr) {
    var m = {};
    (arr || []).forEach(function (e) { m[e.id] = e; });
    return m;
  }

  function mergeObjekte(basis, lokal, remote) {
    var b = istObjekt(basis) ? basis : {};
    var ergebnis = {};
    var keys = {};
    Object.keys(lokal).concat(Object.keys(remote)).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (k) {
      var w = merge(b[k], lokal[k], remote[k]);
      if (w !== undefined) ergebnis[k] = w;
    });
    return ergebnis;
  }

  function mergeIdListen(basis, lokal, remote) {
    var b = hatIds(basis) ? zuMap(basis) : {};
    var l = zuMap(lokal);
    var r = zuMap(remote);
    // Reihenfolge: wie lokal, dann neue Einträge vom Server an ihrer Stelle hinten
    var ids = lokal.map(function (e) { return e.id; });
    remote.forEach(function (e) { if (!(e.id in l)) ids.push(e.id); });
    var ergebnis = [];
    ids.forEach(function (id) {
      var w = merge(b[id], l[id], r[id]);
      if (w !== undefined) ergebnis.push(w);
    });
    return ergebnis;
  }

  function mergeMengen(basis, lokal, remote) {
    var b = Array.isArray(basis) ? basis : [];
    var drin = function (arr, x) { return arr.some(function (y) { return gleich(x, y); }); };
    var ergebnis = [];
    lokal.concat(remote).forEach(function (x) {
      if (drin(ergebnis, x)) return;
      // von einer Seite entfernt (war in der Basis, fehlt jetzt auf einer Seite)?
      if (drin(b, x) && (!drin(lokal, x) || !drin(remote, x))) return;
      ergebnis.push(x);
    });
    return ergebnis;
  }

  /* undefined = Key existiert nicht (bzw. wurde gelöscht). */
  function merge(basis, lokal, remote) {
    if (gleich(lokal, remote)) return lokal;
    if (gleich(lokal, basis)) return remote;
    if (gleich(remote, basis)) return lokal;
    // beide Seiten haben geändert
    if (lokal === undefined || remote === undefined) {
      // eine Seite hat gelöscht, die andere geändert: Änderung behalten
      return lokal === undefined ? remote : lokal;
    }
    if (istObjekt(lokal) && istObjekt(remote)) return mergeObjekte(basis, lokal, remote);
    if (hatIds(lokal) && hatIds(remote)) return mergeIdListen(basis, lokal, remote);
    if (Array.isArray(lokal) && Array.isArray(remote) && lokal.every(istPrimitiv) && remote.every(istPrimitiv)) {
      return mergeMengen(basis, lokal, remote);
    }
    return lokal;
  }

  function wirdSynchronisiert(key) {
    return typeof key === "string" && key.indexOf(PRAEFIX) === 0 && key.indexOf(".geraet.") < 0;
  }

  /* ---------- Abgleich-Instanz ---------- */

  function erstellen(optionen) {
    var speicher = optionen.speicher;      // localStorage-artig
    var adapter = optionen.adapter;
    var melden = optionen.melden || function () {};   // (key) -> UI neu zeichnen
    var statusFn = optionen.status || function () {};

    function lesen(k, fallback) {
      try { var r = speicher.getItem(k); return r === null ? fallback : JSON.parse(r); } catch (e) { return fallback; }
    }
    function schreiben(k, w) {
      if (w === undefined) speicher.removeItem(k); else speicher.setItem(k, JSON.stringify(w));
    }
    var basis = lesen(BASIS_KEY, {});
    var offen = lesen(OFFEN_KEY, {});
    function basisSetzen(k, w) {
      if (w === undefined) delete basis[k]; else basis[k] = w;
      schreiben(BASIS_KEY, basis);
    }
    function offenSetzen(k, ja) {
      if (ja) offen[k] = true; else delete offen[k];
      schreiben(OFFEN_KEY, offen);
      statusFn(Object.keys(offen).length ? "ausstehend" : "aktuell");
    }

    function lokal(k) { return lesen(k, undefined); }

    /* Lokale Änderung an den Server geben (atomar zusammenführen). */
    var laufend = {};
    function hochladen(k) {
      if (laufend[k]) { laufend[k].nochmal = true; return laufend[k].promise; }
      offenSetzen(k, true);
      var eintrag = { nochmal: false };
      var ergebnis;
      eintrag.promise = adapter.aktualisieren(k, function (serverWert) {
        ergebnis = merge(basis[k], lokal(k), serverWert);
        return ergebnis;
      }).then(function () {
        // Lokal kann sich in der Zwischenzeit erneut geändert haben: dann nachziehen.
        var jetzt = lokal(k);
        var neu = merge(basis[k], jetzt, ergebnis);
        basisSetzen(k, ergebnis);
        if (!gleich(neu, jetzt)) { schreiben(k, neu); melden(k); }
        delete laufend[k];
        if (eintrag.nochmal || !gleich(neu, ergebnis)) return hochladen(k);
        offenSetzen(k, false);
      }, function (fehler) {
        delete laufend[k];
        statusFn("fehler", fehler);   // bleibt in "offen" und wird später erneut versucht
      });
      laufend[k] = eintrag;
      return eintrag.promise;
    }

    /* Änderung vom Server übernehmen. */
    function empfangen(k, serverWert) {
      if (!wirdSynchronisiert(k)) return;
      if (laufend[k]) { laufend[k].nochmal = true; return; }  // Hochladen führt ohnehin zusammen
      var jetzt = lokal(k);
      var neu = merge(basis[k], jetzt, serverWert);
      if (!gleich(neu, jetzt)) { schreiben(k, neu); melden(k); }
      basisSetzen(k, serverWert);
      if (!gleich(neu, serverWert)) hochladen(k);
    }

    function allesHochladen() {
      var keys = Object.keys(offen);
      for (var i = 0; i < speicher.length; i++) {
        var k = speicher.key(i);
        if (wirdSynchronisiert(k) && !gleich(basis[k], lokal(k)) && keys.indexOf(k) < 0) keys.push(k);
      }
      return Promise.all(keys.map(hochladen));
    }

    var instanz = {
      geaendert: function (k) { if (wirdSynchronisiert(k)) return hochladen(k); },
      empfangen: empfangen,
      allesHochladen: allesHochladen,
      /* Für Tests: warten, bis nichts mehr läuft. */
      fertig: function () {
        var p = Object.keys(laufend).map(function (k) { return laufend[k].promise; });
        return Promise.all(p).then(function () { return Object.keys(laufend).length ? instanz.fertig() : undefined; });
      }
    };
    adapter.beobachten(empfangen);
    return instanz;
  }

  /* ---------- Einrichtung im Browser ---------- */

  var KONFIG_KEY = "familieSync.konfig";   // { familienCode }

  function konfig() {
    try { return JSON.parse(localStorage.getItem(KONFIG_KEY)) || null; } catch (e) { return null; }
  }
  function konfigSpeichern(k) {
    if (k) localStorage.setItem(KONFIG_KEY, JSON.stringify(k)); else localStorage.removeItem(KONFIG_KEY);
  }

  /* Langer Zufallscode: wer ihn kennt, kann die Familiendaten lesen und ändern. */
  function neuerCode() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }

  /* Familien-Code aus einem Einladungslink "...#familie=CODE" übernehmen. */
  function einladungPruefen() {
    var m = location.hash.match(/familie=([0-9a-f]{32})/);
    if (!m) return false;
    konfigSpeichern({ familienCode: m[1] });
    history.replaceState(null, "", location.pathname + location.search);
    return true;
  }

  function einladungsLink() {
    var k = konfig();
    if (!k) return null;
    var basisUrl = location.href.replace(/[#?].*$/, "").replace(/(gemeinsam|aufgaben|essen|kalender)\/[^/]*$/, "");
    return basisUrl + "#familie=" + k.familienCode;
  }

  var statusText = "aus";
  function statusMelden(s) {
    statusText = s;
    window.dispatchEvent(new CustomEvent("familie:sync-status", { detail: { status: s } }));
  }

  function starten() {
    einladungPruefen();
    var k = konfig();
    if (!k || !window.FamilieSyncAdapter) { statusMelden("aus"); return null; }
    var adapter = window.FamilieSyncAdapter(k.familienCode);
    if (!adapter) { statusMelden("aus"); return null; }
    var instanz = erstellen({
      speicher: localStorage,
      adapter: adapter,
      status: statusMelden,
      melden: function (key) {
        window.dispatchEvent(new CustomEvent("familie:aktualisiert", { detail: { key: key } }));
      }
    });
    FamilieSync.aktiv = instanz;
    statusMelden("aktuell");
    instanz.allesHochladen();
    window.addEventListener("online", function () { instanz.allesHochladen(); });
    setInterval(function () { instanz.allesHochladen(); }, 60000);
    return instanz;
  }

  window.FamilieSync = {
    merge: merge,
    wirdSynchronisiert: wirdSynchronisiert,
    erstellen: erstellen,
    konfig: konfig,
    konfigSpeichern: konfigSpeichern,
    neuerCode: neuerCode,
    einladungsLink: einladungsLink,
    status: function () { return statusText; },
    starten: starten,
    aktiv: null
  };

  // Automatisch starten. Reihenfolge der Scripts: familie.js, sync-firebase.js, sync.js, dann Modul-Scripts.
  if (typeof document !== "undefined") starten();
})();
