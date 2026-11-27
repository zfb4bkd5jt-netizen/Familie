/*
 * Geburtstage & Anlässe mit Geschenkideen.
 * Klassisches Script, braucht gemeinsam/familie.js. Stellt global `Anlaesse` bereit.
 * Ist aufgaben/aufgaben-daten.js eingebunden, legt jedes Anlass eine jährliche
 * Aufgabe "Geschenk besorgen" an, die rechtzeitig vorher in der Aufgabenliste fällig wird.
 *
 * Key "familie.geburtstage.v1" = [Anlass]
 * Anlass:
 * {
 *   id, name: "Opa Eddy",
 *   art: "geburtstag" | "jahrestag" | "sonstiges",
 *   titel: "",                  // nur bei "sonstiges", z. B. "Muttertag"
 *   tag: "03-12",               // MM-TT, jedes Jahr
 *   jahr: 1951 | null,          // Geburtsjahr bzw. Jahr des Anfangs (fürs Alter), optional
 *   vorlaufTage: 14,            // so viele Tage vorher: Aufgabe "Geschenk besorgen" (0 = keine)
 *   personId: null,             // wer kümmert sich ums Geschenk (null = alle)
 *   notiz: "",                  // z. B. Größen, Wünsche, Adresse
 *   ideen: [{ id, text, gekauftAm: "2026-11-20" | null, erstellt: "2026-11-01" }]
 * }
 * Eine gekaufte Idee gilt nach dem nächsten Anlass als "verschenkt" (abgeleitet, nichts
 * wird umgeschrieben, damit der Abgleich zwischen Handys einfach bleibt).
 */
