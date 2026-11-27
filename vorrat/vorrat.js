// Vorrat & Haushalt: Oberfläche. Logik in logik.js, die Einkaufslisten gehören dem Essensplan.
(function () {
  'use strict';
  const L = window.EssenLogik;
  const V = window.VorratLogik;
  const SPEICHER = 'familie.vorrat.v1';
  const ESSEN = 'familie.essen.v1';

  const $ = sel => document.querySelector(sel);
  const el = (tag, attrs = {}, ...kinder) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    kinder.flat().forEach(c => c != null && e.append(c));
    return e;
  };
  const listenName = id => (V.LISTEN.find(([i]) => i === id) || [, id])[1];
  const fmt = iso => { const [, m, d] = iso.split('-'); return `${+d}.${+m}.`; };

  let vorrat = Familie.laden(SPEICHER, null);
  if (!vorrat || !Array.isArray(vorrat.artikel)) { vorrat = V.neuerVorrat(); Familie.speichern(SPEICHER, vorrat); }
  // Den Essensplan immer frisch lesen: Er wird auch auf der Einkaufsseite und von anderen Handys geändert.
  function essenLaden() {
    const e = Familie.laden(ESSEN, null);
    return e && Array.isArray(e.gerichte) ? e : V.leererEssensplan();
  }
  let bearbeiten = false;

  function zeige() {
    const essen = essenLaden();
    if (V.aufraeumen(vorrat, essen)) Familie.speichern(SPEICHER, vorrat);
    let offen = 0;
    const bereiche = V.BEREICHE.concat(vorrat.artikel.map(a => a.bereich).filter(b => !V.BEREICHE.includes(b)));
    const karten = [...new Set(bereiche)].map(bereich => {
      const liste = vorrat.artikel.filter(a => a.bereich === bereich);
      if (!liste.length) return null;
      return el('section', { class: 'karte bereich' }, el('h3', { text: bereich }), el('div', { class: 'kacheln' }, liste.map(a => {
        const z = V.zustand(essen, a);
        const an = z.zustand === 'offen';
        if (an) offen++;
        const info = an ? `steht auf ${listenName(z.liste)}`
          : a.gekauft ? `zuletzt gekauft ${fmt(a.gekauft)}`
          : V.listeFuer(a, essen) !== V.STANDARDLISTE ? listenName(V.listeFuer(a, essen)) : '';
        // Kachel: Tippen setzt auf die Liste oder nimmt wieder runter. Im Bearbeiten-Modus öffnet sie den Artikel.
        return el('button', {
          class: 'kachel' + (an ? ' an' : ''), 'aria-pressed': bearbeiten ? false : String(an),
          'aria-label': bearbeiten ? a.name + ' bearbeiten' : `${a.name}: ${an ? 'auf der Liste, tippen zum Zurücknehmen' : 'fast leer'}`,
          onclick: () => bearbeiten ? oeffnen(a) : umschalten(a)
        },
          el('span', { class: 'name', text: (an ? '✓ ' : '') + a.name }),
          (bearbeiten || info) ? el('small', { text: bearbeiten ? '✎ bearbeiten' : info }) : null);
      })));
    });
    $('#bereiche').replaceChildren(...karten.filter(Boolean));
    const link = $('#zur-liste');
    link.hidden = !offen;
    link.textContent = offen === 1 ? '1 Sache steht auf der Einkaufsliste ›' : `${offen} Sachen stehen auf der Einkaufsliste ›`;
    $('#neu').hidden = !bearbeiten;
  }

  function umschalten(a) {
    const essen = essenLaden();
    if (V.zustand(essen, a).zustand === 'offen') {
      V.vonDerListe(essen, a);
      hinweis(`${a.name} wieder von der Liste genommen`);
    } else {
      const liste = V.aufDieListe(essen, a);
      hinweis(`${a.name} steht auf ${listenName(liste)}`);
    }
    Familie.speichern(ESSEN, essen);
    Familie.speichern(SPEICHER, vorrat);
    zeige();
  }

  // ---------- Bearbeiten ----------
  $('#bearbeiten').addEventListener('click', e => {
    bearbeiten = !bearbeiten;
    e.target.setAttribute('aria-pressed', String(bearbeiten));
    e.target.textContent = bearbeiten ? 'Fertig' : 'Bearbeiten';
    zeige();
  });

  const form = $('#artikel-form');
  let inBearbeitung = null;
  function oeffnen(a) {
    inBearbeitung = a || null;
    const essen = essenLaden();
    $('#dialog-titel').textContent = a ? 'Artikel bearbeiten' : 'Neuer Artikel';
    form.name.value = a ? a.name : '';
    const bereiche = [...new Set(V.BEREICHE.concat(vorrat.artikel.map(x => x.bereich)))];
    form.bereich.replaceChildren(...bereiche.map(b => el('option', { value: b, text: b, selected: a ? a.bereich === b : b === 'Haushalt' })));
    const liste = a ? V.listeFuer(a, essen) : V.STANDARDLISTE;
    form.liste.replaceChildren(...V.LISTEN.map(([id, name]) => el('option', { value: id, text: name, selected: id === liste })));
    $('#artikel-loeschen').hidden = !a;
    $('#artikel-dialog').showModal();
  }
  $('#neu').addEventListener('click', () => oeffnen(null));

  $('#artikel-dialog').addEventListener('close', () => {
    const wert = $('#artikel-dialog').returnValue;
    const a = inBearbeitung;
    inBearbeitung = null;
    const essen = essenLaden();
    if (wert === 'speichern' && form.name.value.trim()) {
      const name = form.name.value.trim();
      const ziel = a || { id: V.slug(name) + '-' + Familie.id() };
      ziel.name = name; ziel.bereich = form.bereich.value;
      if (form.liste.value === V.STANDARDLISTE) delete ziel.liste; else ziel.liste = form.liste.value;
      // Eine im Einkauf gelernte Zuordnung würde die Auswahl sonst überstimmen.
      const k = L.namensSchluessel(name);
      if (essen.zuordnung && essen.zuordnung[k] && essen.zuordnung[k] !== form.liste.value) {
        if (form.liste.value === V.STANDARDLISTE) delete essen.zuordnung[k]; else essen.zuordnung[k] = form.liste.value;
      }
      // Steht er gerade auf einer Liste, zieht er mit um.
      if (ziel.knapp) {
        const x = (((essen.einkauf || {})[ziel.knapp.woche] || {}).extra || []).find(e => e.id === ziel.knapp.id);
        if (x) { x.liste = form.liste.value; x.name = name; }
      }
      if (!a) vorrat.artikel.push(ziel);
    } else if (wert === 'loeschen' && a) {
      if (!confirm(`„${a.name}“ aus dem Vorrat löschen?`)) return;
      V.vonDerListe(essen, a);
      vorrat.artikel = vorrat.artikel.filter(x => x.id !== a.id);
    } else return;
    Familie.speichern(ESSEN, essen);
    Familie.speichern(SPEICHER, vorrat);
    zeige();
  });

  // Neue Daten von einem anderen Handy (Vorrat oder Einkauf abgehakt): neu zeichnen.
  window.addEventListener('familie:aktualisiert', e => {
    const key = e.detail && e.detail.key;
    if (key && key !== SPEICHER && key !== ESSEN) return;
    const neu = Familie.laden(SPEICHER, null);
    if (neu && Array.isArray(neu.artikel)) vorrat = neu;
    if (!$('#artikel-dialog').open) zeige();
  });
  // Zurück von der Einkaufsliste (iOS hält die Seite im Speicher): Haken übernehmen.
  window.addEventListener('pageshow', () => zeige());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#artikel-dialog').open) zeige(); });

  function hinweis(text) {
    document.querySelectorAll('.hinweis').forEach(h => h.remove());
    const h = el('div', { class: 'hinweis', role: 'status', text });
    document.body.append(h);
    setTimeout(() => h.remove(), 2500);
  }

  zeige();
})();
