/*
 * Datenmodell und Wiederholungslogik der Aufgaben- und Routinenliste.
 * Klassisches Script, braucht gemeinsam/familie.js, stellt global `Aufgaben` bereit.
 * Ohne Oberfläche nutzbar, z. B. vom Kalender-Modul über Aufgaben.termineZwischen().
 *
 * Aufgabe:
 * {
 *   id, titel, kategorie,            // kategorie: siehe KATEGORIEN
 *   personId,                        // zuständig (null = alle/offen)
 *   start: "2026-12-01",             // erstes Fälligkeitsdatum
 *   wiederholung: { art, intervall },// art: keine|taeglich|woechentlich|monatlich|jaehrlich
 *   erinnerungTage: 1,               // so viele Tage vorher erscheint sie unter "Bald fällig"
 *   faellig: "2026-12-01",           // nächstes offenes Fälligkeitsdatum (null = abgeschlossen)
 *   notiz,
 *   verlauf: [{ datum, erledigtAm, personId }]
 * }
 */
(function () {
  "use strict";

  var KEY = "familie.aufgaben.v1";

  var KATEGORIEN = {
    haushalt: { name: "Haushalt", symbol: "🏠" },
    muell: { name: "Müll", symbol: "🗑️" },
    arzt: { name: "Arzt", symbol: "🩺" },
    geburtstag: { name: "Geburtstag", symbol: "🎂" },
    schule: { name: "Schule & Kita", symbol: "🎒" },
    sonstiges: { name: "Sonstiges", symbol: "📌" }
  };

  var WIEDERHOLUNG = {
    keine: "einmalig",
    taeglich: "Tag",
    woechentlich: "Woche",
    monatlich: "Monat",
    jaehrlich: "Jahr"
  };

  var VORLAGEN = [
    { titel: "Restmüll rausstellen", kategorie: "muell", wiederholung: { art: "woechentlich", intervall: 2 }, erinnerungTage: 1 },
    { titel: "Gelbe Tonne rausstellen", kategorie: "muell", wiederholung: { art: "woechentlich", intervall: 2 }, erinnerungTage: 1 },
    { titel: "Zahnarzt-Kontrolle", kategorie: "arzt", wiederholung: { art: "monatlich", intervall: 6 }, erinnerungTage: 14 },
    { titel: "Kinderarzt / U-Untersuchung", kategorie: "arzt", wiederholung: { art: "keine", intervall: 1 }, erinnerungTage: 14 },
    { titel: "Geburtstag: ", kategorie: "geburtstag", wiederholung: { art: "jaehrlich", intervall: 1 }, erinnerungTage: 7 },
    { titel: "Elternabend", kategorie: "schule", wiederholung: { art: "keine", intervall: 1 }, erinnerungTage: 2 },
    { titel: "Bettwäsche wechseln", kategorie: "haushalt", wiederholung: { art: "woechentlich", intervall: 2 }, erinnerungTage: 0 },
    { titel: "Pflanzen gießen", kategorie: "haushalt", wiederholung: { art: "woechentlich", intervall: 1 }, erinnerungTage: 0 }
  ];

  /* ---------- Datumsrechnung ---------- */

  function tageImMonat(jahr, monat) {
    return new Date(jahr, monat + 1, 0).getDate();
  }

  /* k-tes Vorkommen ab Start. Monate/Jahre werden am Monatsende gekappt
     (31.01. -> 28./29.02. -> 31.03.), ohne dass sich der Tag verschiebt. */
  function vorkommen(startIso, wdh, k) {
    var s = Familie.ausIso(startIso);
    var n = k * Math.max(1, wdh.intervall || 1);
    switch (wdh.art) {
      case "taeglich":
        return new Date(s.getFullYear(), s.getMonth(), s.getDate() + n);
      case "woechentlich":
        return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7 * n);
      case "monatlich":
      case "jaehrlich": {
        var monate = wdh.art === "monatlich" ? n : 12 * n;
        var gesamt = s.getMonth() + monate;
        var jahr = s.getFullYear() + Math.floor(gesamt / 12);
        var monat = ((gesamt % 12) + 12) % 12;
        return new Date(jahr, monat, Math.min(s.getDate(), tageImMonat(jahr, monat)));
      }
      default:
        return k === 0 ? s : null;
    }
  }

  /* Erstes Vorkommen, das strikt nach (oder mit inklusiv=true: am/nach) dem Datum liegt. */
  function vorkommenAb(a, abIso, inklusiv) {
    if (a.wiederholung.art === "keine") {
      var ok = inklusiv ? a.start >= abIso : a.start > abIso;
      return ok ? a.start : null;
    }
    // grob überspringen, dann schrittweise
    var k = 0;
    var abstandTage = (Familie.ausIso(abIso) - Familie.ausIso(a.start)) / 86400000;
    if (abstandTage > 0) {
      var schritt = { taeglich: 1, woechentlich: 7, monatlich: 28, jaehrlich: 365 }[a.wiederholung.art];
      k = Math.max(0, Math.floor(abstandTage / (schritt * Math.max(1, a.wiederholung.intervall))) - 1);
    }
    for (var i = 0; i < 1000; i++, k++) {
      var d = Familie.isoDatum(vorkommen(a.start, a.wiederholung, k));
      if (inklusiv ? d >= abIso : d > abIso) return d;
    }
    return null;
  }

  function tageBis(iso) {
    return Math.round((Familie.ausIso(iso) - Familie.ausIso(Familie.heute())) / 86400000);
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
    return {
      id: a.id || Familie.id(),
      titel: String(a.titel || "").trim() || "Ohne Titel",
      kategorie: KATEGORIEN[a.kategorie] ? a.kategorie : "sonstiges",
      personId: a.personId || null,
      start: a.start || Familie.heute(),
      wiederholung: {
        art: WIEDERHOLUNG[a.wiederholung && a.wiederholung.art] ? a.wiederholung.art : "keine",
        intervall: Math.max(1, parseInt(a.wiederholung && a.wiederholung.intervall, 10) || 1)
      },
      erinnerungTage: Math.max(0, parseInt(a.erinnerungTage, 10) || 0),
      faellig: a.faellig === undefined ? a.start || Familie.heute() : a.faellig,
      notiz: a.notiz || "",
      verlauf: a.verlauf || []
    };
  }

  /* Neu anlegen oder aktualisieren. Bei geändertem Start/Rhythmus wird
     das nächste Fälligkeitsdatum ab heute neu berechnet. */
  function speichern(eingabe) {
    var liste = alle();
    var alt = eingabe.id ? liste.find(function (x) { return x.id === eingabe.id; }) : null;
    var a = normalisieren(Object.assign({}, alt || {}, eingabe));
    if (!alt || alt.start !== a.start || alt.wiederholung.art !== a.wiederholung.art ||
        alt.wiederholung.intervall !== a.wiederholung.intervall) {
      // Wiederkehrend: nächster Termin ab heute. Einmalig: das gewählte Datum, auch in der Vergangenheit.
      a.faellig = a.wiederholung.art === "keine" ? a.start : vorkommenAb(a, Familie.heute(), true);
    }
    if (alt) {
      liste[liste.indexOf(alt)] = a;
    } else {
      liste.push(a);
    }
    alleSpeichern(liste);
    return a;
  }

  function loeschen(id) {
    alleSpeichern(alle().filter(function (a) { return a.id !== id; }));
  }

  /* Abhaken: Verlauf ergänzen, bei Routinen auf den nächsten Termin springen. */
  function erledigen(id, personId) {
    var liste = alle();
    var a = liste.find(function (x) { return x.id === id; });
    if (!a || !a.faellig) return null;
    a.verlauf.push({ datum: a.faellig, erledigtAm: Familie.heute(), personId: personId || a.personId || null });
    if (a.verlauf.length > 50) a.verlauf = a.verlauf.slice(-50);
    a.faellig = a.wiederholung.art === "keine" ? null : vorkommenAb(a, a.faellig, false);
    alleSpeichern(liste);
    return a;
  }

  /* Letztes Abhaken rückgängig machen. */
  function rueckgaengig(id) {
    var liste = alle();
    var a = liste.find(function (x) { return x.id === id; });
    if (!a || !a.verlauf.length) return null;
    var letzter = a.verlauf.pop();
    a.faellig = letzter.datum;
    alleSpeichern(liste);
    return a;
  }

  /* Status einer offenen Aufgabe relativ zu heute. */
  function status(a) {
    if (!a.faellig) return "erledigt";
    var t = tageBis(a.faellig);
    if (t < 0) return "ueberfaellig";
    if (t === 0) return "heute";
    if (t <= a.erinnerungTage) return "bald";
    return "spaeter";
  }

  /* Für Kalender & Co.: alle offenen Termine im Zeitraum (inklusive),
     wiederkehrende Aufgaben einzeln aufgefächert. */
  function termineZwischen(vonIso, bisIso) {
    var ergebnis = [];
    alle().forEach(function (a) {
      if (!a.faellig) return;
      var d = a.faellig >= vonIso ? a.faellig : vorkommenAb(a, vonIso, true);
      var n = 0;
      while (d && d <= bisIso && n < 400) {
        ergebnis.push({ titel: a.titel, datum: d, personId: a.personId, kategorie: a.kategorie, aufgabeId: a.id, modul: "aufgaben" });
        d = a.wiederholung.art === "keine" ? null : vorkommenAb(a, d, false);
        n++;
      }
    });
    return ergebnis.sort(function (x, y) { return x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : 0; });
  }

  /* ---------- Kalenderdatei (.ics) für echte Handy-Erinnerungen ---------- */

  function icsText(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function icsDatum(iso) {
    return iso.replace(/-/g, "");
  }

  function ics(liste) {
    var stempel = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var zeilen = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Familie//Aufgaben//DE", "CALSCALE:GREGORIAN"];
    liste.forEach(function (a) {
      if (!a.faellig) return;
      var p = a.personId ? Familie.person(a.personId) : null;
      var ende = Familie.isoDatum(new Date(Familie.ausIso(a.faellig).getTime() + 36 * 3600000));
      zeilen.push("BEGIN:VEVENT",
        "UID:" + a.id + "@familie",
        "DTSTAMP:" + stempel,
        "DTSTART;VALUE=DATE:" + icsDatum(a.faellig),
        "DTEND;VALUE=DATE:" + icsDatum(ende),
        "SUMMARY:" + icsText(a.titel + (p ? " (" + p.name + ")" : "")));
      if (a.notiz) zeilen.push("DESCRIPTION:" + icsText(a.notiz));
      var freq = { taeglich: "DAILY", woechentlich: "WEEKLY", monatlich: "MONTHLY", jaehrlich: "YEARLY" }[a.wiederholung.art];
      if (freq) zeilen.push("RRULE:FREQ=" + freq + ";INTERVAL=" + a.wiederholung.intervall);
      // Erinnerung: X Tage vorher um 18 Uhr (bzw. am Tag selbst um 8 Uhr)
      var trigger = a.erinnerungTage > 0 ? "-P" + (a.erinnerungTage - 1) + "DT6H" : "PT8H";
      zeilen.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(a.titel), "TRIGGER:" + trigger, "END:VALARM", "END:VEVENT");
    });
    zeilen.push("END:VCALENDAR");
    return zeilen.join("\r\n") + "\r\n";
  }

  window.Aufgaben = {
    KATEGORIEN: KATEGORIEN,
    WIEDERHOLUNG: WIEDERHOLUNG,
    VORLAGEN: VORLAGEN,
    alle: alle,
    holen: holen,
    speichern: speichern,
    loeschen: loeschen,
    erledigen: erledigen,
    rueckgaengig: rueckgaengig,
    status: status,
    tageBis: tageBis,
    vorkommenAb: vorkommenAb,
    termineZwischen: termineZwischen,
    ics: ics
  };
})();
