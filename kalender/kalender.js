/* Wochenansicht: Google-Termine, Aufgaben und Abendessen pro Tag. */
(function () {
  "use strict";

  var CACHE_KEY = "familie.kalender.geraet.cache";   // { von, bis, termine } für offline
  var ESSEN_KEY = "familie.essen.v1";
  var IMPORT_KEY = "familie.kalender.importiert";        // { aufgabenId: abholdatum }, synchronisiert
  var TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  var MONATE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];

  var $ = function (s) { return document.querySelector(s); };
  var G = window.GoogleKalender;
  var wocheStart = montag(Familie.heute());
  var googleTermine = [];
  var googleFehler = null;

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

  function montag(iso) {
    var d = Familie.ausIso(iso);
    return G.plusTage(iso, -((d.getDay() + 6) % 7));
  }

  function tageDerWoche() {
    var t = [];
    for (var i = 0; i < 7; i++) t.push(G.plusTage(wocheStart, i));
    return t;
  }

  function kopfText() {
    var a = Familie.ausIso(wocheStart), b = Familie.ausIso(G.plusTage(wocheStart, 6));
    var aT = a.getDate() + "." + (a.getMonth() !== b.getMonth() ? " " + MONATE[a.getMonth()] : "");
    var heuteMontag = montag(Familie.heute());
    var name = wocheStart === heuteMontag ? "Diese Woche" : wocheStart === G.plusTage(heuteMontag, 7) ? "Nächste Woche"
      : wocheStart === G.plusTage(heuteMontag, -7) ? "Letzte Woche" : "Woche";
    return name + " · " + aT + " – " + b.getDate() + ". " + MONATE[b.getMonth()];
  }

  /* ---------- Daten ---------- */

  function abendessen(iso) {
    var d = Familie.laden(ESSEN_KEY, null);
    if (!d || !d.plan || !d.plan[iso]) return [];
    var gerichte = d.gerichte || [];
    var name = function (id) { var g = gerichte.find(function (x) { return x.id === id; }); return g ? g.name : null; };
    var e = d.plan[iso];
    return [["mittag", "Mittag"], ["abend", "Abend"]].filter(function (m) { return e[m[0]] && name(e[m[0]]); })
      .map(function (m) { return { titel: m[1] + ": " + name(e[m[0]]), datum: iso, modul: "essen" }; });
  }

  function eintraegeAm(iso) {
    var g = googleTermine.filter(function (t) { return t.datum === iso; });
    var a = window.Aufgaben ? Aufgaben.termineZwischen(iso, iso) : [];
    // ganztägige zuerst, dann nach Uhrzeit
    g.sort(function (x, y) { return (x.uhrzeit || "") < (y.uhrzeit || "") ? -1 : 1; });
    return { google: g, aufgaben: a, essen: abendessen(iso) };
  }

  function googleLaden() {
    var von = wocheStart, bis = G.plusTage(wocheStart, 6);
    var cache = Familie.laden(CACHE_KEY, null);
    googleTermine = cache && cache.von === von ? cache.termine : [];
    googleFehler = null;
    if (!G.eingerichtet() || !G.angemeldet()) { zeichnen(); return Promise.resolve(); }
    zeichnen();
    var listeDa = G.kalenderListe().length ? Promise.resolve() : G.kalenderLaden();
    return listeDa.then(function () { return G.termine(von, bis); }).then(function (t) {
      googleTermine = t;
      Familie.speichern(CACHE_KEY, { von: von, bis: bis, termine: t });
      zeichnen();
      return muellUebernehmen();
    }).catch(function (e) {
      googleFehler = e;
      zeichnen();
    });
  }

  /* Abfallkalender -> Aufgabe "Tonne rausstellen" am Vorabend, für die nächsten 4 Wochen.
     Feste ids, damit nichts doppelt entsteht (auch nicht auf mehreren Handys). */
  function muellUebernehmen() {
    var abfall = G.abfallKalender();
    if (!abfall || !window.Aufgaben) return Promise.resolve(0);
    var heute = Familie.heute();
    return G.termine(heute, G.plusTage(heute, 28), [abfall]).then(function (liste) {
      var neu = 0;
      // Schon einmal übernommene Termine nicht erneut anlegen (auch wenn die Aufgabe gelöscht wurde).
      var importiert = Familie.laden(IMPORT_KEY, {});
      var grenze = G.plusTage(heute, -60);
      Object.keys(importiert).forEach(function (k) { if (importiert[k] < grenze) delete importiert[k]; });
      liste.forEach(function (t) {
        var id = "gcal-" + t.id + "-" + t.datum;
        var vortag = G.plusTage(t.datum, -1);
        if (vortag < heute || importiert[id] || Aufgaben.holen(id)) return;
        importiert[id] = t.datum;
        Aufgaben.speichern({
          id: id,
          titel: t.titel.replace(/\s*-?\s*abholung\s*$/i, "") + ": Tonne rausstellen",
          kategorie: "muell",
          start: vortag,
          wiederholung: { art: "keine", intervall: 1 },
          erinnerungTage: 0,
          notiz: "Abholung am " + datumLang(t.datum) + " (aus dem Abfallkalender)"
        });
        neu++;
      });
      Familie.speichern(IMPORT_KEY, importiert);
      if (neu) { zeichnen(); hinweis(neu + " Müll-Termin" + (neu > 1 ? "e" : "") + " als Aufgabe übernommen."); }
      return neu;
    }).catch(function () { return 0; });
  }

  function datumLang(iso) {
    var d = Familie.ausIso(iso);
    return TAGE[d.getDay()] + ", " + d.getDate() + ". " + MONATE[d.getMonth()];
  }

  /* ---------- Anzeige ---------- */

  function personChip(pid) {
    var p = pid ? Familie.person(pid) : null;
    if (!p) return null;
    return el("span", { class: "chip" }, [el("span", { class: "person-punkt", style: "background:" + p.farbe }), p.name]);
  }

  function zeile(symbol, text, extra, klasse) {
    return el("div", { class: "eintrag " + (klasse || "") }, [
      el("span", { class: "zeit" }, [symbol]),
      el("span", { class: "was" }, [text].concat(extra || []))
    ]);
  }

  function statusZeichnen() {
    var box = $("#google-status");
    box.innerHTML = "";
    if (!G.eingerichtet()) {
      box.appendChild(el("p", { class: "leise", text: "Google Kalender ist noch nicht eingerichtet. Aufgaben und Essen siehst du trotzdem." }));
      return;
    }
    if (!G.angemeldet()) {
      box.appendChild(el("div", { class: "karte anmelden" }, [
        el("span", { text: G.warAngemeldet() ? "Die Google-Anmeldung ist abgelaufen." : "Verbinde deinen Google Kalender, dann siehst du hier auch eure Termine." }),
        el("button", { class: "knopf", text: G.warAngemeldet() ? "Neu anmelden" : "Mit Google anmelden", onclick: anmelden }),
        el("a", { href: "skript.html", text: "Lieber dauerhaft verbinden" })
      ]));
    } else if (googleFehler) {
      box.appendChild(el("p", { class: "warn", text: googleFehler.message }));
    }
  }

  function zeichnen() {
    $("#woche").textContent = kopfText();
    statusZeichnen();
    var box = $("#tage");
    box.innerHTML = "";
    var heute = Familie.heute();
    tageDerWoche().forEach(function (iso) {
      var e = eintraegeAm(iso);
      var karte = el("section", { class: "karte tag" + (iso === heute ? " heute" : "") + (iso < heute ? " vorbei" : "") }, [
        el("h3", { text: (iso === heute ? "Heute, " : "") + datumLang(iso) })
      ]);
      e.google.forEach(function (t) {
        karte.appendChild(zeile(t.uhrzeit || "ganztags", t.titel, [
          el("span", { class: "kal", title: t.kalenderName }, [el("span", { class: "person-punkt", style: "background:" + t.farbe }), t.kalenderName])
        ], t.uhrzeit ? "" : "ganztags"));
      });
      e.aufgaben.forEach(function (a) {
        var info = Aufgaben.KATEGORIEN[a.kategorie] || { symbol: "📌" };
        var link = el("a", { href: "../aufgaben/", text: a.titel });
        karte.appendChild(zeile(info.symbol, link, [personChip(a.personId)], "aufgabe"));
      });
      e.essen.forEach(function (m) {
        karte.appendChild(zeile("🍽️", el("a", { href: "../essen/", text: m.titel }), [], "essen"));
      });
      var leer = !e.google.length && !e.aufgaben.length && !e.essen.length;
      if (leer && iso < heute) return;   // vergangene leere Tage ausblenden
      if (leer) karte.appendChild(el("p", { class: "leise", text: "Nichts geplant" }));
      box.appendChild(karte);
    });
  }

  var hinweisTimer;
  function hinweis(text) {
    var h = $("#hinweis");
    h.textContent = text; h.hidden = false;
    clearTimeout(hinweisTimer);
    hinweisTimer = setTimeout(function () { h.hidden = true; }, 4000);
  }

  /* ---------- Einstellungen ---------- */

  function anmelden() {
    G.anmelden().then(function () { return G.kalenderLaden(); }).then(function () {
      einstellungenZeichnen(); return googleLaden();
    }).catch(function (e) { hinweis(e.message); });
  }

  function einstellungenZeichnen() {
    var box = $("#kalender-liste");
    box.innerHTML = "";
    var konto = $("#konto");
    konto.innerHTML = "";
    if (!G.eingerichtet()) { box.appendChild(el("p", { class: "leise", text: "Noch nicht eingerichtet." })); return; }
    var dauerhaft = el("p", { class: "leise" }, [el("a", { href: "skript.html", text: "Dauerhaft verbinden" }), ", dann muss sich niemand mehr jede Stunde neu anmelden."]);
    if (G.skript()) {
      konto.appendChild(el("p", { class: "leise" }, ["Dauerhaft verbunden über euer Kalender-Skript, für alle Handys. ", el("a", { href: "skript.html", text: "Ändern" })]));
    } else if (!G.angemeldet()) {
      konto.appendChild(el("button", { class: "knopf", text: "Mit Google anmelden", onclick: anmelden }));
      konto.appendChild(dauerhaft);
      return;
    } else {
      konto.appendChild(el("button", { class: "knopf zweit", text: "Von Google abmelden", onclick: function () {
        G.abmelden(); googleTermine = []; localStorage.removeItem(CACHE_KEY); einstellungenZeichnen(); zeichnen();
      } }));
      konto.appendChild(dauerhaft);
    }
    var auswahl = G.auswahl();
    var abfall = $("#abfall");
    abfall.innerHTML = "";
    abfall.appendChild(el("option", { value: "", text: "keiner" }));
    G.kalenderListe().forEach(function (k) {
      var cb = el("input", { type: "checkbox" });
      cb.checked = !!auswahl[k.id];
      cb.addEventListener("change", function () { G.auswahlSetzen(k.id, cb.checked); googleLaden(); });
      box.appendChild(el("label", { class: "kal-wahl" }, [cb, el("span", { class: "person-punkt", style: "background:" + k.farbe }), k.name]));
      abfall.appendChild(el("option", { value: k.id, text: k.name }));
    });
    abfall.value = G.abfallKalender();
  }

  $("#abfall").addEventListener("change", function (e) { G.abfallSetzen(e.target.value); muellUebernehmen(); });
  $("#zurueck").addEventListener("click", function () { wocheStart = G.plusTage(wocheStart, -7); googleLaden(); });
  $("#vor").addEventListener("click", function () { wocheStart = G.plusTage(wocheStart, 7); googleLaden(); });
  $("#heute").addEventListener("click", function () { wocheStart = montag(Familie.heute()); googleLaden(); });
  $("#einstellungen-oeffnen").addEventListener("click", function (e) {
    e.preventDefault(); einstellungenZeichnen(); $("#einstellungen").showModal();
  });
  $("#einstellungen-schliessen").addEventListener("click", function () { $("#einstellungen").close(); });

  window.addEventListener("familie:aktualisiert", zeichnen);
  window.addEventListener("storage", zeichnen);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) googleLaden(); });

  googleLaden();
})();
