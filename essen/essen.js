// Essensplan: Oberfläche. Logik steckt in logik.js, Speichern über Familie (gemeinsam/familie.js).
(function () {
  'use strict';
  const L = window.EssenLogik;
  const SPEICHER = 'familie.essen.v1';
  // Unter der Woche essen die Kinder mittags in Schule/Kita, gemeinsam gekocht wird abends.
  // Mittag gibt es deshalb nur am Wochenende.
  const MAHLZEITEN = [['mittag', 'Mittag'], ['abend', 'Abend']];
  const mahlzeitenAm = d => (d.getDay() === 0 || d.getDay() === 6) ? MAHLZEITEN : MAHLZEITEN.filter(([k]) => k === 'abend');
  const TAGNAMEN = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  // Wocheneinkauf ist freitags (Maike, vormittags). Eine Woche läuft deshalb Fr bis Do.
  const WOCHENBEGINN = 5;
  const LISTEN = [['lidl', 'LIDL'], ['dm', 'DM'], ['heimweg', 'Heimweg'], ['ikea', 'IKEA'], ['baumarkt', 'Baumarkt'], ['apotheke', 'Apotheke']];
  const STANDARDLISTE = 'lidl';

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
  // Jeder Listeneintrag bekommt eine id, damit der Abgleich zwischen Geräten Einträge zusammenführen kann.
  function mitIds(zutaten) { return zutaten.filter(Boolean).map((z, i) => ({ id: 'z' + i, ...z })); }

  let daten = Familie.laden(SPEICHER, null);
  if (!daten || !Array.isArray(daten.gerichte)) {
    daten = { version: 1, gerichte: [], plan: {}, einkauf: {} };
    speichern();
  }
  function speichern() { Familie.speichern(SPEICHER, daten); }

  function gerichtEntfernen(id) {
    daten.gerichte = daten.gerichte.filter(g => g.id !== id);
    for (const [iso, e] of Object.entries(daten.plan)) {
      for (const k of Object.keys(e)) if (e[k] === id) delete e[k];
      if (!Object.keys(e).length) delete daten.plan[iso];
    }
  }

  // Früher gab es zehn erfundene Beispielgerichte (ids "start-…"). Die gehören nicht
  // zur Familiensammlung und werden entfernt, auch aus dem Plan.
  function beispieleEntfernen() {
    const alt = daten.gerichte.filter(g => String(g.id).startsWith('start-'));
    alt.forEach(g => gerichtEntfernen(g.id));
    if (alt.length) speichern();
  }
  beispieleEntfernen();

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
    if (e.detail && String(e.detail.key).startsWith(EINGANG)) {
      if (eingangAbholen()) { if (!$('#gericht-dialog').open && !$('#rezept-dialog').open) zeigeAktuell(); hinweis('Neu von Siri auf der Liste'); }
      return;
    }
    if (e.detail && e.detail.key !== SPEICHER) return;
    const neu = Familie.laden(SPEICHER, null);
    if (!neu || !Array.isArray(neu.gerichte)) return;
    daten = neu;
    if (!$('#gericht-dialog').open && !$('#rezept-dialog').open) zeigeAktuell();
  });

  // ---------- Zustand ----------
  const wocheVon = d => L.wochenStart(d, WOCHENBEGINN);
  let start = wocheVon(new Date());
  // Am letzten Tag der Woche (Do) wird meist schon die nächste geplant.
  if (new Date().getDay() === (WOCHENBEGINN + 6) % 7) start.setDate(start.getDate() + 7);
  let erledigteAusblenden = false;
  let aktuelleListe = STANDARDLISTE;

  const woche = () => L.isoDatum(start);
  const tage = () => L.wochenTage(start);
  const fmt = d => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
  const fmtTag = d => TAGNAMEN[d.getDay()] + ' ' + fmt(d);
  const wochenTitel = () => { const t = tage(); return `${fmtTag(t[0])} – ${fmtTag(t[6])}`; };
  const gericht = id => daten.gerichte.find(g => g.id === id);

  // Einkaufslisten aus der Zeit vor den Fr-Do-Wochen ("2026-W48") auf den Freitag ihrer Woche legen.
  function einkaufUmstellen() {
    let geaendert = false;
    daten.zuordnung = daten.zuordnung || {};
    for (const [k, alt] of Object.entries(daten.einkauf || {})) {
      const m = /^(\d{4})-W(\d\d)$/.exec(k);
      if (!m) continue;
      const montag = L.wochenStart(new Date(+m[1], 0, 4));
      montag.setDate(montag.getDate() + (m[2] - 1) * 7 + 4);
      const neu = L.isoDatum(montag);
      const ziel = daten.einkauf[neu] || (daten.einkauf[neu] = { abgehakt: {}, extra: [] });
      Object.assign(ziel.abgehakt, alt.abgehakt || {});
      ziel.extra = (ziel.extra || []).concat(alt.extra || []);
      delete daten.einkauf[k];
      geaendert = true;
    }
    // Übertrag offener Artikel erst ab der Woche, in der es ihn gibt, damit nicht alte,
    // nie abgehakte Wochen auf einmal auftauchen.
    if (!daten.uebertragAb) { daten.uebertragAb = L.isoDatum(wocheVon(new Date())); geaendert = true; }
    if (geaendert) speichern();
  }
  einkaufUmstellen();

  // Eingangskorb: Der Siri-Kurzbefehl legt beim Abgleich-Dienst Einträge "familie.eingang.<id>"
  // mit dem gesprochenen Text an. Hier werden sie auf die Liste der laufenden Woche gesetzt
  // und danach gelöscht. Feste ids verhindern doppelte Einträge, wenn zwei Handys gleichzeitig abholen.
  const EINGANG = 'familie.eingang.';
  // Text wie „Milch und Butter“ oder „dm: Zahnpasta“ auf die Liste der laufenden Woche setzen.
  function textEintragen(text, idBasis) {
    const k0 = L.isoDatum(wocheVon(new Date()));
    const e = daten.einkauf[k0] || (daten.einkauf[k0] = { abgehakt: {}, extra: [] });
    e.extra = e.extra || [];
    const { liste, posten } = L.eingangLesen(text, LISTEN.map(([id]) => id));
    const namen = [];
    posten.forEach((z, i) => {
      const id = 'siri-' + idBasis + '-' + i;
      if (e.extra.some(x => x.id === id)) return;
      // Der LIDL-Kurzbefehl ist der Standard: gelernte Zuordnungen (Zahnpasta → DM) gelten trotzdem.
      const ziel = (liste && liste !== STANDARDLISTE ? liste : null) || daten.zuordnung[L.namensSchluessel(z.name)] || STANDARDLISTE;
      e.extra.push({ id, ...z, schluessel: 'extra|' + id, liste: ziel });
      namen.push(z.name);
    });
    return namen;
  }

  function eingangAbholen() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(EINGANG)) keys.push(k);
    }
    if (!keys.length) return 0;
    let neu = 0;
    for (const key of keys.sort()) {
      const wert = Familie.laden(key, '');
      const text = typeof wert === 'string' ? wert : (wert && wert.text) || '';
      neu += textEintragen(text, key.slice(EINGANG.length)).length;
      localStorage.removeItem(key);
      if (window.FamilieSync && FamilieSync.aktiv) FamilieSync.aktiv.geaendert(key);
    }
    speichern();
    return neu;
  }
  eingangAbholen();

  // ---------- Woche ----------
  function zeigeWoche() {
    $('#woche-titel').textContent = wochenTitel();
    const heuteIso = L.isoDatum(new Date());
    const sortiert = daten.gerichte.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    $('#tage').replaceChildren(...tage().map((d, i) => {
      const iso = L.isoDatum(d);
      const eintrag = daten.plan[iso] || {};
      return el('div', { class: 'karte tag' + (iso === heuteIso ? ' heute' : '') },
        el('div', { class: 'tagname' }, el('strong', { text: TAGNAMEN[d.getDay()] }), el('span', { class: 'leise', text: fmt(d) })),
        el('div', { class: 'mahlzeiten' }, mahlzeitenAm(d).map(([key, label]) =>
          el('label', { class: 'mahlzeit' }, el('span', { class: 'leise', text: label }),
            el('select', {
              'aria-label': `${TAGNAMEN[d.getDay()]} ${label}`,
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
  function einkaufWoche(k = woche()) {
    const e = daten.einkauf[k] || (daten.einkauf[k] = { abgehakt: {}, extra: [] });
    e.abgehakt = e.abgehakt || {}; e.extra = e.extra || [];
    return e;
  }

  // Alles, was in Woche k neu dazukommt: Zutaten aus dem Plan und selbst eingetragene Artikel.
  function eigenePosten(k) {
    const s0 = new Date(k + 'T00:00');
    const ids = L.wochenTage(s0).flatMap(d => mahlzeitenAm(d).map(([key]) => (daten.plan[L.isoDatum(d)] || {})[key])).filter(Boolean);
    const extra = ((daten.einkauf[k] || {}).extra || []).map(x => ({ ...x, gerichte: [], extra: true }));
    return [...L.einkaufslisteBilden(ids, daten.gerichte), ...extra];
  }

  function wochenBis(k) {
    const ab = daten.uebertragAb;
    if (!ab || k <= ab) return [k];
    const d = new Date(ab + 'T00:00'), liste = [];
    while (L.isoDatum(d) < k) { liste.push(L.isoDatum(d)); d.setDate(d.getDate() + 7); }
    return [...liste, k];
  }

  const listeVon = p => (p.extra && p.liste) || daten.zuordnung[L.namensSchluessel(p.name)] || STANDARDLISTE;

  function postenDerWoche() {
    return L.einkaufMitUebertrag(wochenBis(woche()), eigenePosten, k => (daten.einkauf[k] || {}).abgehakt)
      .map(p => ({ ...p, liste: listeVon(p) }));
  }

  const sortieren = liste => liste.sort((a, b) =>
    L.KATEGORIEN.indexOf(a.kategorie) - L.KATEGORIEN.indexOf(b.kategorie) || a.name.localeCompare(b.name, 'de'));

  function zeigeEinkauf() {
    const t = tage();
    $('#einkauf-titel').replaceChildren(el('div', { text: 'Einkauf ' + fmtTag(t[0]) }),
      el('small', { class: 'leise', text: `für ${fmtTag(t[0])} – ${fmtTag(t[6])}` }));
    const ew = einkaufWoche();
    const alle = postenDerWoche();
    const offenIn = id => alle.filter(p => p.liste === id && !ew.abgehakt[p.pid]).length;
    $('#listen').replaceChildren(...LISTEN.map(([id, name]) => {
      const n = offenIn(id);
      return el('button', { class: 'liste-chip', 'aria-pressed': String(id === aktuelleListe), onclick: () => { aktuelleListe = id; zeigeEinkauf(); } },
        name, n ? el('span', { class: 'anzahl', text: String(n) }) : null);
    }));
    $('#extra-eingabe').placeholder = aktuelleListe === STANDARDLISTE ? 'Noch etwas, z. B. 1 Pck Kaffee' : `Auf ${listenName(aktuelleListe)}, z. B. Zahnpasta`;
    const posten = sortieren(alle.filter(p => p.liste === aktuelleListe));
    if (!posten.length) {
      $('#einkaufsliste').replaceChildren(el('p', { class: 'karte leise', text: aktuelleListe === STANDARDLISTE
        ? 'Noch nichts geplant. Wähle im Reiter „Woche“ Gerichte aus, dann erscheint hier automatisch die Einkaufsliste.'
        : `Auf ${listenName(aktuelleListe)} steht nichts. Trag oben etwas ein oder verschiebe einen Artikel mit ⇄ hierher.` }));
      return;
    }
    const gruppen = new Map();
    for (const p of posten) {
      if (erledigteAusblenden && ew.abgehakt[p.pid]) continue;
      if (!gruppen.has(p.kategorie)) gruppen.set(p.kategorie, []);
      gruppen.get(p.kategorie).push(p);
    }
    const offen = posten.filter(p => !ew.abgehakt[p.pid]).length;
    $('#einkaufsliste').replaceChildren(
      el('p', { class: 'leise zaehler', text: `${offen} von ${posten.length} offen` }),
      ...[...gruppen].map(([kat, liste]) => el('div', { class: 'karte gruppe' },
        el('h3', { text: kat }),
        liste.map(p => {
          const herkunft = p.herkunft !== woche() ? 'noch offen vom Einkauf ' + fmtTag(new Date(p.herkunft + 'T00:00')) : '';
          const info = [herkunft, p.gerichte.join(', ')].filter(Boolean).join(' · ');
          return el('label', { class: 'posten' + (ew.abgehakt[p.pid] ? ' erledigt' : '') + (herkunft ? ' uebertrag' : '') },
            el('input', { type: 'checkbox', checked: !!ew.abgehakt[p.pid], onchange: e => {
              if (e.target.checked) ew.abgehakt[p.pid] = true; else delete ew.abgehakt[p.pid];
              speichern(); zeigeEinkauf();
            } }),
            el('span', { class: 'postentext' },
              el('span', { text: L.zutatSchreiben(p) }),
              info ? el('small', { class: 'leise', text: info }) : null),
            el('button', { class: 'verschieben', 'aria-label': 'Auf andere Liste verschieben', text: '⇄', onclick: e => { e.preventDefault(); verschiebenFragen(p); } }),
            p.extra && !herkunft ? el('button', { class: 'entfernen', 'aria-label': 'Entfernen', text: '×', onclick: e => {
              e.preventDefault();
              ew.extra = ew.extra.filter(x => x.schluessel !== p.schluessel);
              delete ew.abgehakt[p.pid]; speichern(); zeigeEinkauf();
            } }) : null
          );
        })
      ))
    );
  }

  const listenName = id => (LISTEN.find(([i]) => i === id) || [, id])[1];

  // Verschieben merkt sich die Liste pro Zutat: beim nächsten Mal landet sie gleich dort.
  let zuVerschieben = null;
  function verschiebenFragen(p) {
    zuVerschieben = p;
    $('#liste-dialog-titel').textContent = `„${p.name}“ verschieben nach`;
    $('#liste-auswahl').replaceChildren(...LISTEN.map(([id, name]) => el('button', {
      class: 'knopf' + (id === p.liste ? '' : ' zweit'), value: id, text: name
    })));
    $('#liste-dialog').returnValue = '';
    $('#liste-dialog').showModal();
  }
  $('#liste-dialog').addEventListener('close', () => {
    const ziel = $('#liste-dialog').returnValue, p = zuVerschieben;
    zuVerschieben = null;
    if (!p || !LISTEN.some(([id]) => id === ziel) || ziel === p.liste) return;
    if (ziel === STANDARDLISTE) delete daten.zuordnung[L.namensSchluessel(p.name)];
    else daten.zuordnung[L.namensSchluessel(p.name)] = ziel;
    if (p.extra) {
      const x = einkaufWoche(p.herkunft).extra.find(x => x.id === p.id);
      if (x) x.liste = ziel;
    }
    speichern(); zeigeEinkauf();
    hinweis(`Auf ${listenName(ziel)} verschoben`);
  });

  $('#extra-form').addEventListener('submit', e => {
    e.preventDefault();
    const z = L.zutatLesen($('#extra-eingabe').value);
    if (!z) return;
    const id = neueId();
    einkaufWoche().extra.push({ id, ...z, schluessel: 'extra|' + id, liste: aktuelleListe });
    $('#extra-eingabe').value = '';
    speichern(); zeigeEinkauf();
  });

  $('#erledigte-ausblenden').addEventListener('click', e => {
    erledigteAusblenden = !erledigteAusblenden;
    e.target.textContent = erledigteAusblenden ? 'Erledigte zeigen' : 'Erledigte ausblenden';
    zeigeEinkauf();
  });

  $('#einkauf-zurueck').addEventListener('click', () => { start.setDate(start.getDate() - 7); zeigeAktuell(); });
  $('#einkauf-vor').addEventListener('click', () => { start.setDate(start.getDate() + 7); zeigeAktuell(); });

  $('#teilen').addEventListener('click', async () => {
    const ew = einkaufWoche();
    const offen = sortieren(postenDerWoche().filter(p => p.liste === aktuelleListe && !ew.abgehakt[p.pid]));
    const text = L.listeAlsText(`${listenName(aktuelleListe)} · Einkauf ${fmtTag(tage()[0])}`, offen);
    try {
      if (navigator.share) await navigator.share({ title: 'Einkaufsliste ' + listenName(aktuelleListe), text });
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
    const dlg = $('#rezept-dialog');
    dlg.showModal();
    dlg.scrollTop = 0; // showModal fokussiert den Knopf unten und scrollt sonst ans Ende
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
      gerichtEntfernen(inBearbeitung.id);
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
      beispieleEntfernen(); einkaufUmstellen(); speichern(); zeigeAktuell(); hinweis('Import fertig');
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

  // Einfacher Kurzbefehl: öffnet essen/index.html#siri=<Text>. Eintragen, Adresse aufräumen, Liste zeigen.
  function siriAusAdresse() {
    const m = /^#siri=(.*)$/.exec(location.hash);
    if (!m) return false;
    let text = m[1];
    try { text = decodeURIComponent(text.replace(/\+/g, ' ')); } catch { /* Text so nehmen */ }
    if (/codierte url|gefragte eingabe/i.test(text)) {
      history.replaceState(null, '', location.pathname + location.search);
      hinweis('Der Kurzbefehl schickt den Platzhalter statt deiner Worte. Bitte Schritt 3 der Siri-Anleitung prüfen.');
      zeigeAktuell();
      return true;
    }
    const namen = textEintragen(text, 'link-' + Date.now().toString(36));
    speichern();
    history.replaceState(null, '', location.pathname + location.search);
    document.querySelector('.reiter button[data-ansicht="einkauf"]').click();
    hinweis(namen.length ? 'Auf der Liste: ' + namen.join(', ') : 'Nichts erkannt');
    return true;
  }
  window.addEventListener('hashchange', siriAusAdresse);
  if (!siriAusAdresse()) zeigeAktuell();
})();
