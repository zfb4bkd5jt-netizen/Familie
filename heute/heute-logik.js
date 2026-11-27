/*
 * Heute-Ansicht: reine Logik ohne DOM, damit sie auch in Node getestet werden kann.
 * Klassisches Script, stellt global `HeuteLogik` bereit.
 */
(function (global) {
  "use strict";

  /* Schulferien NRW: an diesen Tagen keine Schul-Hinweise (inklusive). */
  var FERIEN = [
    ["2026-12-23", "2027-01-06"]   // Weihnachtsferien
  ];

  /* Wiederkehrende Hinweise für die Familie.
     wochentage: 0 = So, 1 = Mo … 6 = Sa. bis: Stundenplan gilt bis dahin (1. Halbjahr).
     googleTitel: steht so ein Termin schon im Google Kalender, wird der Hinweis nicht doppelt gezeigt. */
  var HINWEISE = [
    {
      id: "benno-sport",
      symbol: "🎽",
      text: "Benno hat Sport: Sportzeug mitgeben",
      wochentage: [1, 4],
      bis: "2027-02-05",
      schule: true,
      googleTitel: /sportzeug/i
    }
  ];

  function wochentag(iso) {
    var t = iso.split("-").map(Number);
    return new Date(t[0], t[1] - 1, t[2]).getDay();
  }

  function inFerien(iso) {
    return FERIEN.some(function (f) { return iso >= f[0] && iso <= f[1]; });
  }

  /* Hinweise, die am Tag gelten. */
  function hinweise(iso, googleTermine, liste) {
    var g = googleTermine || [];
    return (liste || HINWEISE).filter(function (h) {
      if (h.wochentage.indexOf(wochentag(iso)) < 0) return false;
      if (h.bis && iso > h.bis) return false;
      if (h.schule && inFerien(iso)) return false;
      if (h.googleTitel && g.some(function (t) { return h.googleTitel.test(t.titel); })) return false;
      return true;
    });
  }

  /* Essen des Tages aus dem Essensplan ({gerichte, plan}). */
  function essen(daten, iso) {
    if (!daten || !daten.plan || !daten.plan[iso]) return [];
    var gerichte = daten.gerichte || [];
    var e = daten.plan[iso];
    return [["mittag", "Mittag"], ["abend", "Abend"]].map(function (m) {
      var g = e[m[0]] && gerichte.find(function (x) { return x.id === e[m[0]]; });
      return g ? { mahlzeit: m[1], name: g.name, schnell: !!g.schnell } : null;
    }).filter(Boolean);
  }

  /* Termine des Tages: ganztägige zuerst, dann nach Uhrzeit. Doppelte (gleicher Termin in zwei Kalendern) nur einmal. */
  function termine(liste, iso) {
    var gesehen = {};
    return (liste || []).filter(function (t) {
      if (t.datum !== iso) return false;
      var k = t.titel + "|" + (t.uhrzeit || "");
      if (gesehen[k]) return false;
      gesehen[k] = true;
      return true;
    }).sort(function (a, b) {
      var x = a.uhrzeit || "", y = b.uhrzeit || "";
      return x < y ? -1 : x > y ? 1 : 0;
    });
  }

  global.HeuteLogik = { FERIEN: FERIEN, HINWEISE: HINWEISE, hinweise: hinweise, inFerien: inFerien, essen: essen, termine: termine, wochentag: wochentag };
})(typeof window !== "undefined" ? window : globalThis);
