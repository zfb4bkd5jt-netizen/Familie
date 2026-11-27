# Familie

Kleine Web-App, die den Mental Load in der Familie verringern soll: Dinge, an die sonst eine Person denken muss, stehen an einem Ort.

## Module

- **Aufgaben & Routinen** (`aufgaben/`): wiederkehrende und einmalige Aufgaben (Müll, Arzttermine, Geburtstage, Elternabende …) mit Zuständigkeit und Erinnerung.

## Benutzen

Keine Installation, kein Build. Einfach `index.html` im Browser öffnen, oder lokal starten:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Die Daten liegen **nur lokal im Browser** dieses Geräts (localStorage). Unter ⚙︎ gibt es *Sicherung herunterladen / einspielen*, damit nichts verloren geht und man die Daten auf ein anderes Gerät übertragen kann.

Erinnerungen: Die App zeigt beim Öffnen, was überfällig, heute oder bald fällig ist. Damit auch bei geschlossener App erinnert wird, lassen sich alle Aufgaben als `.ics` in den Handy-Kalender laden (mit Wiederholung und Alarm).

## Aufbau (für neue Module)

- `index.html`: Startseite, verlinkt die Module.
- `gemeinsam/familie.js`: globales `Familie`-Objekt: `laden(key, fallback)`, `speichern(key, wert)`, `personen()`, `person(id)`, `personHinzufuegen(name)`, `isoDatum(date)`, `ausIso(iso)`, `heute()`, `exportieren()`, `importieren(obj)`.
- `gemeinsam/style.css`: Basis-Styles. Variablen `--hg --karte --text --text-leise --akzent --akzent-text --rand --gefahr --ok --radius`, Klassen `.kopf .inhalt .karte .knopf .knopf.zweit .chip`.
- Jedes Modul in einem eigenen Ordner mit `index.html`. Klassische Scripts, keine ES-Module, damit es auch per Doppelklick (`file://`) läuft.
- localStorage-Schlüssel immer `familie.<modul>.…`, Familienmitglieder unter `familie.personen` als `[{id, name, farbe}]`. Datumswerte als ISO-String `2026-11-30`.
- `aufgaben/aufgaben-daten.js` stellt `Aufgaben.termineZwischen(vonIso, bisIso)` bereit → `[{titel, datum, personId, kategorie, aufgabeId, modul: "aufgaben"}]`, z. B. für eine Kalenderübersicht.
