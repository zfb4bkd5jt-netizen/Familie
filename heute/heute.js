/*
 * Heute-Ansicht auf der Startseite: Hinweise (z. B. Sport), Termine aus Google,
 * fällige Aufgaben und das Essen des Tages auf einen Blick.
 * Braucht familie.js, aufgaben-daten.js, kalender/google.js und heute-logik.js.
 * Optional bringen/logik.js + bringen-daten.js für den Bring-Plan.
 */
(function () {
  "use strict";

  var ESSEN_KEY = "familie.essen.v1";
  var ABGEHAKT_KEY = "familie.heute.abgehakt";             // { "2026-11-30|benno-sport": true }, synchronisiert
  var CACHE_KEY = "familie.heute.geraet.termine";          // { datum, termine } für offline
  var WOCHEN_CACHE_KEY = "familie.kalender.geraet.cache";  // von der Seite "Woche"
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  var L = window.HeuteLogik;
  var G = window.GoogleKalender;
  var box = document.getElementById("heute");
  var googleTermine = [];
  var googleStand = "aus";   // aus | laedt | ok | fehler

  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kinder || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  function zeile(symbol, inhalt, extra, klasse, knopf) {
    return el("li", { class: "h-zeile " + (klasse || "") }, [
      el("span", { class: "h-symbol" }, [symbol]),
      el("span", { class: "h-was" }, [inhalt].concat(extra || [])),
      knopf || null
    ]);
  }

  function haken(label, aktion) {
    return el("button", { class: "h-haken", "aria-label": label, title: "Erledigt", text: "✓", onclick: aktion });
  }

  function jetztHHMM() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* ---------- Google-Termine ---------- */

  function termineAusCache(heute) {
    var c = Familie.laden(CACHE_KEY, null);
    if (c && c.datum === heute) return c.termine;
    var w = Familie.laden(WOCHEN_CACHE_KEY, null);
    if (w && w.von <= heute && w.bis >= heute) return w.termine.filter(function (t) { return t.datum === heute; });
    return [];
  }

  function googleLaden() {
    var heute = Familie.heute();
    googleTermine = termineAusCache(heute);
    if (!G || !G.eingerichtet() || !G.angemeldet()) { googleStand = "aus"; zeichnen(); return; }
    googleStand = "laedt";
    zeichnen();
    var listeDa = G.kalenderListe().length ? Promise.resolve() : G.kalenderLaden();
    listeDa.then(function () { return G.termine(heute, heute); }).then(function (t) {
      googleTermine = t;
      googleStand = "ok";
      Familie.speichern(CACHE_KEY, { datum: heute, termine: t });
      zeichnen();
    }).catch(function () { googleStand = "fehler"; zeichnen(); });
  }

  function anmelden() {
    G.anmelden().then(function () { return G.kalenderLaden(); }).then(googleLaden)
      .catch(function () { googleStand = "fehler"; zeichnen(); });
  }

  /* ---------- Anzeige ---------- */

  function abgehakt() { return Familie.laden(ABGEHAKT_KEY, {}); }

  function hinweisAbhaken(heute, h) {
    var a = abgehakt();
    var grenze = G ? G.plusTage(heute, -14) : heute;
    Object.keys(a).forEach(function (k) { if (k.split("|")[0] < grenze) delete a[k]; });
    a[heute + "|" + h.id] = true;
    Familie.speichern(ABGEHAKT_KEY, a);
    zeichnen();
  }

  function zeichnen() {
    var heute = Familie.heute();
    var d = Familie.ausIso(heute);
    var liste = el("ul", { class: "h-liste" });
    var anzahl = 0;

    // Hinweise wie „Benno hat Sport“
    var erledigt = abgehakt();
    L.hinweise(heute, googleTermine).forEach(function (h) {
      var fertig = !!erledigt[heute + "|" + h.id];
      liste.appendChild(zeile(h.symbol, el("span", { text: h.text }),
        [], "hinweis-zeile" + (fertig ? " fertig" : ""),
        fertig ? null : haken("Erledigt: " + h.text, function () { hinweisAbhaken(heute, h); })));
      anzahl++;
    });

    // Bring-Plan: morgens für heute, ab 10 Uhr schon für morgen (am Samstag nichts)
    var jetzt = jetztHHMM();
    if (window.Bringen) {
      var B = window.BringLogik;
      var bplan = Bringen.laden();
      var btag = B.anzeigeTag(bplan, heute, jetzt, Bringen.inFerien);
      if (btag) {
        var bd = Familie.ausIso(btag.iso);
        var vorsatz = btag.heute ? "" : btag.morgen ? "Morgen: " : TAGE[bd.getDay()] + ": ";
        B.tag(bplan, btag.iso, Bringen.inFerien).forEach(function (e) {
          var p = e.personId ? Familie.person(e.personId) : null;
          var knopf = e.ausfall ? el("span", { class: "chip", text: "fällt aus" }) : el("button", {
            class: "h-tausch" + (e.getauscht ? " getauscht" : ""),
            "aria-label": vorsatz + e.weg.titel + ": " + (p ? p.name : "noch niemand") + ". Tippen zum Tauschen",
            onclick: function () { Bringen.tauschen(e.weg.id, btag.iso); zeichnen(); }
          }, [p ? el("span", { class: "h-punkt", style: "background:" + p.farbe }) : null, p ? p.name : "Wer?", el("span", { class: "h-pfeil", text: "⇄" })]);
          liste.appendChild(zeile(e.weg.symbol, el("a", { href: "bringen/", text: vorsatz + e.weg.titel }),
            e.weg.uhrzeit ? [el("span", { class: "h-kal", text: e.weg.uhrzeit })] : [], "bringen" + (e.ausfall ? " fertig" : ""), knopf));
          anzahl++;
        });
      }
    }

    // Termine
    L.termine(googleTermine, heute).forEach(function (t) {
      var vorbei = t.uhrzeit && t.uhrzeit < jetzt;
      liste.appendChild(zeile(el("span", { class: "h-zeit", text: t.uhrzeit || "ganzt." }),
        el("span", { text: t.titel }),
        [el("span", { class: "h-kal" }, [el("span", { class: "h-punkt", style: "background:" + t.farbe }), t.kalenderName])],
        "termin" + (vorbei ? " vorbei" : "")));
      anzahl++;
    });

    // Fällige Aufgaben (überfällig und heute)
    var faellig = Aufgaben.alle().filter(function (a) {
      var s = Aufgaben.status(a); return s === "ueberfaellig" || s === "heute";
    }).sort(function (a, b) { return a.faellig < b.faellig ? -1 : 1; });
    faellig.forEach(function (a) {
      var info = Aufgaben.KATEGORIEN[a.kategorie] || { symbol: "📌" };
      var p = a.personId ? Familie.person(a.personId) : null;
      var tage = -Aufgaben.tageBis(a.faellig);
      liste.appendChild(zeile(info.symbol, el("a", { href: "aufgaben/", text: a.titel }), [
        tage > 0 ? el("span", { class: "chip h-ueber", text: tage === 1 ? "seit gestern" : "seit " + tage + " Tagen" }) : null,
        p ? el("span", { class: "chip" }, [el("span", { class: "h-punkt", style: "background:" + p.farbe }), p.name]) : null
      ], "aufgabe", haken("Erledigt: " + a.titel, function () { Aufgaben.erledigen(a.id); zeichnen(); })));
      anzahl++;
    });

    // Essen
    var essen = L.essen(Familie.laden(ESSEN_KEY, null), heute);
    essen.forEach(function (m) {
      liste.appendChild(zeile("🍽️", el("a", { href: "essen/", text: m.mahlzeit + ": " + m.name }), [], "essen"));
    });
    if (!essen.some(function (m) { return m.mahlzeit === "Abend"; })) {
      liste.appendChild(zeile("🍽️", el("a", { href: "essen/", text: "Abendessen noch nicht geplant" }), [], "essen leer"));
    }

    box.innerHTML = "";
    box.appendChild(el("h2", { class: "h-titel" }, ["Heute", el("span", { text: TAGE[d.getDay()] + ", " + d.getDate() + ". " + MONATE[d.getMonth()] })]));
    if (!anzahl) box.appendChild(el("p", { class: "h-ruhig", text: "Keine Termine und nichts fällig. 🙂" }));
    box.appendChild(liste);

    // Google-Hinweis unten, klein
    if (G && G.eingerichtet() && !G.angemeldet()) {
      box.appendChild(el("p", { class: "h-fuss" }, [
        G.warAngemeldet() ? "Google-Anmeldung abgelaufen. " : "Termine aus Google Kalender fehlen noch. ",
        el("button", { class: "h-link", text: G.warAngemeldet() ? "Neu anmelden" : "Verbinden", onclick: anmelden }),
        " oder ",
        el("a", { class: "h-link", href: "kalender/skript.html", text: "dauerhaft verbinden" })
      ]));
    } else if (googleStand === "fehler") {
      box.appendChild(el("p", { class: "h-fuss", text: "Termine gerade nicht erreichbar, zeige den letzten Stand." }));
    }
  }

  window.addEventListener("familie:aktualisiert", zeichnen);
  window.addEventListener("storage", zeichnen);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) googleLaden(); });
  googleLaden();
})();
