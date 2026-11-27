// Essensplan: Oberfläche. Logik steckt in logik.js, Speichern über Familie (gemeinsam/familie.js).
(function () {
  'use strict';
  const L = window.EssenLogik;
  const SPEICHER = 'familie.essen.v1';
  // Unter der Woche essen die Kinder mittags in Schule/Kita, gemeinsam gekocht wird abends.
  // Mittag gibt es deshalb nur am Wochenende.
  const MAHLZEITEN = [['mittag', 'Mittag'], ['abend', 'Abend']];
  const mahlzeitenAm = d => (d.getDay() === 0 || d.getDay() === 6) ? MAHLZEITEN : MAHLZEITEN.filter(([k]) => k === 'abend');
  const TAGNAMEN = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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
  const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Daten ----------
  function startGerichte() {
    // Feste ids, damit zwei Handys beim ersten Start nicht doppelte Startgerichte anlegen.
    const g = (name, zutaten, schnell = false) => ({ id: 'start-' + L.normalisiere(name).replace(/[^a-z0-9äöüß]+/g, '-'), name, schnell, zutaten: mitIds(zutaten.map(L.zutatLesen)) });
    return [
      g('Spaghetti Bolognese', ['500 g Spaghetti', '400 g Hackfleisch', '1 Dose passierte Tomaten', '1 Zwiebel', '2 Zehen Knoblauch', '1 Möhre', '50 g Parmesan']),
      g('Pfannkuchen mit Apfelmus', ['250 g Mehl', '500 ml Milch', '3 Eier', '1 Glas Apfelmus'], true),
      g('Gemüsecurry mit Reis', ['300 g Reis', '400 ml Kokosmilch', '1 Brokkoli', '2 Möhren', '1 Paprika', '2 EL Currypaste']),
      g('Fischstäbchen mit Kartoffelpüree', ['1 Pck TK-Fischstäbchen', '1 kg Kartoffeln', '200 ml Milch', '30 g Butter', '300 g TK-Erbsen'], true),
      g('Ofengemüse mit Feta', ['1 kg Kartoffeln', '2 Paprika', '1 Zucchini', '1 Zwiebel', '200 g Feta', '3 EL Olivenöl']),
      g('Linsensuppe', ['250 g Linsen', '2 Möhren', '1 Stange Lauch', '500 g Kartoffeln', '1 l Gemüsebrühe', '4 Wiener Würstchen']),
      g('Wraps mit Hähnchen', ['1 Pck Wraps', '400 g Hähnchenbrust', '1 Eisbergsalat', '2 Tomaten', '1 Gurke', '200 g Schmand'], true),
      g('Nudelauflauf', ['500 g Penne', '200 g Kochschinken', '200 ml Sahne', '200 g Gouda', '300 g TK-Erbsen']),
      g('Brotzeit', ['1 Brot', '150 g Käse', '150 g Aufschnitt', '1 Gurke', '4 Tomaten', 'Butter'], true),
      g('Tomatensuppe mit Toast', ['2 Dosen gehackte Tomaten', '1 Zwiebel', '500 ml Gemüsebrühe', '100 ml Sahne', '1 Pck Toast'], true)
    ];
  }

  // Jeder Listeneintrag bekommt eine id, damit der Abgleich zwischen Geräten Einträge zusammenführen kann.
  function mitIds(zutaten) { return zutaten.filter(Boolean).map((z, i) => ({ id: 'z' + i, ...z })); }

  let daten = Familie.laden(SPEICHER, null);
  if (!daten || !Array.isArray(daten.gerichte)) {
    daten = { version: 1, gerichte: startGerichte(), plan: {}, einkauf: {} };
    speichern();
  }
  function speichern() { Familie.speichern(SPEICHER, daten); }

  // Familienrezepte aus rezepte.js einmalig übernehmen. Was ihr danach bearbeitet oder
  // löscht, bleibt so: jedes Rezept wird pro Familie nur ein Mal hinzugefügt.
  function rezepteUebernehmen() {
    const sammlung = window.FAMILIEN_REZEPTE || [];
    daten.importiert = daten.importiert || [];
    let neu = 0;
    for (const r of sammlung) {
      if (daten.importiert.includes(r.id)) continue;
      daten.importiert.push(r.id);
      if (daten.gerichte.some(g => g.id === r.id)) continue;
      daten.gerichte.push({ ...r, zutaten: mitIds(r.zutaten.map(L.zutatLesen)) });
      neu++;
    }
    if (neu || sammlung.length) speichern();
  }
  rezepteUebernehmen();

  // Neue Daten von einem anderen Gerät: übernehmen und neu zeichnen.
  window.addEventListener('familie:aktualisiert', e => {
    if (e.detail && e.detail.key !== SPEICHER) return;
    const neu = Familie.laden(SPEICHER, null);
    if (!neu || !Array.isArray(neu.gerichte)) return;
    daten = neu;
    if (!$('#gericht-dialog').open && !$('#rezept-dialog').open) zeigeAktuell();
  });

  // ---------- Zustand ----------
  let start = L.wochenStart(new Date());
  // Am Wochenende zeigt die App gleich die nächste Woche, dann wird meist geplant und eingekauft.
  const heute = new Date();
  if (heute.getDay() === 6 || heute.getDay() === 0) start.setDate(start.getDate() + 7);
  let erledigteAusblenden = false;

  const woche = () => L.isoWoche(start);
  const tage = () => L.wochenTage(start);
  const fmt = d => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
  const wochenTitel = () => { const t = tage(); return `KW ${woche().slice(-2)} · ${fmt(t[0])} – ${fmt(t[6])}`; };
  const gericht = id => daten.gerichte.find(g => g.id === id);

  // ---------- Woche ----------
  function zeigeWoche() {
    $('#woche-titel').textContent = wochenTitel();
    const heuteIso = L.isoDatum(new Date());
    const sortiert = daten.gerichte.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    $('#tage').replaceChildren(...tage().map((d, i) => {
      const iso = L.isoDatum(d);
      const eintrag = daten.plan[iso] || {};
      return el('div', { class: 'karte tag' + (iso === heuteIso ? ' heute' : '') },
        el('div', { class: 'tagname' }, el('strong', { text: TAGNAMEN[i] }), el('span', { class: 'leise', text: fmt(d) })),
        el('div', { class: 'mahlzeiten' }, mahlzeitenAm(d).map(([key, label]) =>
          el('label', { class: 'mahlzeit' }, el('span', { class: 'leise', text: label }),
            el('select', {
              'aria-label': `${TAGNAMEN[i]} ${label}`,
              onchange: e => setzePlan(iso, key, e.target.value)
            },
              el('option', { value: '', text: '–' }),
              sortiert.map(g => el('option', { value: g.id, selected: eintrag[key] === g.id, text: g.name + (g.schnell ? ' ⚡' : '') }))
            ))))
      );
    }));
  }

  function setzePlan(iso, key, id) {
    const e = daten.plan[iso] || {};
    if (id) e[key] = id; else delete e[key];
    if (Object.keys(e).length) daten.plan[iso] = e; else delete daten.plan[iso];
    speichern();
  }

  function plaetzeDerWoche() {
    return tage().flatMap(d => mahlzeitenAm(d).map(([key]) => [L.isoDatum(d), key]));
  }

  $('#vorschlag').addEventListener('click', () => {
    const alle = plaetzeDerWoche();
    // Vorschläge nur fürs Abendessen; Mittag am Wochenende wählt ihr selbst.
    const leer = alle.filter(([iso, key]) => key === 'abend' && !(daten.plan[iso] || {})[key]);
    const belegt = alle.map(([iso, key]) => (daten.plan[iso] || {})[key]);
    const vorschlag = L.vorschlagen(leer.map(p => p.join('|')), belegt, daten.gerichte);
    for (const [platz, id] of Object.entries(vorschlag)) { const [iso, key] = platz.split('|'); setzePlan(iso, key, id); }
    zeigeWoche();
  });

  $('#woche-leeren').addEventListener('click', () => {
    if (!confirm('Alle Gerichte dieser Woche entfernen?')) return;
    tage().forEach(d => delete daten.plan[L.isoDatum(d)]);
    speichern(); zeigeWoche();
  });

  $('#woche-zurueck').addEventListener('click', () => { start.setDate(start.getDate() - 7); zeigeAktuell(); });
  $('#woche-vor').addEventListener('click', () => { start.setDate(start.getDate() + 7); zeigeAktuell(); });

  // ---------- Einkauf ----------
  function einkaufWoche() {
    const e = daten.einkauf[woche()] || (daten.einkauf[woche()] = { abgehakt: {}, extra: [] });
    e.abgehakt = e.abgehakt || {}; e.extra = e.extra || [];
    return e;
  }

  function postenDerWoche() {
    const ids = plaetzeDerWoche().map(([iso, key]) => (daten.plan[iso] || {})[key]).filter(Boolean);
    const liste = L.einkaufslisteBilden(ids, daten.gerichte);
    const extra = einkaufWoche().extra.map(x => ({ ...x, gerichte: [], extra: true }));
    return [...liste, ...extra].sort((a, b) =>
      L.KATEGORIEN.indexOf(a.kategorie) - L.KATEGORIEN.indexOf(b.kategorie) || a.name.localeCompare(b.name, 'de'));
  }

  function zeigeEinkauf() {
    $('#einkauf-titel').textContent = wochenTitel();
    const ew = einkaufWoche();
    const posten = postenDerWoche();
    if (!posten.length) {
      $('#einkaufsliste').replaceChildren(el('p', { class: 'karte leise', text: 'Noch nichts geplant. Wähle im Reiter „Woche“ Gerichte aus, dann erscheint hier automatisch die Einkaufsliste.' }));
      return;
    }
    const gruppen = new Map();
    for (const p of posten) {
      if (erledigteAusblenden && ew.abgehakt[p.schluessel]) continue;
      if (!gruppen.has(p.kategorie)) gruppen.set(p.kategorie, []);
      gruppen.get(p.kategorie).push(p);
    }
    const offen = posten.filter(p => !ew.abgehakt[p.schluessel]).length;
    $('#einkaufsliste').replaceChildren(
      el('p', { class: 'leise zaehler', text: `${offen} von ${posten.length} offen` }),
      ...[...gruppen].map(([kat, liste]) => el('div', { class: 'karte gruppe' },
        el('h3', { text: kat }),
        liste.map(p => el('label', { class: 'posten' + (ew.abgehakt[p.schluessel] ? ' erledigt' : '') },
          el('input', { type: 'checkbox', checked: !!ew.abgehakt[p.schluessel], onchange: e => {
            if (e.target.checked) ew.abgehakt[p.schluessel] = true; else delete ew.abgehakt[p.schluessel];
            speichern(); zeigeEinkauf();
          } }),
          el('span', { class: 'postentext' },
            el('span', { text: L.zutatSchreiben(p) }),
            p.gerichte.length ? el('small', { class: 'leise', text: p.gerichte.join(', ') }) : null),
          p.extra ? el('button', { class: 'entfernen', 'aria-label': 'Entfernen', text: '×', onclick: e => {
            e.preventDefault();
            ew.extra = ew.extra.filter(x => x.schluessel !== p.schluessel);
            delete ew.abgehakt[p.schluessel]; speichern(); zeigeEinkauf();
          } }) : null
        ))
      ))
    );
  }

  $('#extra-form').addEventListener('submit', e => {
    e.preventDefault();
    const z = L.zutatLesen($('#extra-eingabe').value);
    if (!z) return;
    const id = neueId();
    einkaufWoche().extra.push({ id, ...z, schluessel: 'extra|' + id });
    $('#extra-eingabe').value = '';
    speichern(); zeigeEinkauf();
  });

  $('#erledigte-ausblenden').addEventListener('click', e => {
    erledigteAusblenden = !erledigteAusblenden;
    e.target.textContent = erledigteAusblenden ? 'Erledigte zeigen' : 'Erledigte ausblenden';
    zeigeEinkauf();
  });

  $('#teilen').addEventListener('click', async () => {
    const ew = einkaufWoche();
    const offen = postenDerWoche().filter(p => !ew.abgehakt[p.schluessel]);
    const text = L.listeAlsText('Einkauf ' + wochenTitel(), offen);
    try {
      if (navigator.share) await navigator.share({ title: 'Einkaufsliste', text });
      else { await navigator.clipboard.writeText(text); hinweis('Liste kopiert'); }
    } catch (err) { if (err.name !== 'AbortError') hinweis('Teilen hat nicht geklappt'); }
  });

  // ---------- Gerichte ----------
  function zeigeGerichte() {
    const sortiert = daten.gerichte.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    $('#gerichtliste').replaceChildren(...sortiert.map(g => el('button', { class: 'karte gericht', onclick: () => zeigeRezept(g) },
      el('strong', { text: g.name + (g.schnell ? ' ⚡' : '') + (g.zubereitung ? ' 📖' : '') }),
      el('small', { class: 'leise', text: g.zutaten.map(z => z.name).join(', ') || 'Keine Zutaten' }))));
  }

  // Rezept zum Lesen beim Kochen
  let imRezept = null;
  function zeigeRezept(g) {
    imRezept = g;
    const absaetze = (g.zubereitung || '').split(/\n+/).map(t => t.trim()).filter(Boolean);
    $('#rezept-inhalt').replaceChildren(
      el('h2', { text: g.name }),
      el('p', { class: 'leise', text: [g.portionen ? g.portionen + ' Portionen' : '', g.quelle ? 'von ' + g.quelle : ''].filter(Boolean).join(' · ') || null }),
      el('h3', { text: 'Zutaten' }),
      el('ul', { class: 'zutatenliste' }, g.zutaten.map(z => el('li', { text: L.zutatSchreiben(z) }))),
      absaetze.length ? el('h3', { text: 'Zubereitung' }) : null,
      absaetze.length ? el('ol', { class: 'schritte' }, absaetze.map(t => el('li', { text: t.replace(/^\d+[.)]\s*/, '') }))) : null
    );
    $('#rezept-dialog').showModal();
  }
  $('#rezept-bearbeiten').addEventListener('click', () => { $('#rezept-dialog').close(); bearbeiten(imRezept); });
  $('#rezept-schliessen').addEventListener('click', () => $('#rezept-dialog').close());

  let inBearbeitung = null;
  function bearbeiten(g) {
    inBearbeitung = g || null;
    const f = $('#gericht-form');
    $('#dialog-titel').textContent = g ? 'Gericht bearbeiten' : 'Neues Gericht';
    f.name.value = g ? g.name : '';
    f.zutaten.value = g ? g.zutaten.map(L.zutatSchreiben).join('\n') : '';
    f.schnell.checked = !!(g && g.schnell);
    f.portionen.value = g && g.portionen ? g.portionen : '';
    f.quelle.value = g && g.quelle ? g.quelle : '';
    f.zubereitung.value = g && g.zubereitung ? g.zubereitung : '';
    $('#gericht-loeschen').hidden = !g;
    $('#gericht-dialog').showModal();
  }

  $('#neues-gericht').addEventListener('click', () => bearbeiten(null));

  $('#gericht-dialog').addEventListener('close', () => {
    const wert = $('#gericht-dialog').returnValue;
    const f = $('#gericht-form');
    if (wert === 'speichern' && f.name.value.trim()) {
      const neu = {
        id: inBearbeitung ? inBearbeitung.id : neueId(),
        name: f.name.value.trim(),
        schnell: f.schnell.checked,
        zutaten: mitIds(f.zutaten.value.split('\n').map(L.zutatLesen)),
        portionen: Number(f.portionen.value) || null,
        quelle: f.quelle.value.trim(),
        zubereitung: f.zubereitung.value.trim()
      };
      daten.gerichte = daten.gerichte.filter(g => g.id !== neu.id).concat(neu);
    } else if (wert === 'loeschen' && inBearbeitung) {
      if (!confirm(`„${inBearbeitung.name}“ löschen? Es verschwindet auch aus dem Plan.`)) return;
      const id = inBearbeitung.id;
      daten.gerichte = daten.gerichte.filter(g => g.id !== id);
      for (const [iso, e] of Object.entries(daten.plan)) {
        for (const k of Object.keys(e)) if (e[k] === id) delete e[k];
        if (!Object.keys(e).length) delete daten.plan[iso];
      }
    } else return;
    speichern(); zeigeGerichte();
  });

  // ---------- Export / Import ----------
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `essensplan-${L.isoDatum(new Date())}.json` });
    document.body.append(a); a.click(); a.remove();
  });

  $('#import').addEventListener('change', async e => {
    const datei = e.target.files[0];
    if (!datei) return;
    try {
      const neu = JSON.parse(await datei.text());
      if (!Array.isArray(neu.gerichte) || typeof neu.plan !== 'object') throw new Error('Format');
      if (!confirm('Import ersetzt Gerichte, Plan und Einkaufslisten auf diesem Gerät. Weiter?')) return;
      daten = { version: 1, einkauf: {}, ...neu };
      speichern(); zeigeAktuell(); hinweis('Import fertig');
    } catch { hinweis('Die Datei ist kein gültiger Essensplan-Export'); }
    e.target.value = '';
  });

  // ---------- Navigation ----------
  let ansicht = 'woche';
  function zeigeAktuell() {
    ({ woche: zeigeWoche, einkauf: zeigeEinkauf, gerichte: zeigeGerichte })[ansicht]();
  }
  document.querySelectorAll('.reiter button').forEach(b => b.addEventListener('click', () => {
    ansicht = b.dataset.ansicht;
    document.querySelectorAll('.reiter button').forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('main > section').forEach(s => { s.hidden = s.id !== 'ansicht-' + ansicht; });
    zeigeAktuell();
  }));

  function hinweis(text) {
    const h = el('div', { class: 'hinweis', role: 'status', text });
    document.body.append(h);
    setTimeout(() => h.remove(), 2500);
  }

  zeigeAktuell();
})();
