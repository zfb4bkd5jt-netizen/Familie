/* Oberfläche der Aufgaben- und Routinenliste. */
(function () {
  "use strict";

  var FILTER_KEY = "familie.aufgaben.geraet.filter";
  var MELDUNG_KEY = "familie.aufgaben.geraet.letzteMeldung";
  var filter = Familie.laden(FILTER_KEY, "alle");

  var $ = function (sel) { return document.querySelector(sel); };
  var liste = $("#liste");
  var formDialog = $("#formular-dialog");
  var form = $("#formular");
  var einstellungen = $("#einstellungen");

  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kinder || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  /* ---------- Anzeige ---------- */

  var WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function datumText(iso) {
    var t = Aufgaben.tageBis(iso);
    if (t === 0) return "heute";
    if (t === 1) return "morgen";
    if (t === -1) return "gestern";
    if (t < 0) return "seit " + -t + " Tagen";
    var d = Familie.ausIso(iso);
    var kurz = WOCHENTAGE[d.getDay()] + ", " + d.getDate() + "." + (d.getMonth() + 1) + ".";
    if (d.getFullYear() !== new Date().getFullYear()) kurz += d.getFullYear();
    return t < 7 ? kurz : kurz + " (in " + t + " Tagen)";
  }

  function rhythmusText(w) {
    if (w.art === "keine") return "";
    var einheit = Aufgaben.WIEDERHOLUNG[w.art];
    if (w.intervall === 1) return "🔁 " + { Tag: "jeden Tag", Woche: "jede Woche", Monat: "jeden Monat", Jahr: "jedes Jahr" }[einheit];
    var mehrzahl = { Tag: "Tage", Woche: "Wochen", Monat: "Monate", Jahr: "Jahre" }[einheit];
    return "🔁 alle " + w.intervall + " " + mehrzahl;
  }

  function personChip(pid) {
    var p = pid ? Familie.person(pid) : null;
    var chip = el("span", { class: "chip" });
    if (p) {
      chip.appendChild(el("span", { class: "person-punkt", style: "background:" + p.farbe }));
      chip.appendChild(document.createTextNode(p.name));
    } else {
      chip.textContent = "alle";
    }
    return chip;
  }

  function aufgabeKarte(a) {
    var st = Aufgaben.status(a);
    var kat = Aufgaben.KATEGORIEN[a.kategorie];
    var meta = el("div", { class: "meta" }, [
      el("span", { class: st === "ueberfaellig" ? "warn" : "", text: a.faellig ? datumText(a.faellig) : "erledigt" }),
      personChip(a.personId),
      rhythmusText(a.wiederholung) ? el("span", { text: rhythmusText(a.wiederholung) }) : null
    ]);
    var haken = st === "erledigt"
      ? el("button", { class: "haken", "aria-label": "Wieder öffnen", title: "Wieder öffnen", text: "↺", onclick: function () { Aufgaben.rueckgaengig(a.id); zeichnen(); } })
      : el("button", { class: "haken", "aria-label": "Erledigt: " + a.titel, title: "Erledigt", text: "✓", onclick: function () { abhaken(a); } });
    return el("div", { class: "karte aufgabe " + st }, [
      haken,
      el("div", { class: "text", onclick: function () { formularOeffnen(a); } }, [
        el("div", { class: "titel", text: kat.symbol + " " + a.titel }),
        meta
      ])
    ]);
  }

  function passtZumFilter(a) {
    if (filter === "alle") return true;
    if (filter === "offen") return !a.personId;
    return a.personId === filter;
  }

  function filterZeichnen() {
    var box = $("#filter");
    box.innerHTML = "";
    var optionen = [{ id: "alle", name: "Alle" }].concat(Familie.personen(), [{ id: "offen", name: "Ohne Zuständige" }]);
    if (optionen.length === 2) { box.hidden = true; return; }
    box.hidden = false;
    optionen.forEach(function (o) {
      box.appendChild(el("button", {
        "aria-pressed": String(filter === o.id), text: o.name,
        onclick: function () { filter = o.id; Familie.speichern(FILTER_KEY, filter); zeichnen(); }
      }));
    });
  }

  function zeichnen() {
    if (filter !== "alle" && filter !== "offen" && !Familie.person(filter)) filter = "alle";
    filterZeichnen();
    var alle = Aufgaben.alle().filter(passtZumFilter);
    var gruppen = { ueberfaellig: [], heute: [], bald: [], spaeter: [], erledigt: [] };
    alle.forEach(function (a) { gruppen[Aufgaben.status(a)].push(a); });
    Object.keys(gruppen).forEach(function (g) {
      gruppen[g].sort(function (x, y) { return (x.faellig || "") < (y.faellig || "") ? -1 : 1; });
    });
    // nur die letzten erledigten Einmal-Aufgaben zeigen
    gruppen.erledigt = gruppen.erledigt.slice(-5).reverse();

    liste.innerHTML = "";
    if (!Aufgaben.alle().length) {
      liste.appendChild(el("div", { class: "leer" }, [
        el("p", { text: "Noch nichts eingetragen. Fang mit dem an, was dir gerade im Kopf herumschwirrt: Müll, Arzttermine, Geburtstage, Elternabende." }),
        el("button", { class: "knopf", text: "Erste Aufgabe anlegen", onclick: function () { formularOeffnen(null); } })
      ]));
      return;
    }
    var titel = { ueberfaellig: "Überfällig", heute: "Heute", bald: "Bald fällig", spaeter: "Später", erledigt: "Zuletzt erledigt" };
    var irgendwas = false;
    Object.keys(titel).forEach(function (g) {
      if (!gruppen[g].length) return;
      irgendwas = true;
      liste.appendChild(el("h2", { text: titel[g] + " (" + gruppen[g].length + ")" }));
      gruppen[g].forEach(function (a) { liste.appendChild(aufgabeKarte(a)); });
    });
    if (!irgendwas) liste.appendChild(el("p", { class: "leer", text: "Für diese Auswahl gibt es nichts zu tun. 🎉" }));
  }

  /* ---------- Abhaken mit Rückgängig ---------- */

  var hinweisTimer;
  function hinweis(text, aktion) {
    var h = $("#hinweis");
    h.innerHTML = "";
    h.appendChild(el("span", { text: text }));
    if (aktion) h.appendChild(el("button", { text: aktion.text, onclick: function () { aktion.fn(); h.hidden = true; } }));
    h.hidden = false;
    clearTimeout(hinweisTimer);
    hinweisTimer = setTimeout(function () { h.hidden = true; }, 5000);
  }

  function abhaken(a) {
    var neu = Aufgaben.erledigen(a.id);
    zeichnen();
    var text = neu && neu.faellig ? "Erledigt. Nächstes Mal: " + datumText(neu.faellig) : "Erledigt.";
    hinweis(text, { text: "Rückgängig", fn: function () { Aufgaben.rueckgaengig(a.id); zeichnen(); } });
  }

  /* ---------- Formular ---------- */

  function optionenFuellen() {
    var kat = form.elements.kategorie;
    kat.innerHTML = "";
    Object.keys(Aufgaben.KATEGORIEN).forEach(function (k) {
      var info = Aufgaben.KATEGORIEN[k];
      kat.appendChild(el("option", { value: k, text: info.symbol + " " + info.name }));
    });
    var per = form.elements.personId;
    per.innerHTML = "";
    per.appendChild(el("option", { value: "", text: "alle / offen" }));
    Familie.personen().forEach(function (p) { per.appendChild(el("option", { value: p.id, text: p.name })); });
  }

  function einheitAktualisieren() {
    var art = form.elements.art.value;
    var n = parseInt(form.elements.intervall.value, 10) || 1;
    var mehr = { taeglich: "Tage", woechentlich: "Wochen", monatlich: "Monate", jaehrlich: "Jahre" };
    var eins = { taeglich: "Tag", woechentlich: "Woche", monatlich: "Monat", jaehrlich: "Jahr" };
    form.querySelector("label.inline").style.visibility = art === "keine" ? "hidden" : "visible";
    $("#einheit").textContent = art === "keine" ? "" : n === 1 ? eins[art] : mehr[art];
  }

  function werteSetzen(a) {
    var f = form.elements;
    f.id.value = a.id || "";
    f.titel.value = a.titel || "";
    f.kategorie.value = a.kategorie || "sonstiges";
    f.personId.value = a.personId || "";
    f.start.value = a.start || Familie.heute();
    f.art.value = (a.wiederholung && a.wiederholung.art) || "keine";
    f.intervall.value = (a.wiederholung && a.wiederholung.intervall) || 1;
    f.erinnerungTage.value = a.erinnerungTage !== undefined ? a.erinnerungTage : 1;
    f.notiz.value = a.notiz || "";
    einheitAktualisieren();
  }

  var gezeigtesDatum = null;

  function formularOeffnen(a) {
    gezeigtesDatum = a ? a.faellig || a.start : null;
    optionenFuellen();
    $("#formular-titel").textContent = a ? "Bearbeiten" : "Neue Aufgabe";
    $("#loeschen").hidden = !a;
    var vorlagen = $("#vorlagen");
    vorlagen.innerHTML = "";
    if (!a) {
      Aufgaben.VORLAGEN.forEach(function (v) {
        vorlagen.appendChild(el("button", {
          type: "button", text: Aufgaben.KATEGORIEN[v.kategorie].symbol + " " + v.titel.replace(/: $/, ""),
          onclick: function () {
            werteSetzen(Object.assign({}, v, { start: form.elements.start.value }));
            form.elements.titel.focus();
            var t = form.elements.titel; t.setSelectionRange(t.value.length, t.value.length);
          }
        }));
      });
    }
    // Bei bestehenden Aufgaben das nächste Fälligkeitsdatum anzeigen, damit
    // man einen einzelnen Termin direkt verschieben kann.
    werteSetzen(a ? Object.assign({}, a, { start: a.faellig || a.start }) : {});
    formDialog.showModal();
    if (!a) form.elements.titel.focus();
  }

  form.elements.art.addEventListener("change", einheitAktualisieren);
  form.elements.intervall.addEventListener("input", einheitAktualisieren);
  $("#abbrechen").addEventListener("click", function () { formDialog.close(); });
  $("#neu").addEventListener("click", function () { formularOeffnen(null); });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var alt = f.id.value ? Aufgaben.holen(f.id.value) : null;
    // Datum nicht angefasst -> Start und nächsten Termin unverändert lassen
    var start = alt && f.start.value === gezeigtesDatum ? alt.start : f.start.value;
    Aufgaben.speichern({
      id: f.id.value || undefined,
      titel: f.titel.value,
      kategorie: f.kategorie.value,
      personId: f.personId.value || null,
      start: start,
      wiederholung: { art: f.art.value, intervall: f.intervall.value },
      erinnerungTage: f.erinnerungTage.value,
      notiz: f.notiz.value
    });
    formDialog.close();
    zeichnen();
  });

  $("#loeschen").addEventListener("click", function () {
    var id = form.elements.id.value;
    var a = Aufgaben.holen(id);
    if (!a) return;
    Aufgaben.loeschen(id);
    formDialog.close();
    zeichnen();
    hinweis("„" + a.titel + "“ gelöscht.", {
      text: "Rückgängig",
      fn: function () {
        var l = Aufgaben.alle(); l.push(a); Familie.speichern("familie.aufgaben.v1", l); zeichnen();
      }
    });
  });

  /* ---------- Einstellungen ---------- */

  function personenZeichnen() {
    var box = $("#personen-liste");
    box.innerHTML = "";
    var ps = Familie.personen();
    if (!ps.length) box.appendChild(el("p", { class: "leise", text: "Trag ein, wer zur Familie gehört. Dann kannst du Aufgaben zuweisen und filtern." }));
    ps.forEach(function (p) {
      box.appendChild(el("div", { class: "person" }, [
        el("span", {}, [el("span", { class: "person-punkt", style: "background:" + p.farbe }), document.createTextNode(p.name)]),
        el("button", {
          class: "knopf zweit klein", text: "Entfernen", onclick: function () {
            Familie.personEntfernen(p.id);
            // Zuständigkeiten dieser Person werden "alle / offen"
            Aufgaben.alle().forEach(function (a) { if (a.personId === p.id) Aufgaben.speichern({ id: a.id, personId: null }); });
            personenZeichnen(); zeichnen();
          }
        })
      ]));
    });
  }

  $("#einstellungen-oeffnen").addEventListener("click", function (ev) {
    ev.preventDefault();
    personenZeichnen();
    benachrichtigungKnopf();
    einstellungen.showModal();
  });
  $("#einstellungen-schliessen").addEventListener("click", function () { einstellungen.close(); });

  $("#person-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = ev.target.elements.name.value.trim();
    if (!name) return;
    Familie.personHinzufuegen(name);
    ev.target.reset();
    personenZeichnen(); zeichnen();
  });

  $("#export").addEventListener("click", function () { Familie.exportHerunterladen(); });
  $("#import").addEventListener("change", function (ev) {
    var datei = ev.target.files[0];
    if (!datei) return;
    datei.text().then(function (t) {
      Familie.importieren(JSON.parse(t));
      personenZeichnen(); zeichnen();
      hinweis("Sicherung eingespielt.");
    }).catch(function (e) {
      hinweis("Import fehlgeschlagen: " + e.message);
    });
    ev.target.value = "";
  });

  $("#ics-export").addEventListener("click", function () {
    var offen = Aufgaben.alle().filter(function (a) { return a.faellig; });
    if (!offen.length) { hinweis("Keine offenen Aufgaben."); return; }
    var blob = new Blob([Aufgaben.ics(offen)], { type: "text/calendar" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "familie-aufgaben.ics";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* ---------- Erinnerung beim Öffnen ---------- */

  function benachrichtigungKnopf() {
    var k = $("#benachrichtigung");
    if (!("Notification" in window)) { k.hidden = true; return; }
    k.disabled = Notification.permission !== "default";
    k.textContent = Notification.permission === "granted" ? "🔔 Hinweise beim Öffnen sind an"
      : Notification.permission === "denied" ? "🔕 Hinweise im Browser blockiert" : "🔔 Hinweise beim Öffnen erlauben";
  }
  $("#benachrichtigung").addEventListener("click", function () {
    Notification.requestPermission().then(function () { benachrichtigungKnopf(); erinnern(true); });
  });

  function erinnern(erzwingen) {
    var faellig = Aufgaben.alle().filter(function (a) {
      var s = Aufgaben.status(a); return s === "ueberfaellig" || s === "heute" || s === "bald";
    });
    if (!faellig.length) return;
    if (!erzwingen && Familie.laden(MELDUNG_KEY, "") === Familie.heute()) return;
    Familie.speichern(MELDUNG_KEY, Familie.heute());
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Familie: " + faellig.length + " Aufgabe" + (faellig.length > 1 ? "n" : "") + " anstehend", {
          body: faellig.slice(0, 4).map(function (a) { return "• " + a.titel; }).join("\n")
        });
      } catch (e) { /* manche Handy-Browser erlauben das nur über einen Service Worker */ }
    }
  }

  window.addEventListener("storage", zeichnen);
  window.addEventListener("familie:aktualisiert", function () { zeichnen(); if (einstellungen.open) personenZeichnen(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { zeichnen(); erinnern(false); } });

  zeichnen();
  erinnern(false);
})();