(function () {
  "use strict";

  var KEY = "familie.geburtstage.v1";
  var AUFGABE_PRAEFIX = "anlass-";

  var ARTEN = {
    geburtstag: { name: "Geburtstag", symbol: "🎂" },
    jahrestag: { name: "Jahrestag", symbol: "💍" },
    sonstiges: { name: "Anlass", symbol: "🎁" }
  };

  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
    "September", "Oktober", "November", "Dezember"];

  /* ---------- Datum ---------- */

  function tageImMonat(jahr, monat0) {
    return new Date(jahr, monat0 + 1, 0).getDate();
  }

  /* Datum des Anlasses in einem bestimmten Jahr. 29.02. -> 28.02. in Nicht-Schaltjahren. */
  function datumImJahr(tag, jahr) {
    var m = parseInt(tag.slice(0, 2), 10) - 1;
    var t = parseInt(tag.slice(3, 5), 10);
    return Familie.isoDatum(new Date(jahr, m, Math.min(t, tageImMonat(jahr, m))));
  }

  /* Nächstes Datum am oder nach abIso (Standard: heute). */
  function naechstesDatum(a, abIso) {
    abIso = abIso || Familie.heute();
    var j = Familie.ausIso(abIso).getFullYear();
    var d = datumImJahr(a.tag, j);
    return d >= abIso ? d : datumImJahr(a.tag, j + 1);
  }

  /* Letztes Datum vor abIso (Standard: heute), also der zuletzt vergangene Anlass. */
  function letztesDatum(a, abIso) {
    abIso = abIso || Familie.heute();
    var j = Familie.ausIso(abIso).getFullYear();
    var d = datumImJahr(a.tag, j);
    return d < abIso ? d : datumImJahr(a.tag, j - 1);
  }

  function tageBis(iso, abIso) {
    return Math.round((Familie.ausIso(iso) - Familie.ausIso(abIso || Familie.heute())) / 86400000);
  }

  function plusTage(iso, n) {
    var d = Familie.ausIso(iso);
    return Familie.isoDatum(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  }

  /* Wie alt / wie viele Jahre am nächsten Anlass (null, wenn Jahr unbekannt). */
  function wievielte(a, abIso) {
    if (!a.jahr) return null;
    return Familie.ausIso(naechstesDatum(a, abIso)).getFullYear() - a.jahr;
  }

  function tagText(tag) {
    return parseInt(tag.slice(3, 5), 10) + ". " + MONATE[parseInt(tag.slice(0, 2), 10) - 1];
  }

  function titel(a) {
    if (a.art === "geburtstag") return "Geburtstag " + a.name;
    if (a.art === "jahrestag") return "Jahrestag " + a.name;
    return (a.titel || "Anlass") + (a.name ? " " + a.name : "");
  }

  /* ---------- Ideen ---------- */

  /* "offen" | "gekauft" | "verschenkt" (+ Jahr) – abgeleitet aus gekauftAm und dem Datum. */
  function ideeStatus(a, idee, abIso) {
    if (!idee.gekauftAm) return { status: "offen" };
    var letztes = letztesDatum(a, abIso);
    if (idee.gekauftAm <= letztes) return { status: "verschenkt", jahr: Familie.ausIso(letztes).getFullYear() };
    return { status: "gekauft" };
  }

  /* ---------- Speicher ---------- */

  function alle() {
    return Familie.laden(KEY, []);
  }

  function alleSpeichern(liste) {
    Familie.speichern(KEY, liste);
  }

  function holen(id) {
    return alle().find(function (a) { return a.id === id; }) || null;
  }

  function normalisieren(a) {
    var tag = /^\d{2}-\d{2}$/.test(a.tag || "") ? a.tag : "01-01";
    var jahr = parseInt(a.jahr, 10);
    return {
      id: a.id || Familie.id(),
      name: String(a.name || "").trim(),
      art: ARTEN[a.art] ? a.art : "geburtstag",
      titel: a.art === "sonstiges" ? String(a.titel || "").trim() : "",
      tag: tag,
      jahr: jahr > 1900 && jahr < 2200 ? jahr : null,
      vorlaufTage: Math.max(0, Math.min(90, parseInt(a.vorlaufTage, 10) || 0)),
      personId: a.personId || null,
      notiz: a.notiz || "",
      ideen: Array.isArray(a.ideen) ? a.ideen : []
    };
  }

  /* Neu anlegen oder aktualisieren; hält die Erinnerungs-Aufgabe passend. */
  function speichern(eingabe) {
    var liste = alle();
    var alt = eingabe.id ? liste.find(function (x) { return x.id === eingabe.id; }) : null;
    var a = normalisieren(Object.assign({}, alt || {}, eingabe));
    if (alt) liste[liste.indexOf(alt)] = a; else liste.push(a);
    alleSpeichern(liste);
    erinnerungAbgleichen(a);
    return a;
  }

  function loeschen(id) {
    alleSpeichern(alle().filter(function (a) { return a.id !== id; }));
    if (window.Aufgaben && Aufgaben.holen(AUFGABE_PRAEFIX + id)) Aufgaben.loeschen(AUFGABE_PRAEFIX + id);
  }

  function aendern(id, fn) {
    var liste = alle();
    var a = liste.find(function (x) { return x.id === id; });
    if (!a) return null;
    fn(a);
    alleSpeichern(liste);
    return a;
  }

  function ideeHinzufuegen(anlassId, text) {
    text = String(text || "").trim();
    if (!text) return null;
    var idee = { id: Familie.id(), text: text, gekauftAm: null, erstellt: Familie.heute() };
    aendern(anlassId, function (a) { a.ideen.push(idee); });
    return idee;
  }

  function ideeAendern(anlassId, ideeId, felder) {
    var a = aendern(anlassId, function (a) {
      var i = a.ideen.find(function (x) { return x.id === ideeId; });
      if (i) Object.assign(i, felder);
    });
    if (a && felder.gekauftAm) erinnerungErledigen(a);
    return a;
  }

  function ideeLoeschen(anlassId, ideeId) {
    return aendern(anlassId, function (a) {
      a.ideen = a.ideen.filter(function (x) { return x.id !== ideeId; });
    });
  }

  /* ---------- Erinnerung als Aufgabe ---------- */

  function kurzDatum(tag) {
    return parseInt(tag.slice(3, 5), 10) + "." + parseInt(tag.slice(0, 2), 10) + ".";
  }

  function aufgabenTitel(a) {
    if (a.art === "geburtstag") return "Geschenk für " + a.name + " (Geburtstag " + kurzDatum(a.tag) + ")";
    if (a.art === "jahrestag") return "Geschenk zum Jahrestag " + a.name + " (" + kurzDatum(a.tag) + ")";
    return "Geschenk: " + titel(a) + " (" + kurzDatum(a.tag) + ")";
  }

  /* Geschenk gekauft -> "Geschenk besorgen" für dieses Mal abhaken, falls schon fällig. */
  function erinnerungErledigen(a) {
    if (!window.Aufgaben) return;
    var auf = Aufgaben.holen(AUFGABE_PRAEFIX + a.id);
    if (!auf || !auf.faellig) return;
    if (auf.faellig <= naechstesDatum(a) && Aufgaben.status(auf) !== "spaeter") Aufgaben.erledigen(auf.id);
  }

  /* Pro Anlass eine jährliche Aufgabe mit fester id "anlass-<id>", damit zwei Handys
     nicht doppelt anlegen. Fällig vorlaufTage vor dem Anlass, erscheint 7 Tage vorher
     unter "Bald fällig". Liegt der Termin schon hinter uns, der Anlass aber noch
     vor uns (z. B. gerade erst eingetragen), ist sie ab heute fällig. */
  function erinnerungAbgleichen(a) {
    if (!window.Aufgaben) return null;
    var aid = AUFGABE_PRAEFIX + a.id;
    var vorhanden = Aufgaben.holen(aid);
    if (!a.vorlaufTage) {
      if (vorhanden) Aufgaben.loeschen(aid);
      return null;
    }
    var heute = Familie.heute();
    var anlass = naechstesDatum(a, heute);
    var start = plusTage(anlass, -a.vorlaufTage);
    var p = a.personId ? Familie.person(a.personId) : null;
    var daten = {
      id: aid,
      titel: aufgabenTitel(a),
      kategorie: "geburtstag",
      personId: p ? p.id : null,
      start: start,
      wiederholung: { art: "jaehrlich", intervall: 1 },
      erinnerungTage: Math.min(7, a.vorlaufTage),
      notiz: "Ideen stehen unter Geburtstage & Geschenke."
    };
    // Nur neu berechnen, wenn sich Termin oder Vorlauf geändert haben; sonst bliebe
    // ein schon abgehaktes "Geschenk besorgen" nicht abgehakt.
    var gleicherTermin = vorhanden && vorhanden.start && vorhanden.start.slice(5) === start.slice(5);
    if (gleicherTermin) daten.start = vorhanden.start;
    var aufgabe = Aufgaben.speichern(daten);
    if (!gleicherTermin && start < heute) {
      aufgabe = Aufgaben.speichern({ id: aid, faellig: heute });
    }
    return aufgabe;
  }

  /* ---------- Abfragen ---------- */

  /* Alle Anlässe, sortiert nach dem nächsten Datum, mit berechneten Feldern. */
  function demnaechst(abIso) {
    abIso = abIso || Familie.heute();
    return alle().map(function (a) {
      var d = naechstesDatum(a, abIso);
      return { anlass: a, datum: d, tage: tageBis(d, abIso), wievielte: wievielte(a, abIso) };
    }).sort(function (x, y) { return x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : 0; });
  }

  /* Für Kalender/Heute-Ansicht: Anlässe im Zeitraum (inklusive). */
  function termineZwischen(vonIso, bisIso) {
    var ergebnis = [];
    alle().forEach(function (a) {
      var d = naechstesDatum(a, vonIso);
      while (d <= bisIso) {
        ergebnis.push({ titel: titel(a), datum: d, art: a.art, anlassId: a.id, modul: "geburtstage" });
        d = naechstesDatum(a, plusTage(d, 1));
      }
    });
    return ergebnis.sort(function (x, y) { return x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : 0; });
  }

  window.Anlaesse = {
    KEY: KEY,
    ARTEN: ARTEN,
    MONATE: MONATE,
    alle: alle,
    holen: holen,
    speichern: speichern,
    loeschen: loeschen,
    ideeHinzufuegen: ideeHinzufuegen,
    ideeAendern: ideeAendern,
    ideeLoeschen: ideeLoeschen,
    ideeStatus: ideeStatus,
    naechstesDatum: naechstesDatum,
    letztesDatum: letztesDatum,
    wievielte: wievielte,
    tagText: tagText,
    titel: titel,
    demnaechst: demnaechst,
    termineZwischen: termineZwischen,
    erinnerungAbgleichen: erinnerungAbgleichen
  };
})();
