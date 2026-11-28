/*
 * Bring-Plan: Daten laden und speichern, für die Seite bringen/ und die Heute-Karte.
 * Braucht familie.js und bringen/logik.js (heute/heute-logik.js optional, für die Schulferien).
 * Stellt global `Bringen` bereit.
 */
(function () {
  "use strict";

  var KEY = "familie.bringen.v1";
  var L = window.BringLogik;

  function inFerien(iso) {
    return window.HeuteLogik ? window.HeuteLogik.inFerien(iso) : false;
  }

  function laden() {
    var plan = Familie.laden(KEY, null);
    if (!plan || !Array.isArray(plan.wege)) {
      plan = L.neuerPlan(Familie.personen());
      Familie.speichern(KEY, plan);
    }
    if (!plan.tage) plan.tage = {};
    if (L.aufraeumen(plan, Familie.personen(), Familie.heute())) Familie.speichern(KEY, plan);
    return plan;
  }

  function speichern(plan) { Familie.speichern(KEY, plan); }

  function tag(iso) { return L.tag(laden(), iso, inFerien); }

  /* Ein Tipp: nächste Person übernimmt. Gibt die Person zurück. */
  function tauschen(wegId, iso) {
    var plan = laden();
    var pid = L.tauschen(plan, wegId, iso);
    speichern(plan);
    return pid ? Familie.person(pid) : null;
  }

  function ausfallUmschalten(wegId, iso) {
    var plan = laden();
    L.ausfallUmschalten(plan, wegId, iso);
    speichern(plan);
  }

  /* Für Wochenansichten: [{titel, datum, personId, modul: "bringen"}] */
  function termineZwischen(von, bis) {
    var plan = laden();
    var liste = [];
    for (var iso = von; iso <= bis; iso = L.plusTage(iso, 1)) {
      L.tag(plan, iso, inFerien).forEach(function (e) {
        if (e.ausfall || !e.personId) return;
        var p = Familie.person(e.personId);
        liste.push({ titel: (p ? p.name : "?") + " bringt " + e.weg.titel, datum: iso, uhrzeit: e.weg.uhrzeit || "", personId: e.personId, wegId: e.weg.id, modul: "bringen" });
      });
    }
    return liste;
  }

  window.Bringen = { KEY: KEY, laden: laden, speichern: speichern, tag: tag, tauschen: tauschen, ausfallUmschalten: ausfallUmschalten, inFerien: inFerien, termineZwischen: termineZwischen };
})();
