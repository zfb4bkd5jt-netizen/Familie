/*
 * Bring-Plan: reine Logik ohne DOM, damit sie auch in Node getestet werden kann.
 * Klassisches Script, stellt global `BringLogik` bereit.
 *
 * Daten unter "familie.bringen.v1":
 * {
 *   version: 1,
 *   wege: [{ id, titel, kind, symbol, uhrzeit, schule, kandidaten: [personId], regel: { "1": personId, … "5": … } }],
 *   tage: { "2026-11-30|tilda-kita": personId | "-" }   // Abweichungen vom Regelplan ("-" = fällt aus)
 * }
 * Regel: wer an diesem Wochentag normalerweise bringt (1 = Mo … 5 = Fr).
 * Tage: einzelne Tage, an denen getauscht wurde. Objekte werden beim Abgleich feldweise
 * zusammengeführt, so geht ein Tausch auf dem einen Handy nicht durch einen auf dem anderen verloren.
 */
(function (global) {
  "use strict";

  var AUSFALL = "-";
  var WOCHENTAGE = [1, 2, 3, 4, 5];
  var TAG_NAMEN = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // Feste ids, damit zwei Handys dieselben Wege anlegen.
  var START_WEGE = [
    { id: "tilda-kita", titel: "Tilda in die Kita", kind: "Tilda", symbol: "🧸", uhrzeit: "", schule: false },
    { id: "benno-bus", titel: "Benno zur Bushaltestelle", kind: "Benno", symbol: "🚌", uhrzeit: "", schule: true }
  ];

  function wochentag(iso) {
    var t = iso.split("-").map(Number);
    return new Date(t[0], t[1] - 1, t[2]).getDay();
  }

  function plusTage(iso, n) {
    var t = iso.split("-").map(Number);
    var d = new Date(t[0], t[1] - 1, t[2] + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* Montag der Woche, in der iso liegt. */
  function montag(iso) {
    var w = wochentag(iso);
    return plusTage(iso, w === 0 ? -6 : 1 - w);
  }

  function gleicherName(a, b) {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  }

  /* Kinder der Wege (Tilda, Benno) bringen nicht selbst. */
  function istKind(p, wege) {
    return (wege || START_WEGE).some(function (w) { return gleicherName(w.kind, p.name); });
  }

  /* Wer kommt zum Bringen infrage: alle außer den Kindern. Oma/Opa erst, wenn man sie im Regelplan
     ankreuzt, sonst wäre der Tausch mit einem Tipp kein Tausch zwischen Matthias und Maike mehr. */
  function standardKandidaten(personen, wege) {
    return (personen || []).filter(function (p) {
      return !istKind(p, wege) && !/^(opa|oma)\b/i.test(String(p.name).trim());
    }).map(function (p) { return p.id; });
  }

  /* Regelplan zum Start: Mo bis Fr bringt die erste infrage kommende Person, Tausch geht dann per Tipp. */
  function neuerPlan(personen) {
    var kandidaten = standardKandidaten(personen, START_WEGE);
    return {
      version: 1,
      wege: START_WEGE.map(function (w) {
        var regel = {};
        if (kandidaten[0]) WOCHENTAGE.forEach(function (t) { regel[t] = kandidaten[0]; });
        return Object.assign({}, w, { kandidaten: kandidaten.slice(), regel: regel });
      }),
      tage: {}
    };
  }

  /* Neue Personen (z. B. Opa Eddy) und gelöschte Personen nachziehen. Gibt true zurück, wenn sich etwas geändert hat. */
  function aufraeumen(plan, personen, heute) {
    var geaendert = false;
    var ids = (personen || []).map(function (p) { return p.id; });
    plan.wege.forEach(function (w) {
      // Plan wurde angelegt, bevor es Personen gab: jetzt nachholen
      if (!w.kandidaten.length && ids.length) {
        w.kandidaten = standardKandidaten(personen, plan.wege);
        if (w.kandidaten[0] && !Object.keys(w.regel).length) WOCHENTAGE.forEach(function (t) { w.regel[t] = w.kandidaten[0]; });
        if (w.kandidaten.length) geaendert = true;
      }
      var vorher = w.kandidaten.length;
      w.kandidaten = w.kandidaten.filter(function (id) { return ids.indexOf(id) >= 0; });
      if (w.kandidaten.length !== vorher) geaendert = true;
      Object.keys(w.regel).forEach(function (t) {
        if (ids.indexOf(w.regel[t]) < 0) { delete w.regel[t]; geaendert = true; }
      });
    });
    if (heute) {
      var grenze = plusTage(heute, -14);
      Object.keys(plan.tage).forEach(function (k) {
        if (k.split("|")[0] < grenze) { delete plan.tage[k]; geaendert = true; }
      });
    }
    return geaendert;
  }

  function weg(plan, wegId) {
    return plan.wege.find(function (w) { return w.id === wegId; }) || null;
  }

  /* Ist an dem Tag überhaupt etwas zu bringen? Wochenende nicht, Schulweg nicht in den Ferien. */
  function istBringTag(w, iso, inFerien) {
    if (WOCHENTAGE.indexOf(wochentag(iso)) < 0) return false;
    if (w.schule && inFerien && inFerien(iso)) return false;
    return true;
  }

  /* Wer bringt an dem Tag? -> { weg, personId, getauscht, ausfall } oder null, wenn nichts zu bringen ist. */
  function eintrag(plan, w, iso, inFerien) {
    if (!istBringTag(w, iso, inFerien)) return null;
    var regel = w.regel[wochentag(iso)] || null;
    var k = iso + "|" + w.id;
    var abw = Object.prototype.hasOwnProperty.call(plan.tage, k) ? plan.tage[k] : undefined;
    if (abw === AUSFALL) return { weg: w, personId: null, regelId: regel, getauscht: false, ausfall: true };
    var pid = abw !== undefined ? abw : regel;
    return { weg: w, personId: pid, regelId: regel, getauscht: abw !== undefined && abw !== regel, ausfall: false };
  }

  function tag(plan, iso, inFerien) {
    return plan.wege.map(function (w) { return eintrag(plan, w, iso, inFerien); }).filter(Boolean);
  }

  function setzen(plan, wegId, iso, wert) {
    var w = weg(plan, wegId);
    var k = iso + "|" + wegId;
    if (w && wert === (w.regel[wochentag(iso)] || null)) delete plan.tage[k];
    else plan.tage[k] = wert === null ? AUSFALL : wert;
  }

  /* Ein Tipp: die nächste infrage kommende Person übernimmt (bei zwei Personen also ein Tausch). */
  function tauschen(plan, wegId, iso) {
    var w = weg(plan, wegId);
    if (!w || !w.kandidaten.length) return null;
    var e = eintrag(plan, w, iso);
    var i = e && e.personId ? w.kandidaten.indexOf(e.personId) : -1;
    var neu = w.kandidaten[(i + 1) % w.kandidaten.length];
    setzen(plan, wegId, iso, neu);
    return neu;
  }

  /* Fällt aus (z. B. Tilda krank) oder wieder normal. */
  function ausfallUmschalten(plan, wegId, iso) {
    var k = iso + "|" + wegId;
    if (plan.tage[k] === AUSFALL) delete plan.tage[k];
    else plan.tage[k] = AUSFALL;
  }

  /* Was zeigt die Heute-Karte? Morgens den heutigen Tag, ab "umschalten" (Standard 10:00) den morgigen, falls morgen gebracht wird. */
  function anzeigeTag(plan, heute, jetztHHMM, inFerien, umschalten) {
    if (jetztHHMM < (umschalten || "10:00") && tag(plan, heute, inFerien).length) return { iso: heute, heute: true };
    // Nur morgen, nicht weiter: Samstag zeigt nichts, Sonntag schon den Montag
    var morgen = plusTage(heute, 1);
    if (tag(plan, morgen, inFerien).length) return { iso: morgen, heute: false, morgen: true };
    return null;
  }

  global.BringLogik = {
    AUSFALL: AUSFALL, WOCHENTAGE: WOCHENTAGE, TAG_NAMEN: TAG_NAMEN, START_WEGE: START_WEGE,
    neuerPlan: neuerPlan, standardKandidaten: standardKandidaten, istKind: istKind, aufraeumen: aufraeumen,
    weg: weg, eintrag: eintrag, tag: tag, setzen: setzen, tauschen: tauschen, ausfallUmschalten: ausfallUmschalten,
    anzeigeTag: anzeigeTag, wochentag: wochentag, plusTage: plusTage, montag: montag
  };
  if (typeof module !== "undefined") module.exports = global.BringLogik;
})(typeof window !== "undefined" ? window : globalThis);
