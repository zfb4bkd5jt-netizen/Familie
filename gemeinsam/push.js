/*
 * Push-Benachrichtigungen auf diesem Gerät ein- und ausschalten.
 * Klassisches Script, braucht familie.js (und für den Abgleich sync.js) sowie push/nachrichten.js.
 * Stellt global `FamiliePush` bereit.
 *
 * Ablauf: Service Worker (sw.js im Hauptordner) registrieren, Erlaubnis holen, Web-Push-Abo
 * anlegen und als Gerät in "familie.push.v1" speichern. Der Abgleich bringt es nach Firestore,
 * von dort verschickt push/senden.js (GitHub Actions) morgens und abends die Nachrichten.
 * Auf dem iPhone geht das nur, wenn die App über „Zum Home-Bildschirm“ geöffnet ist (ab iOS 16.4).
 */
(function () {
  "use strict";

  var ID_KEY = "familie.push.geraet.id";   // ".geraet.": bleibt auf diesem Handy
  var SW = (document.currentScript && document.currentScript.src || "").replace(/gemeinsam\/push\.js.*$/, "sw.js");

  function geraetId() {
    var id = localStorage.getItem(ID_KEY);
    if (!id) { id = "g" + Familie.id(); localStorage.setItem(ID_KEY, id); }
    return id;
  }

  function istIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function homeBildschirm() {
    return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  }
  function unterstuetzt() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }
  function erlaubnis() {
    return "Notification" in window ? Notification.permission : "nicht-da";
  }

  function geraete() { return PushNachrichten.geraete(); }
  function eintrag() {
    var id = geraetId();
    return geraete().find(function (g) { return g.id === id; }) || null;
  }
  function speichern(liste) { Familie.speichern(PushNachrichten.KEY, liste); }

  function eintragSetzen(felder) {
    var id = geraetId();
    var liste = geraete();
    var g = liste.find(function (x) { return x.id === id; });
    if (!g) { g = { id: id, seit: Familie.heute(), morgens: true, abends: true }; liste.push(g); }
    Object.keys(felder).forEach(function (k) { g[k] = felder[k]; });
    var p = g.personId ? Familie.person(g.personId) : null;
    g.name = (p ? p.name : "Familie") + " (" + (istIos() ? "iPhone/iPad" : /Android/.test(navigator.userAgent) ? "Android" : "Browser") + ")";
    speichern(liste);
    return g;
  }

  function entfernen(id) {
    speichern(geraete().filter(function (g) { return g.id !== id; }));
  }

  function schluessel(base64) {
    var pad = "=".repeat((4 - base64.length % 4) % 4);
    var roh = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    var a = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) a[i] = roh.charCodeAt(i);
    return a;
  }

  function registrierung() {
    return navigator.serviceWorker.register(SW).then(function () { return navigator.serviceWorker.ready; });
  }

  function aboJson(abo) {
    var j = abo.toJSON();
    return { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } };
  }

  /* Muss direkt aus einem Tipp heraus aufgerufen werden (iPhone). */
  function einschalten(einstellungen) {
    if (!unterstuetzt()) return Promise.reject(new Error("Dieser Browser kann keine Benachrichtigungen empfangen."));
    return Notification.requestPermission().then(function (e) {
      if (e !== "granted") throw new Error("Benachrichtigungen wurden nicht erlaubt.");
      return registrierung();
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (abo) {
        return abo || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluessel(PushNachrichten.VAPID_PUBLIC) });
      });
    }).then(function (abo) {
      return eintragSetzen(Object.assign({}, einstellungen || {}, { abo: aboJson(abo) }));
    });
  }

  function ausschalten() {
    var fertig = function () { entfernen(geraetId()); };
    if (!unterstuetzt()) { fertig(); return Promise.resolve(); }
    return navigator.serviceWorker.getRegistration(SW).then(function (reg) {
      return reg && reg.pushManager.getSubscription();
    }).then(function (abo) { return abo && abo.unsubscribe(); }).catch(function () {}).then(fertig);
  }

  /* Beim Öffnen: Hat sich das Abo geändert (passiert gelegentlich), Eintrag nachziehen. */
  function pruefen() {
    var g = eintrag();
    if (!g || !unterstuetzt() || erlaubnis() !== "granted") return Promise.resolve(g);
    return registrierung().then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (abo) {
      if (!abo) return g;
      var j = aboJson(abo);
      if (!g.abo || g.abo.endpoint !== j.endpoint) return eintragSetzen({ abo: j });
      return g;
    }).catch(function () { return g; });
  }

  /* Probe-Benachrichtigung direkt auf diesem Gerät (ohne Server). */
  function probe() {
    return registrierung().then(function (reg) {
      return reg.showNotification("Familie", { body: "🔔 So sehen die Erinnerungen aus.", icon: SW.replace(/sw\.js$/, "gemeinsam/icons/icon-192.png"), tag: "familie-probe" });
    });
  }

  window.FamiliePush = {
    geraetId: geraetId, istIos: istIos, homeBildschirm: homeBildschirm, unterstuetzt: unterstuetzt,
    erlaubnis: erlaubnis, geraete: geraete, eintrag: eintrag, eintragSetzen: eintragSetzen, entfernen: entfernen,
    einschalten: einschalten, ausschalten: ausschalten, pruefen: pruefen, probe: probe
  };
})();
