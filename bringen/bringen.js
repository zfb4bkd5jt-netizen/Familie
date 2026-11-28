/*
 * Bring-Plan: Oberfläche. Logik in logik.js, Laden/Speichern in bringen-daten.js.
 * Zeigt diese und nächste Woche (Mo bis Fr). Tipp auf den Namen = andere Person übernimmt an dem Tag.
 */
(function () {
  "use strict";

  var L = window.BringLogik;
  var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var $ = function (s) { return document.querySelector(s); };

  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === "text") e.textContent = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    });
    (kinder || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  function datumKurz(iso) {
    var t = iso.split("-").map(Number);
    return t[2] + "." + t[1] + ".";
  }

  function personChip(pid, extraKlasse) {
    var p = pid ? Familie.person(pid) : null;
    return el("span", { class: "b-person " + (extraKlasse || "") }, [
      p ? el("span", { class: "b-punkt", style: "background:" + p.farbe }) : null,
      p ? p.name : "Wer bringt?"
    ]);
  }

  function hinweis(text) {
    var alt = document.querySelector(".hinweis");
    if (alt) alt.remove();
    var h = el("div", { class: "hinweis", role: "status", text: text });
    document.body.appendChild(h);
    setTimeout(function () { h.remove(); }, 2200);
  }

  /* ---------- Plan ---------- */

  function zeichnen() {
    var plan = Bringen.laden();
    var heute = Familie.heute();
    var wochen = [];
    if (!Familie.personen().length) {
      $("#wochen").replaceChildren(el("p", { class: "karte" }, [
        "Noch keine Personen angelegt. ",
        el("button", { class: "b-link", text: "Jetzt eintragen", onclick: regelOeffnen })
      ]));
      return;
    }
    [0, 7].forEach(function (versatz) {
      // Am Wochenende ist „diese Woche“ vorbei: dann mit der kommenden anfangen
      var wt = L.wochentag(heute), wochenende = wt === 0 || wt === 6;
      var mo = L.plusTage(L.montag(heute), versatz + (wochenende ? 7 : 0));
      var tage = [0, 1, 2, 3, 4].map(function (n) { return L.plusTage(mo, n); });
      var karten = tage.map(function (iso) {
        var eintraege = L.tag(plan, iso, Bringen.inFerien);
        var vorbei = iso < heute;
        var d = Familie.ausIso(iso);
        var kopf = el("h3", { class: "b-tag" }, [
          TAGE[d.getDay()], el("span", { text: iso === heute ? "heute" : iso === L.plusTage(heute, 1) ? "morgen" : datumKurz(iso) })
        ]);
        var zeilen = eintraege.map(function (e) {
          return el("div", { class: "b-zeile" + (e.ausfall ? " ausfall" : "") }, [
            el("span", { class: "b-symbol", "aria-hidden": "true", text: e.weg.symbol }),
            el("span", { class: "b-weg" }, [e.weg.titel, e.weg.uhrzeit ? el("small", { text: " " + e.weg.uhrzeit }) : null]),
            el("button", {
              class: "b-tausch" + (e.getauscht ? " getauscht" : ""),
              disabled: vorbei,
              "aria-label": e.weg.titel + " am " + TAGE[d.getDay()] + ": " + (e.ausfall ? "fällt aus" : (Familie.person(e.personId) || { name: "niemand" }).name) + ". Tippen zum Tauschen",
              onclick: function () {
                var p = Bringen.tauschen(e.weg.id, iso);
                if (p) hinweis(p.name + " bringt " + e.weg.titel.replace(/ (in die|zur|zum) .*/, "") + " am " + TAGE[d.getDay()]);
                zeichnen();
              }
            }, [e.ausfall ? el("span", { class: "b-person", text: "fällt aus" }) : personChip(e.personId), el("span", { class: "b-pfeil", "aria-hidden": "true", text: "⇄" })]),
            vorbei ? null : el("button", {
              class: "b-aus", title: e.ausfall ? "Doch bringen" : "Fällt aus (z. B. krank)",
              "aria-label": e.ausfall ? "Doch bringen" : "Fällt aus",
              text: e.ausfall ? "↺" : "✕",
              onclick: function () { Bringen.ausfallUmschalten(e.weg.id, iso); zeichnen(); }
            })
          ]);
        });
        if (!zeilen.length) zeilen = [el("p", { class: "leise b-frei", text: "Ferien, nichts zu bringen" })];
        return el("section", { class: "karte b-karte" + (iso === heute ? " heute" : "") + (vorbei ? " vorbei" : "") }, [kopf].concat(zeilen));
      });
      wochen.push(el("h2", { text: wochenende ? (versatz ? "Übernächste Woche" : "Nächste Woche") : (versatz ? "Nächste Woche" : "Diese Woche") }));
      wochen = wochen.concat(karten);
    });
    $("#wochen").replaceChildren.apply($("#wochen"), wochen);
  }

  /* ---------- Regelplan ---------- */

  var dialog = $("#regel-dialog");

  function regelZeichnen() {
    var plan = Bringen.laden();
    var personen = Familie.personen();
    var box = $("#regel-wege");
    box.replaceChildren();
    plan.wege.forEach(function (w) {
      var kand = personen.filter(function (p) { return w.kandidaten.indexOf(p.id) >= 0; });
      // Pro Wochentag eine Reihe mit Knöpfen: wer bringt normalerweise?
      var tageZeilen = L.WOCHENTAGE.map(function (t) {
        return el("div", { class: "b-regel-tag", role: "group", "aria-label": w.titel + " am " + TAGE[t] }, [
          el("span", { class: "b-regel-name", text: L.TAG_NAMEN[t] })
        ].concat(kand.map(function (p) {
          var an = w.regel[t] === p.id;
          return el("button", {
            type: "button", class: "b-wahl" + (an ? " an" : ""), "aria-pressed": String(an),
            onclick: function () {
              var plan2 = Bringen.laden();
              var w2 = L.weg(plan2, w.id);
              if (w2.regel[t] === p.id) delete w2.regel[t]; else w2.regel[t] = p.id;
              Bringen.speichern(plan2); regelZeichnen(); zeichnen();
            }
          }, [el("span", { class: "b-punkt", style: "background:" + p.farbe }), p.name]);
        })));
      });
      var checks = personen.filter(function (p) { return !L.istKind(p, plan.wege); }).map(function (p) {
        var cb = el("input", {
          type: "checkbox", checked: w.kandidaten.indexOf(p.id) >= 0,
          onchange: function () {
            var plan2 = Bringen.laden();
            var w2 = L.weg(plan2, w.id);
            w2.kandidaten = w2.kandidaten.filter(function (id) { return id !== p.id; });
            if (cb.checked) {
              // Reihenfolge wie in der Personenliste, damit der Tausch immer gleich reihum geht
              w2.kandidaten = personen.map(function (x) { return x.id; }).filter(function (id) { return id === p.id || w2.kandidaten.indexOf(id) >= 0; });
            } else {
              Object.keys(w2.regel).forEach(function (t) { if (w2.regel[t] === p.id) delete w2.regel[t]; });
            }
            Bringen.speichern(plan2); regelZeichnen(); zeichnen();
          }
        });
        return el("label", { class: "b-check" }, [cb, p.name]);
      });
      var zeit = el("input", {
        type: "time", value: w.uhrzeit || "", "aria-label": "Uhrzeit " + w.titel,
        onchange: function () {
          var plan2 = Bringen.laden();
          L.weg(plan2, w.id).uhrzeit = zeit.value;
          Bringen.speichern(plan2); zeichnen();
        }
      });
      box.appendChild(el("fieldset", { class: "b-regel" }, [
        el("legend", {}, [w.symbol + " " + w.titel]),
        el("div", { class: "b-checks" }, [el("span", { class: "leise", text: "Wer kann bringen?" })].concat(checks)),
        el("div", { class: "b-regel-tage" }, tageZeilen),
        el("label", { class: "b-zeit" }, [el("span", { text: w.schule ? "Bus fährt um (optional)" : "Los um (optional)" }), zeit]),
        w.schule ? el("p", { class: "leise klein", text: "In den Schulferien entfällt der Weg zum Bus." }) : null
      ]));
    });

    var pbox = $("#personen");
    pbox.replaceChildren.apply(pbox, personen.length ? personen.map(function (p) {
      return el("span", { class: "chip b-chip" }, [el("span", { class: "b-punkt", style: "background:" + p.farbe }), p.name]);
    }) : [el("p", { class: "leise", text: "Noch niemand eingetragen. Fangt mit Matthias und Maike an." })]);
  }

  function regelOeffnen() { regelZeichnen(); dialog.showModal(); }

  $("#regel-oeffnen").addEventListener("click", regelOeffnen);
  $("#person-hinzu").addEventListener("click", function () {
    var name = $("#person-name").value.trim();
    if (!name) return;
    Familie.personHinzufuegen(name);
    $("#person-name").value = "";
    Bringen.laden();   // zieht die ersten Personen in den Plan
    regelZeichnen(); zeichnen();
  });
  $("#person-name").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") { ev.preventDefault(); $("#person-hinzu").click(); }
  });

  window.addEventListener("familie:aktualisiert", function () { zeichnen(); if (dialog.open) regelZeichnen(); });
  window.addEventListener("storage", zeichnen);
  zeichnen();
})();
