# Familie

Kleine Web-App, die den Mental Load in der Familie verringern soll: Dinge, an die sonst eine Person denken muss, stehen an einem Ort.

## Module

- **Aufgaben & Routinen** (`aufgaben/`): wiederkehrende und einmalige Aufgaben (Müll, Arzttermine, Geburtstage, Elternabende …) mit Zuständigkeit und Erinnerung.
- **Essensplan** (`essen/`): Wochenplan fürs Abendessen (Mittag am Wochenende), daraus automatisch die Einkaufsliste nach Supermarkt-Abteilungen, dazu die Familienrezeptsammlung (`essen/rezepte.js`). Tests: `node --test essen/logik.test.js`.

- **Woche** (`kalender/`): Wochenansicht mit Google-Kalender-Terminen (nur lesen, jede Person meldet sich auf ihrem Handy mit Google an), Aufgaben und Essen. Termine aus dem Abfallkalender werden automatisch zur Aufgabe „Tonne rausstellen“ am Vorabend. Braucht eine OAuth-Client-ID in `kalender/google.js`.

- **Heute** (`heute/`, auf der Startseite): Hinweise wie „Benno hat Sport“ (Mo + Do, nicht in den Ferien), heutige Google-Termine, überfällige und heute fällige Aufgaben zum Abhaken und das Essen des Tages. Feste Hinweise und Ferien stehen in `heute/heute-logik.js`. Tests: `node --test heute/heute-logik.test.js`.

## Benutzen

Keine Installation, kein Build. Einfach `index.html` im Browser öffnen, oder lokal starten:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Die Daten liegen im Browser (localStorage). Unter ⚙︎ gibt es *Sicherung herunterladen / einspielen*.

**Handys verbinden:** Über *Handys verbinden* auf der Startseite startet man eine Familie und schickt den Einladungslink an die anderen. Danach werden alle Listen über Firebase Firestore abgeglichen (`gemeinsam/sync.js`, `gemeinsam/sync-firebase.js`). Änderungen werden per Drei-Wege-Merge zusammengeführt, nicht überschrieben, sodass z. B. gleichzeitiges Abhaken auf zwei Handys erhalten bleibt. Ohne Netz wird lokal weitergearbeitet und später nachgeladen.

Erinnerungen: Die App zeigt beim Öffnen, was überfällig, heute oder bald fällig ist. Damit auch bei geschlossener App erinnert wird, lassen sich alle Aufgaben als `.ics` in den Handy-Kalender laden (mit Wiederholung und Alarm).

## Aufbau (für neue Module)

- `index.html`: Startseite, verlinkt die Module.
- `gemeinsam/logo.svg`: Team-Bieler-Logo (nach Maikes T-Shirt-Design). App-Icons in `gemeinsam/icons/`, `manifest.webmanifest` für „Zum Home-Bildschirm“.
- `gemeinsam/familie.js`: globales `Familie`-Objekt: `laden(key, fallback)`, `speichern(key, wert)`, `personen()`, `person(id)`, `personHinzufuegen(name)`, `isoDatum(date)`, `ausIso(iso)`, `heute()`, `exportieren()`, `importieren(obj)`.
- `gemeinsam/style.css`: Basis-Styles. Variablen `--hg --karte --text --text-leise --akzent --akzent-text --rand --gefahr --ok --radius`, Klassen `.kopf .inhalt .karte .knopf .knopf.zweit .chip`.
- Jedes Modul in einem eigenen Ordner mit `index.html`. Klassische Scripts, keine ES-Module, damit es auch per Doppelklick (`file://`) läuft.
- localStorage-Schlüssel immer `familie.<modul>.…`, Familienmitglieder unter `familie.personen` als `[{id, name, farbe}]`. Datumswerte als ISO-String `2026-11-30`.
- Abgleich: Jeder `familie.*`-Key wird synchronisiert, außer Keys mit `.geraet.` (nur dieses Gerät). Einträge in Listen brauchen ein `id`-Feld, damit sie einzeln zusammengeführt werden. Kommen Daten von einem anderen Gerät an, feuert `window` das Event `familie:aktualisiert` (`detail.key`); Module zeichnen dann neu. Script-Reihenfolge: `familie.js`, `sync-firebase.js`, `sync.js`, dann die Modul-Scripts.
- Tests für den Abgleich: `node tests/sync.test.js`.
- `aufgaben/aufgaben-daten.js` stellt `Aufgaben.termineZwischen(vonIso, bisIso)` bereit → `[{titel, datum, personId, kategorie, aufgabeId, modul: "aufgaben"}]`, z. B. für eine Kalenderübersicht.
