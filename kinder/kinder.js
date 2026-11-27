/* Oberfläche „Schule & Kita“: pro Kind Nachrichten aus Schul- und Kita-App ablegen
   und daraus mit einem Tipp Termine und Aufgaben machen (landen in Aufgaben & Woche).

   Daten unter "familie.kinder.v1":
   { kinder: [{id, name, ort: "Schule"|"Kita", app}],
     infos:  [{id, kindId, eingang: "2026-11-27", text, aufgaben: [aufgabeId]}] } */
(function () {
  "use strict";

  var KEY = "familie.kinder.v1";
  var WAHL_KEY = "familie.kinder.geraet.kind";
  var WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  var $ = function (s) { return document.querySelector(s); };
  var gewaehlt = Familie.laden(WAHL_KEY, null);
  var entwurf = { text: "", vorschlaege: null };

  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kinder || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  function daten() {
    var d = Familie.laden(KEY, {});
    return { kinder: d.kinder || [], infos: d.infos || [] };
  }
  function speichern(d) { Familie.speichern(KEY, d); }

  function kurzDatum(iso) {
    var d = Familie.ausIso(iso);
    return WOCHENTAGE[d.getDay()] + " " + d.getDate() + "." + (d.getMonth() + 1) + ".";
  }

  var hinweisTimer;
  function hinweis(text, aktion) {
    var h = $("#hinweis");
    h.innerHTML = "";
    h.appendChild(el("span", { text: text }));
    if (aktion) h.appendChild(el("button", { text: aktion.text, onclick: function () { aktion.fn(); h.hidden = true; } }));
    h.hidden = false;
    clearTimeout(hinweisTimer);
    hinweisTimer = setTimeout(function () { h.hidden = true; }, 6000);
  }

  /* ---------- Zeichnen ---------- */

  function zeichnen() {
    var d = daten();
    if (!d.kinder.some(function (k) { return k.id === gewaehlt; })) gewaehlt = d.kinder.length ? d.kinder[0].id : null;
    var reiter = $("#reiter");
    var inhalt = $("#inhalt");
    reiter.innerHTML = "";
    inhalt.innerHTML = "";

    if (!d.kinder.length) {
      inhalt.appendChild(el("div", { class: "karte leer" }, [
        el("p", { text: "Hier sammelst du alles aus Schule und Kita an einem Ort: Nachricht einfügen, und die App schlägt Termine und Aufgaben vor." }),
        el("button", { class: "knopf", text: "Kinder eintragen", onclick: einstellungenOeffnen })
      ]));
      return;
    }

    d.kinder.forEach(function (k) {
      reiter.appendChild(el("button", {
        role: "tab", "aria-selected": String(k.id === gewaehlt),
        onclick: function () { gewaehlt = k.id; Familie.speichern(WAHL_KEY, gewaehlt); entwurf = { text: "", vorschlaege: null }; zeichnen(); }
      }, [(k.ort === "Kita" ? "🧸 " : "🎒 ") + k.name, el("small", { text: k.ort + (k.app ? " · " + k.app : "") })]));
    });
    reiter.hidden = d.kinder.length < 2;

    var kind = d.kinder.find(function (k) { return k.id === gewaehlt; });
    inhalt.appendChild(eingabeKarte(kind));
    if (entwurf.vorschlaege) inhalt.appendChild(vorschlagsBereich(kind));
    inhalt.appendChild(demnaechst(kind, d));
    inhalt.appendChild(abgelegt(kind, d));
  }

  function eingabeKarte(kind) {
    var feld = el("textarea", {
      "aria-label": "Nachricht", placeholder: "Nachricht aus " + (kind.app || "der " + kind.ort + "s-App") + " hier einfügen …"
    });
    feld.value = entwurf.text;
    feld.addEventListener("input", function () { entwurf.text = feld.value; });

    var einfuegen = navigator.clipboard && navigator.clipboard.readText ? el("button", {
      class: "knopf zweit", type: "button", text: "📋 Einfügen",
      onclick: function () {
        navigator.clipboard.readText().then(function (t) {
          feld.value = entwurf.text = (feld.value ? feld.value + "\n" : "") + t;
          auswerten();
        }).catch(function () { feld.focus(); hinweis("Lange ins Feld tippen und „Einsetzen“ wählen."); });
      }
    }) : null;

    return el("div", { class: "karte eingabe" }, [
      el("strong", { text: "Neue Nachricht für " + kind.name }),
      feld,
      el("div", { class: "knoepfe" }, [
        einfuegen,
        el("button", { class: "knopf", type: "button", text: "Termine & Aufgaben finden", onclick: auswerten })
      ]),
      el("details", { class: "tipp" }, [
        el("summary", { text: "Nur ein Screenshot oder Foto?" }),
        el("ol", {}, [
          el("li", { text: "Screenshot in der Fotos-App öffnen." }),
          el("li", { text: "Lange auf den Text drücken, „Alles auswählen“, dann „Kopieren“." }),
          el("li", { text: "Hier auf „Einfügen“ tippen." })
        ])
      ])
    ]);
  }

  function auswerten() {
    var text = entwurf.text.trim();
    if (!text) { hinweis("Erst eine Nachricht einfügen."); return; }
    entwurf.vorschlaege = KinderLogik.vorschlaege(text, Familie.heute()).map(function (v) {
      v.an = true;
      v.titel = v.uhrzeit && v.titel.indexOf(v.uhrzeit) < 0 && v.titel.indexOf(v.uhrzeit.replace(":00", "")) < 0
        ? v.titel + " (" + v.uhrzeit + " Uhr)" : v.titel;
      return v;
    });
    zeichnen();
    var b = document.querySelector(".vorschlaege");
    if (b) b.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function vorschlagsBereich(kind) {
    var box = el("section", { class: "vorschlaege" }, [el("h2", { text: "Gefunden" })]);
    var vs = entwurf.vorschlaege;
    if (!vs.length) {
      box.appendChild(el("p", { class: "leise", text: "Kein Datum und nichts zum Mitgeben gefunden. Du kannst die Nachricht trotzdem ablegen oder selbst etwas hinzufügen." }));
    }
    vs.forEach(function (v) {
      var karte = el("div", { class: "karte vorschlag" + (v.an ? "" : " aus") });
      var haken = el("input", { type: "checkbox", "aria-label": "Übernehmen", checked: v.an });
      haken.addEventListener("change", function () { v.an = haken.checked; karte.classList.toggle("aus", !v.an); knopfText(); });
      var titel = el("input", { name: "titel", "aria-label": "Titel" });
      titel.value = v.titel;
      titel.addEventListener("input", function () { v.titel = titel.value; });
      var art = el("select", { "aria-label": "Art" }, [
        el("option", { value: "termin", text: "📅 Termin", selected: v.art === "termin" }),
        el("option", { value: "aufgabe", text: "✅ Erledigen", selected: v.art === "aufgabe" })
      ]);
      art.addEventListener("change", function () { v.art = art.value; });
      var datum = el("input", { type: "date", "aria-label": "Datum" });
      datum.value = v.datum;
      datum.addEventListener("change", function () { v.datum = datum.value; });
      karte.appendChild(haken);
      karte.appendChild(el("div", { class: "felder" }, [titel, art, datum]));
      box.appendChild(karte);
    });

    var uebernehmen = el("button", { class: "knopf", type: "button", onclick: function () { ablegen(kind); } });
    function knopfText() {
      var n = vs.filter(function (v) { return v.an; }).length;
      uebernehmen.textContent = n ? n + " übernehmen und ablegen" : "Nur ablegen";
    }
    knopfText();
    box.appendChild(el("div", { class: "aktionen" }, [
      el("button", { class: "knopf zweit", type: "button", text: "＋ Eintrag", onclick: function () {
        vs.push({ art: "aufgabe", titel: "", datum: Familie.heute(), an: true }); zeichnen();
      } }),
      el("span", { class: "luecke" }),
      uebernehmen
    ]));
    return box;
  }

  /* Gewählte Vorschläge als Aufgaben speichern (Kategorie „Schule & Kita“) und die Nachricht ablegen. */
  function ablegen(kind) {
    var ids = [];
    entwurf.vorschlaege.forEach(function (v) {
      if (!v.an || !v.titel.trim() || !v.datum) return;
      var a = Aufgaben.speichern({
        titel: kind.name + ": " + v.titel.trim(),
        kategorie: "schule",
        start: v.datum,
        wiederholung: { art: "keine", intervall: 1 },
        // Termine 2 Tage vorher zeigen, Mitgeben am Vortag
        erinnerungTage: v.art === "termin" ? 2 : 1,
        notiz: (v.satz ? "„" + v.satz + "“\n" : "") + "Aus " + (kind.app || kind.ort) + ", " + kurzDatum(Familie.heute())
      });
      ids.push(a.id);
    });
    var d = daten();
    var info = { id: Familie.id(), kindId: kind.id, eingang: Familie.heute(), text: entwurf.text.trim(), aufgaben: ids };
    d.infos.unshift(info);
    speichern(d);
    entwurf = { text: "", vorschlaege: null };
    zeichnen();
    window.scrollTo({ top: 0, behavior: "smooth" });
    hinweis(ids.length ? ids.length + " in Aufgaben & Woche eingetragen." : "Abgelegt.", {
      text: "Rückgängig", fn: function () {
        ids.forEach(Aufgaben.loeschen);
        var d2 = daten();
        d2.infos = d2.infos.filter(function (i) { return i.id !== info.id; });
        speichern(d2);
        entwurf = { text: info.text, vorschlaege: null };
        zeichnen();
      }
    });
  }

  /* Offene Termine/Aufgaben dieses Kindes: alle aus seinen Nachrichten plus Aufgaben mit seinem Namen vorne. */
  function demnaechst(kind, d) {
    var ids = {};
    d.infos.forEach(function (i) { if (i.kindId === kind.id) (i.aufgaben || []).forEach(function (a) { ids[a] = true; }); });
    var praefix = kind.name.toLowerCase() + ":";
    var offen = Aufgaben.alle().filter(function (a) {
      return a.faellig && (ids[a.id] || (a.kategorie === "schule" && a.titel.toLowerCase().indexOf(praefix) === 0));
    }).sort(function (x, y) { return x.faellig < y.faellig ? -1 : 1; });

    var box = el("section", {}, [el("h2", { text: "Demnächst" })]);
    if (!offen.length) {
      box.appendChild(el("p", { class: "leise", text: "Nichts offen für " + kind.name + "." }));
      return box;
    }
    offen.forEach(function (a) {
      var t = Aufgaben.tageBis(a.faellig);
      var wann = t === 0 ? "heute" : t === 1 ? "morgen" : t < 0 ? "überfällig" : kurzDatum(a.faellig);
      var titel = a.titel.toLowerCase().indexOf(praefix) === 0 ? a.titel.slice(praefix.length).trim() : a.titel;
      box.appendChild(el("a", { class: "karte termin" + (t <= 1 ? " bald" : ""), href: "../aufgaben/", style: "color:inherit;text-decoration:none" }, [
        el("span", { class: "wann", text: wann }),
        el("span", { class: "was", text: titel })
      ]));
    });
    return box;
  }

  function abgelegt(kind, d) {
    var infos = d.infos.filter(function (i) { return i.kindId === kind.id; });
    var box = el("section", {}, [el("h2", { text: "Abgelegte Nachrichten" + (infos.length ? " (" + infos.length + ")" : "") })]);
    if (!infos.length) {
      box.appendChild(el("p", { class: "leise", text: "Noch keine. Eingefügte Nachrichten bleiben hier zum Nachlesen." }));
      return box;
    }
    infos.slice(0, 30).forEach(function (i) {
      var text = el("div", { class: "text zu", text: i.text });
      text.addEventListener("click", function () { text.classList.toggle("zu"); });
      var chips = (i.aufgaben || []).map(function (aid) {
        var a = Aufgaben.holen(aid);
        if (!a) return null;
        return el("span", { class: "chip", text: (a.faellig ? kurzDatum(a.faellig) : "✓") + " · " + a.titel.replace(kind.name + ": ", "").slice(0, 32) });
      }).filter(Boolean);
      box.appendChild(el("div", { class: "karte info" }, [
        el("div", { class: "kopfzeile" }, [
          el("span", { text: "Eingegangen " + kurzDatum(i.eingang) }),
          el("button", { "aria-label": "Nachricht löschen", text: "🗑", onclick: function () { infoLoeschen(i); } })
        ]),
        text,
        chips.length ? el("div", { class: "chips" }, chips) : null
      ]));
    });
    return box;
  }

  function infoLoeschen(info) {
    var d = daten();
    d.infos = d.infos.filter(function (i) { return i.id !== info.id; });
    speichern(d);
    zeichnen();
    hinweis("Nachricht gelöscht. Termine bleiben in den Aufgaben.", {
      text: "Rückgängig", fn: function () { var d2 = daten(); d2.infos.unshift(info); speichern(d2); zeichnen(); }
    });
  }

  /* ---------- Kinder verwalten ---------- */

  function einstellungenOeffnen(e) {
    if (e && e.preventDefault) e.preventDefault();
    var d = daten();
    var liste = $("#kinder-liste");
    liste.innerHTML = "";
    if (!d.kinder.length) liste.appendChild(el("p", { class: "leise", text: "Trag die Kinder ein, z. B. Benno (Schule, DieSchulApp) und Tilda (Kita, Kindy)." }));
    d.kinder.forEach(function (k) {
      liste.appendChild(el("div", { class: "kind" }, [
        el("span", { text: k.name + " · " + k.ort + (k.app ? " · " + k.app : "") }),
        el("button", { class: "knopf zweit klein", type: "button", text: "Entfernen", onclick: function () {
          var d2 = daten();
          d2.kinder = d2.kinder.filter(function (x) { return x.id !== k.id; });
          speichern(d2); einstellungenOeffnen(); zeichnen();
        } })
      ]));
    });
    var namen = $("#personen-namen");
    namen.innerHTML = "";
    Familie.personen().forEach(function (p) { namen.appendChild(el("option", { value: p.name })); });
    var dlg = $("#einstellungen");
    if (!dlg.open) dlg.showModal();
  }

  $("#kind-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target.elements;
    var d = daten();
    var kind = { id: Familie.id(), name: f.name.value.trim(), ort: f.ort.value, app: f.app.value.trim() };
    if (!kind.name) return;
    d.kinder.push(kind);
    speichern(d);
    gewaehlt = kind.id;
    e.target.reset();
    $("#k-app").value = "DieSchulApp";
    einstellungenOeffnen();
    zeichnen();
  });
  $("#k-ort").addEventListener("change", function (e) {
    var app = $("#k-app");
    if (!app.value || app.value === "DieSchulApp" || app.value === "Kindy") app.value = e.target.value === "Kita" ? "Kindy" : "DieSchulApp";
  });
  $("#k-app").value = "DieSchulApp";
  $("#einstellungen-oeffnen").addEventListener("click", einstellungenOeffnen);
  $("#einstellungen-schliessen").addEventListener("click", function () { $("#einstellungen").close(); });

  window.addEventListener("familie:aktualisiert", function (e) {
    var k = e.detail && e.detail.key;
    if (!k || k === KEY || k === "familie.aufgaben.v1") zeichnen();
  });

  zeichnen();
})();
