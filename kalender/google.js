/*
 * Google Kalender lesen (nur Lesezugriff), direkt im Browser.
 * Klassisches Script, stellt global `GoogleKalender` bereit.
 *
 * Anmeldung über Google Identity Services (Token-Client). Jede Person meldet sich
 * auf ihrem eigenen Handy mit ihrem Google-Konto an und sieht ihre eigenen Kalender
 * plus die mit ihr geteilten. Token und Auswahl bleiben auf dem Gerät (".geraet.").
 */
(function () {
  "use strict";

  // OAuth-Client-ID (Typ "Webanwendung") aus der Google Cloud Console des Projekts familie-d3360.
  // Kein Geheimnis (das Client-Secret wird nicht gebraucht).
  var CLIENT_ID = window.FAMILIE_GOOGLE_CLIENT_ID || "648806762840-96hbuurn967lekf8r62nr4ioog35teng.apps.googleusercontent.com";
  var SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
  var API = "https://www.googleapis.com/calendar/v3";

  var TOKEN_KEY = "familie.kalender.geraet.token";
  var AUSWAHL_KEY = "familie.kalender.geraet.auswahl";   // { kalenderId: true }
  var ABFALL_KEY = "familie.kalender.geraet.abfall";     // kalenderId oder ""
  var LISTE_KEY = "familie.kalender.geraet.liste";       // zuletzt geladene Kalenderliste

  function eingerichtet() { return !!CLIENT_ID; }

  var gisBereit = null;
  function gisLaden() {
    if (gisBereit) return gisBereit;
    gisBereit = new Promise(function (ok, fehler) {
      var s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = ok;
      s.onerror = function () { gisBereit = null; fehler(new Error("Google-Anmeldung konnte nicht geladen werden.")); };
      document.head.appendChild(s);
    });
    return gisBereit;
  }

  function token() {
    var t = Familie.laden(TOKEN_KEY, null);
    return t && t.ablauf > Date.now() + 60000 ? t.token : null;
  }

  function angemeldet() { return !!token(); }
  function warAngemeldet() { return !!Familie.laden(TOKEN_KEY, null); }

  /* Muss aus einem Klick heraus aufgerufen werden (Popup). */
  function anmelden() {
    if (!eingerichtet()) return Promise.reject(new Error("Google-Anmeldung ist noch nicht eingerichtet."));
    return gisLaden().then(function () {
      return new Promise(function (ok, fehler) {
        var client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          prompt: warAngemeldet() ? "" : "consent",
          callback: function (antwort) {
            if (antwort.error) { fehler(new Error(antwort.error_description || antwort.error)); return; }
            Familie.speichern(TOKEN_KEY, { token: antwort.access_token, ablauf: Date.now() + antwort.expires_in * 1000 });
            ok();
          },
          error_callback: function (e) { fehler(new Error(e && e.type === "popup_closed" ? "Anmeldung abgebrochen." : "Anmeldung fehlgeschlagen.")); }
        });
        client.requestAccessToken();
      });
    });
  }

  function abmelden() {
    var t = token();
    if (t && window.google && google.accounts) google.accounts.oauth2.revoke(t, function () {});
    [TOKEN_KEY, LISTE_KEY].forEach(function (k) { localStorage.removeItem(k); });
  }

  function api(pfad, parameter) {
    var t = token();
    if (!t) return Promise.reject(Object.assign(new Error("Bitte neu bei Google anmelden."), { abgelaufen: true }));
    var url = API + pfad + "?" + new URLSearchParams(parameter || {}).toString();
    return fetch(url, { headers: { Authorization: "Bearer " + t } }).then(function (r) {
      if (r.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        throw Object.assign(new Error("Bitte neu bei Google anmelden."), { abgelaufen: true });
      }
      if (!r.ok) throw new Error("Google Kalender antwortet mit Fehler " + r.status);
      return r.json();
    });
  }

  /* Liste der Kalender. Beim ersten Mal sind alle ausgewählt, der Abfallkalender wird erraten. */
  function kalenderLaden() {
    return api("/users/me/calendarList", { maxResults: 250 }).then(function (d) {
      var liste = (d.items || []).map(function (k) {
        return { id: k.id, name: k.summaryOverride || k.summary, farbe: k.backgroundColor || "#888", primaer: !!k.primary };
      });
      Familie.speichern(LISTE_KEY, liste);
      var auswahl = Familie.laden(AUSWAHL_KEY, null);
      if (!auswahl) {
        auswahl = {};
        liste.forEach(function (k) { auswahl[k.id] = true; });
        Familie.speichern(AUSWAHL_KEY, auswahl);
      }
      if (Familie.laden(ABFALL_KEY, null) === null) {
        var abfall = liste.find(function (k) { return /abfall|müll|muell/i.test(k.name); });
        Familie.speichern(ABFALL_KEY, abfall ? abfall.id : "");
      }
      return liste;
    });
  }

  function kalenderListe() { return Familie.laden(LISTE_KEY, []); }
  function auswahl() { return Familie.laden(AUSWAHL_KEY, {}); }
  function auswahlSetzen(id, an) { var a = auswahl(); a[id] = an; Familie.speichern(AUSWAHL_KEY, a); }
  function abfallKalender() { return Familie.laden(ABFALL_KEY, "") || ""; }
  function abfallSetzen(id) { Familie.speichern(ABFALL_KEY, id || ""); }

  function plusTage(iso, n) {
    var d = Familie.ausIso(iso);
    return Familie.isoDatum(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  }

  /* Google-Event -> ein Eintrag pro Tag (mehrtägige Termine werden aufgeteilt). */
  function eintraege(ev, kal, vonIso, bisIso) {
    var ganztags = !!(ev.start && ev.start.date);
    var beginn, ende, uhrzeit = null;
    if (ganztags) {
      beginn = ev.start.date;
      ende = plusTage(ev.end && ev.end.date ? ev.end.date : beginn, -1); // Ende ist exklusiv
    } else {
      var s = new Date(ev.start.dateTime), e = new Date(ev.end ? ev.end.dateTime : ev.start.dateTime);
      beginn = Familie.isoDatum(s);
      // endet genau um Mitternacht -> zählt nicht mehr für den nächsten Tag
      ende = Familie.isoDatum(new Date(e.getTime() - 1));
      if (ende < beginn) ende = beginn;
      uhrzeit = String(s.getHours()).padStart(2, "0") + ":" + String(s.getMinutes()).padStart(2, "0");
    }
    var liste = [];
    for (var d = beginn, n = 0; d <= ende && n < 60; d = plusTage(d, 1), n++) {
      if (d < vonIso || d > bisIso) continue;
      liste.push({
        id: ev.id, titel: ev.summary || "(ohne Titel)", datum: d,
        uhrzeit: d === beginn ? uhrzeit : null, ganztags: ganztags || d !== beginn,
        ort: ev.location || "", kalenderId: kal.id, kalenderName: kal.name, farbe: kal.farbe, modul: "google"
      });
    }
    return liste;
  }

  /* Termine aller gewählten Kalender im Zeitraum (inklusive). */
  function termine(vonIso, bisIso, nurKalender) {
    var gewaehlt = auswahl();
    var kals = kalenderListe().filter(function (k) { return nurKalender ? nurKalender.indexOf(k.id) >= 0 : gewaehlt[k.id]; });
    var timeMin = Familie.ausIso(vonIso).toISOString();
    var timeMax = Familie.ausIso(plusTage(bisIso, 1)).toISOString();
    return Promise.all(kals.map(function (k) {
      return api("/calendars/" + encodeURIComponent(k.id) + "/events", {
        timeMin: timeMin, timeMax: timeMax, singleEvents: "true", orderBy: "startTime", maxResults: 250
      }).then(function (d) {
        return (d.items || []).filter(function (ev) { return ev.status !== "cancelled"; })
          .reduce(function (acc, ev) { return acc.concat(eintraege(ev, k, vonIso, bisIso)); }, []);
      });
    })).then(function (listen) { return [].concat.apply([], listen); });
  }

  window.GoogleKalender = {
    eingerichtet: eingerichtet,
    angemeldet: angemeldet,
    warAngemeldet: warAngemeldet,
    anmelden: anmelden,
    abmelden: abmelden,
    kalenderLaden: kalenderLaden,
    kalenderListe: kalenderListe,
    auswahl: auswahl,
    auswahlSetzen: auswahlSetzen,
    abfallKalender: abfallKalender,
    abfallSetzen: abfallSetzen,
    termine: termine,
    eintraege: eintraege,
    plusTage: plusTage
  };
})();
