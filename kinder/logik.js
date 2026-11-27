// Reine Logik ohne DOM: aus einer Nachricht von Schule oder Kita Vorschläge
// für Termine und Aufgaben machen. Läuft im Browser (window.KinderLogik) und in Node (Tests).
// Bewusst einfach: Die Vorschläge kann man vor dem Speichern bearbeiten.
(function (global) {
  'use strict';

  const MONATE = {
    januar: 1, jan: 1, februar: 2, feb: 2, märz: 3, maerz: 3, mär: 3, april: 4, apr: 4, mai: 5,
    juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9,
    oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12
  };
  const WOCHENTAGE = { sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonnabend: 6 };

  // Woran man erkennt, dass etwas zu tun ist (statt nur ein Termin)
  const TUN = /mitbring|mitgeb|mitnehm|mitzubring|mitzugeb|abgeb|abzugeb|einreich|ausfüll|ausfuell|unterschreib|unterschrift|zurückgeb|zurueckgeb|anmeld|bezahl|überweis|ueberweis|einsammel|\bgeld\b|euro|€|bitte denk|nicht vergessen|denken sie|denkt an/i;

  function iso(j, m, t) {
    return j + '-' + String(m).padStart(2, '0') + '-' + String(t).padStart(2, '0');
  }

  function ausIso(s) {
    const [j, m, t] = s.split('-').map(Number);
    return new Date(j, m - 1, t);
  }

  function plusTage(s, n) {
    const d = ausIso(s);
    d.setDate(d.getDate() + n);
    return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function gueltig(j, m, t) {
    const d = new Date(j, m - 1, t);
    return d.getFullYear() === j && d.getMonth() === m - 1 && d.getDate() === t;
  }

  // Ohne Jahr: das nächste passende Datum (bis 30 Tage zurück gilt noch dieses Jahr,
  // damit "am 3.12." auch kurz danach nicht ins nächste Jahr rutscht).
  function jahrErgaenzen(m, t, heute) {
    const j = Number(heute.slice(0, 4));
    const kandidat = iso(j, m, t);
    return kandidat < plusTage(heute, -30) ? iso(j + 1, m, t) : kandidat;
  }

  /* Findet das erste Datum im Text. Ergebnis {datum, von, bis} oder null. */
  function datumFinden(text, heute) {
    return datenFinden(text, heute)[0] || null;
  }

  /* Alle Daten im Text, nach Position sortiert. */
  function datenFinden(text, heute) {
    let m;
    // 05.12.2026 / 5.12.26 / 5.12.
    const zahl = /(\d{1,2})\.\s?(\d{1,2})\.(\s?(\d{4}|\d{2})(?!\d))?/g;
    // 5. Dezember (2026)
    const wort = new RegExp('(\\d{1,2})\\.?\\s+(' + Object.keys(MONATE).join('|') + ')\\.?(\\s+(\\d{4}))?(?![a-zäöü])', 'gi');
    const treffer = [];
    while ((m = zahl.exec(text))) {
      const t = Number(m[1]), mo = Number(m[2]);
      let j = m[4] ? Number(m[4]) : null;
      if (j !== null && j < 100) j += 2000;
      if (mo < 1 || mo > 12) continue;
      const d = j ? iso(j, mo, t) : jahrErgaenzen(mo, t, heute);
      if (!gueltig(...d.split('-').map(Number))) continue;
      treffer.push({ datum: d, von: m.index, bis: m.index + m[0].length });
    }
    while ((m = wort.exec(text))) {
      const t = Number(m[1]), mo = MONATE[m[2].toLowerCase()];
      const d = m[4] ? iso(Number(m[4]), mo, t) : jahrErgaenzen(mo, t, heute);
      if (!gueltig(...d.split('-').map(Number))) continue;
      treffer.push({ datum: d, von: m.index, bis: m.index + m[0].length });
    }
    if (!treffer.length) {
      const rel = /\b(morgen|übermorgen|uebermorgen)\b/i.exec(text);
      if (rel) {
        const n = { morgen: 1, übermorgen: 2, uebermorgen: 2 }[rel[1].toLowerCase()];
        treffer.push({ datum: plusTage(heute, n), von: rel.index, bis: rel.index + rel[0].length });
      }
    }
    if (!treffer.length) {
      // "am Freitag", "nächsten Montag", "kommenden Dienstag", "bis Mittwoch": nächster solcher Tag
      const tag = new RegExp('\\b((?:am|bis|ab|diesen|nächsten|naechsten|kommenden)\\s+)?(' + Object.keys(WOCHENTAGE).join('|') + ')\\b', 'i').exec(text);
      if (tag) {
        const ziel = WOCHENTAGE[tag[2].toLowerCase()];
        const jetzt = ausIso(heute).getDay();
        const n = (ziel - jetzt + 7) % 7 || 7;
        treffer.push({ datum: plusTage(heute, n), von: tag.index, bis: tag.index + tag[0].length });
      }
    }
    return treffer.sort((a, b) => a.von - b.von);
  }

  /* "um 15 Uhr", "15:30 Uhr", "15.30 Uhr", "von 9 bis 12 Uhr" -> "15:30" */
  function uhrzeitFinden(text) {
    const m = /\b(?:um|ab|von)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:-|–|bis)?\s*(?:\d{1,2}(?:[:.]\d{2})?\s*)?Uhr\b/i.exec(text);
    if (!m) return null;
    const h = Number(m[1]);
    if (h > 23) return null;
    return h + ':' + (m[2] || '00');
  }

  /* Text in Sätze bzw. Zeilen teilen. Datumspunkte ("5.12.") trennen nicht. */
  function saetze(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .split(/\n+|(?<=[!?])\s+|(?<=[a-zäöüß)]{2}\.)\s+(?=[A-ZÄÖÜ])/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 2);
  }

  function kuerzen(s, max) {
    s = s.replace(/^(liebe|hallo|guten tag)[^,!]*[,!]\s*/i, '')
      .replace(/^(bitte\s+)?(denken sie|denkt)\s+(bitte\s+)?daran,?\s*(dass\s+)?/i, '')
      .replace(/\s*[.!]+$/, '').trim();
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, '') + ' …' : s;
  }

  /* Kurzer Titel: Datum, Uhrzeit und Füllwörter raus.
     "Am Donnerstag, 03.12., findet um 19:30 Uhr der Elternabend in der Aula statt" -> "Elternabend in der Aula" */
  function titelAus(satz, d) {
    let s = satz;
    if (d) s = s.slice(0, d.von) + ' ' + s.slice(d.bis);
    const tage = Object.keys(WOCHENTAGE).join('|');
    s = s.replace(new RegExp('\\b(am|bis|ab|diesen|nächsten|naechsten|kommenden)?\\s*(' + tage + ')\\b,?', 'gi'), ' ')
      .replace(/\b(um|ab|von)?\s*\d{1,2}([:.]\d{2})?\s*((-|–|bis)\s*\d{1,2}([:.]\d{2})?\s*)?Uhr\b/gi, ' ')
      .replace(/^\s*(am|bis|ab|den)\b\s*,?/i, ' ')
      .replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').replace(/^[\s,]+/, '');
    // "findet ... der Elternabend ... statt"
    s = s.replace(/^(findet|ist)\s+(der|die|das|unser|unsere)?\s*(.+?)\s+statt\b/i, '$3')
      .replace(/^(.+?)\s+findet\s+(.*?)\s*statt\b/i, '$1 $2')
      .replace(/^(machen|haben|feiern|gehen|fahren|besuchen)\s+wir\s+(unseren|unsere|unser|einen|eine|ein|den|die|das)?\s*/i, '')
      .replace(/^(bitte\s+)?(geben sie|gebt)\s+(ihrem|eurem|ihren|euren)\s+(kind|kindern)\s+(.+?)\s+mit\b/i, '$5 mitgeben')
      .replace(/^bitte\s+/i, '')
      .replace(/^(der|die|das)\s+/i, '');
    return kuerzen(s.trim() || satz, 70);
  }

  /* Vorschläge aus einer Nachricht.
     -> [{art: "termin"|"aufgabe", titel, datum, uhrzeit, satz}]
     Sätze ohne Datum, aber mit "mitbringen" o. ä., erben das Datum des Satzes davor. */
  function vorschlaege(text, heute) {
    const liste = [];
    let letztesDatum = null;
    saetze(text).forEach(satz => {
      const daten = datenFinden(satz, heute);
      const tun = TUN.test(satz);
      if (daten.length) letztesDatum = daten[daten.length - 1].datum;
      if (!daten.length && !tun) return;
      const art = tun ? 'aufgabe' : 'termin';
      const uhrzeit = uhrzeitFinden(satz);
      if (daten.length > 1) {
        // "am 24.12. und 31.12. geschlossen": je Datum ein Eintrag, Satz bleibt lesbar
        const titel = kuerzen(satz.replace(/^(die|der|das)\s+/i, ''), 70);
        daten.forEach(d => liste.push({ art, titel, datum: d.datum, uhrzeit, satz }));
        return;
      }
      const d = daten[0] || null;
      liste.push({ art, titel: titelAus(satz, d), datum: d ? d.datum : letztesDatum || heute, uhrzeit, satz });
    });
    // gleiche Vorschläge nur einmal
    const gesehen = {};
    return liste.filter(v => {
      const k = v.datum + '|' + v.titel.toLowerCase();
      if (gesehen[k]) return false;
      gesehen[k] = true;
      return true;
    });
  }

  const KinderLogik = { datumFinden, datenFinden, titelAus, uhrzeitFinden, saetze, vorschlaege, plusTage };
  if (typeof module !== 'undefined' && module.exports) module.exports = KinderLogik;
  else global.KinderLogik = KinderLogik;
})(typeof window !== 'undefined' ? window : globalThis);
