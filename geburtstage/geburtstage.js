/* Oberfläche: Geburtstage & Anlässe mit Geschenkideen. */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var liste = $("#liste");
  var detail = $("#detail");
  var formDialog = $("#formular-dialog");
  var form = $("#formular");
  var offenId = null;

  var WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

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

  function hinweis(text) {
    var h = $("#hinweis");
    h.textContent = text;
    h.hidden = false;
    clearTimeout(hinweis.t);
    hinweis.t = setTimeout(function () { h.hidden = true; }, 3000);
  }

  /* ---------- Texte ---------- */

  function wannText(e) {
    var d = Familie.ausIso(e.datum);
    var tag = WOCHENTAGE[d.getDay()] + ", " + d.getDate() + ". " + Anlaesse.MONATE[d.getMonth()];
    if (e.tage === 0) return "heute!";
    if (e.tage === 1) return "morgen, " + tag;
    return tag + " · in " + e.tage + " Tagen";
  }

  function alterText(e) {
    if (e.wievielte === null) return "";
    if (e.anlass.art === "geburtstag") return "wird " + e.wievielte;
    return e.wievielte + ". Mal";
  }

  function ideenZaehlen(a) {
    var z = { offen: 0, gekauft: 0 };
    a.ideen.forEach(function (i) {
      var s = Anlaesse.ideeStatus(a, i).status;
      if (s in z) z[s]++;
    });
    return z;
  }

  /* ---------- Liste ---------- */

  function karte(e) {
    var a = e.anlass;
    var z = ideenZaehlen(a);
    var chips = [];
    if (z.gekauft) chips.push(el("span", { class: "chip ok", text: "🎁 Geschenk da" }));
    else if (z.offen) chips.push(el("span", { class: "chip", text: "💡 " + z.offen + (z.offen === 1 ? " Idee" : " Ideen") }));
    else if (e.tage <= Math.max(a.vorlaufTage, 7)) chips.push(el("span", { class: "chip warn-chip", text: "noch keine Idee" }));
    var alter = alterText(e);
    return el("button", {
      class: "karte anlass" + (e.tage <= 7 ? " bald" : "") + (e.tage === 0 ? " heute" : ""),
      onclick: function () { detailOeffnen(a.id); }
    }, [
      el("span", { class: "symbol", text: Anlaesse.ARTEN[a.art].symbol }),
      el("span", { class: "text" }, [
        el("span", { class: "titel", text: Anlaesse.titel(a) }),
        el("span", { class: "meta" }, [
          el("span", { text: wannText(e) + (alter ? " · " + alter : "") })
        ].concat(chips))
      ])
    ]);
  }

  function zeichnen() {
    var alle = Anlaesse.demnaechst();
    liste.innerHTML = "";
    if (!alle.length) {
      liste.appendChild(el("div", { class: "leer" }, [
        el("p", { text: "Tragt hier Geburtstage und andere Anlässe ein. Ideen fürs Geschenk könnt ihr das ganze Jahr über sammeln, und rechtzeitig vorher steht „Geschenk besorgen“ in den Aufgaben." }),
        el("button", { class: "knopf", text: "Ersten Geburtstag eintragen", onclick: function () { formularOeffnen(null); } })
      ]));
    } else {
      var bald = alle.filter(function (e) { return e.tage <= 60; });
      var spaeter = alle.filter(function (e) { return e.tage > 60; });
      if (bald.length) {
        liste.appendChild(el("h2", { text: "Demnächst" }));
        bald.forEach(function (e) { liste.appendChild(karte(e)); });
      }
      if (spaeter.length) {
        liste.appendChild(el("h2", { text: "Später im Jahr" }));
        spaeter.forEach(function (e) { liste.appendChild(karte(e)); });
      }
    }
    if (detail.open && offenId) detailZeichnen();
  }

  /* ---------- Detail mit Ideen ---------- */

  function detailOeffnen(id) {
    offenId = id;
    detailZeichnen();
    if (!detail.open) detail.showModal();
  }

  function ideeZeile(a, i, st) {
    var gekauft = st.status !== "offen";
    return el("div", { class: "idee" + (gekauft ? " gekauft" : "") }, [
      st.status === "verschenkt" ? el("span", { class: "jahr", text: String(st.jahr) }) :
        el("button", {
          class: "haken", text: gekauft ? "✓" : "",
          "aria-label": gekauft ? "Doch noch nicht gekauft: " + i.text : "Gekauft: " + i.text,
          title: gekauft ? "Doch noch nicht gekauft" : "Gekauft",
          onclick: function () {
            Anlaesse.ideeAendern(a.id, i.id, { gekauftAm: gekauft ? null : Familie.heute() });
            zeichnen();
          }
        }),
      el("span", { class: "idee-text", text: i.text }),
      el("button", {
        class: "weg", text: "✕", "aria-label": "Idee löschen: " + i.text, title: "Löschen",
        onclick: function () { Anlaesse.ideeLoeschen(a.id, i.id); zeichnen(); }
      })
    ]);
  }

  function detailZeichnen() {
    var a = Anlaesse.holen(offenId);
    if (!a) { detail.close(); return; }
    var e = Anlaesse.demnaechst().find(function (x) { return x.anlass.id === a.id; });
    $("#d-titel").textContent = Anlaesse.ARTEN[a.art].symbol + " " + Anlaesse.titel(a);
    var alter = alterText(e);
    $("#d-meta").textContent = wannText(e) + (alter ? " · " + alter : "");
    $("#d-notiz").hidden = !a.notiz;
    $("#d-notiz").textContent = a.notiz;

    var p = a.personId ? Familie.person(a.personId) : null;
    $("#d-erinnerung").textContent = a.vorlaufTage
      ? "✅ " + (a.vorlaufTage >= 7 && a.vorlaufTage % 7 === 0 ? a.vorlaufTage / 7 + (a.vorlaufTage === 7 ? " Woche" : " Wochen") : a.vorlaufTage + " Tage")
        + " vorher steht „Geschenk besorgen“ in den Aufgaben" + (p ? " (für " + p.name + ")." : ".")
      : "Keine Erinnerung in den Aufgaben.";

    var aktuell = $("#d-ideen");
    var frueher = $("#d-frueher-liste");
    aktuell.innerHTML = "";
    frueher.innerHTML = "";
    var ideen = a.ideen.map(function (i) { return { i: i, st: Anlaesse.ideeStatus(a, i) }; });
    var jetzt = ideen.filter(function (x) { return x.st.status !== "verschenkt"; })
      .sort(function (x, y) { return (x.st.status === "gekauft" ? 0 : 1) - (y.st.status === "gekauft" ? 0 : 1); });
    var alt = ideen.filter(function (x) { return x.st.status === "verschenkt"; })
      .sort(function (x, y) { return y.st.jahr - x.st.jahr; });
    if (!jetzt.length) aktuell.appendChild(el("p", { class: "leise", text: "Noch keine Ideen. Was hat " + (a.name || "sie oder er") + " zuletzt erwähnt?" }));
    jetzt.forEach(function (x) { aktuell.appendChild(ideeZeile(a, x.i, x.st)); });
    $("#d-frueher").hidden = !alt.length;
    alt.forEach(function (x) { frueher.appendChild(ideeZeile(a, x.i, x.st)); });
  }

  $("#idee-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var feld = ev.target.elements.text;
    if (Anlaesse.ideeHinzufuegen(offenId, feld.value)) {
      feld.value = "";
      zeichnen();
    }
    feld.focus();
  });
  $("#d-schliessen").addEventListener("click", function () { detail.close(); });
  $("#d-bearbeiten").addEventListener("click", function () { formularOeffnen(Anlaesse.holen(offenId)); });
  detail.addEventListener("close", function () { offenId = null; });

  /* ---------- Formular ---------- */

  (function auswahlFuellen() {
    var tag = form.elements.tagZahl;
    for (var t = 1; t <= 31; t++) tag.appendChild(el("option", { value: String(t).padStart(2, "0"), text: t + "." }));
    var monat = form.elements.monat;
    Anlaesse.MONATE.forEach(function (m, i) { monat.appendChild(el("option", { value: String(i + 1).padStart(2, "0"), text: m })); });
  })();

  function artUmschalten() {
    var art = form.elements.art.value;
    $("#f-titel-feld").hidden = art !== "sonstiges";
    $("#f-name-label").textContent = art === "jahrestag" ? "Wessen Jahrestag?" : art === "sonstiges" ? "Für wen? (optional)" : "Wer?";
    form.elements.name.required = art !== "sonstiges";
    form.elements.titel.required = art === "sonstiges";
    form.elements.jahr.placeholder = art === "geburtstag" ? "Geburtsjahr (optional)" : "seit (optional)";
  }
  form.elements.art.addEventListener("change", artUmschalten);

  function formularOeffnen(a) {
    var f = form.elements;
    form.reset();
    $("#formular-titel").textContent = a ? "Bearbeiten" : "Neuer Geburtstag oder Anlass";
    $("#loeschen").hidden = !a;
    f.id.value = a ? a.id : "";
    f.art.value = a ? a.art : "geburtstag";
    f.titel.value = a ? a.titel : "";
    f.name.value = a ? a.name : "";
    var heute = Familie.heute();
    f.monat.value = a ? a.tag.slice(0, 2) : heute.slice(5, 7);
    f.tagZahl.value = a ? a.tag.slice(3, 5) : heute.slice(8, 10);
    f.jahr.value = a && a.jahr ? a.jahr : "";
    f.vorlaufTage.value = String(a ? a.vorlaufTage : 14);
    if (!f.vorlaufTage.value) f.vorlaufTage.value = "14";
    f.notiz.value = a ? a.notiz : "";

    var sel = f.personId;
    sel.innerHTML = "";
    sel.appendChild(el("option", { value: "", text: "egal / alle" }));
    Familie.personen().forEach(function (p) { sel.appendChild(el("option", { value: p.id, text: p.name })); });
    sel.value = a && a.personId ? a.personId : "";

    var namen = $("#namen");
    namen.innerHTML = "";
    Familie.personen().forEach(function (p) { namen.appendChild(el("option", { value: p.name })); });

    artUmschalten();
    formDialog.showModal();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var tag = f.monat.value + "-" + f.tagZahl.value;
    // 31.04. o. Ä. gibt es nicht
    var maxTag = new Date(2024, parseInt(f.monat.value, 10), 0).getDate();
    if (parseInt(f.tagZahl.value, 10) > maxTag) { hinweis("Den " + parseInt(f.tagZahl.value, 10) + ". " + Anlaesse.MONATE[parseInt(f.monat.value, 10) - 1] + " gibt es nicht."); return; }
    var a = Anlaesse.speichern({
      id: f.id.value || undefined,
      art: f.art.value,
      titel: f.titel.value,
      name: f.name.value,
      tag: tag,
      jahr: f.jahr.value,
      vorlaufTage: f.vorlaufTage.value,
      personId: f.personId.value || null,
      notiz: f.notiz.value.trim()
    });
    formDialog.close();
    zeichnen();
    if (!f.id.value) {
      hinweis("Gespeichert. Jetzt Geschenkideen sammeln.");
      detailOeffnen(a.id);
    } else if (detail.open) {
      detailZeichnen();
    }
  });

  $("#abbrechen").addEventListener("click", function () { formDialog.close(); });
  $("#loeschen").addEventListener("click", function () {
    var id = form.elements.id.value;
    var a = Anlaesse.holen(id);
    if (!a || !confirm(Anlaesse.titel(a) + " mit allen Ideen löschen?")) return;
    Anlaesse.loeschen(id);
    formDialog.close();
    if (detail.open) detail.close();
    zeichnen();
  });
  $("#neu").addEventListener("click", function () { formularOeffnen(null); });

  window.addEventListener("storage", zeichnen);
  window.addEventListener("familie:aktualisiert", zeichnen);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) zeichnen(); });

  zeichnen();
  // Direktlink "#neu" z. B. von der Startseite
  if (location.hash === "#neu") formularOeffnen(null);
})();
