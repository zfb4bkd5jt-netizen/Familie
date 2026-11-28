# Familie

Kleine Web-App, die den Mental Load in der Familie verringern soll: Dinge, an die sonst eine Person denken muss, stehen an einem Ort.

## Module

- **Aufgaben & Routinen** (`aufgaben/`): wiederkehrende und einmalige Aufgaben (Müll, Arzttermine, Geburtstage, Elternabende …) mit Zuständigkeit und Erinnerung.
- **Essensplan** (`essen/`): Wochenplan fürs Abendessen (Mittag am Wochenende), daraus automatisch die Einkaufsliste nach Supermarkt-Abteilungen, dazu die Familienrezeptsammlung (`essen/rezepte.js`). Tests: `node --test essen/logik.test.js`.
- **Vorrat & Haushalt** (`vorrat/`): häufige Dinge aus Küche, Bad und Haushalt. Ein Tipp auf „fast leer“ setzt den Artikel auf die passende Einkaufsliste des Essensplans (gelernte Zuordnung aus dem Einkauf zählt, sonst die Liste des Artikels, sonst LIDL). Wird er im Einkauf abgehakt, gilt er wieder als da. Daten unter `familie.vorrat.v1`. Tests: `node --test vorrat/logik.test.js`.

- **Schule & Kita** (`kinder/`): pro Kind Nachrichten aus Schul- und Kita-App einfügen (Text oder per Live Text aus einem Screenshot). `kinder/logik.js` findet Daten, Uhrzeiten und „mitbringen/abgeben“ und schlägt Termine und Aufgaben vor, die nach dem Bestätigen als Aufgaben (Kategorie „Schule & Kita“) gespeichert werden und so auch in der Woche erscheinen. Key `familie.kinder.v1`. Tests: `node --test kinder/logik.test.js`.

- **Bring-Plan** (`bringen/`): wer morgens Tilda in die Kita und Benno zur Bushaltestelle bringt. Regelplan je Wochentag, einzelne Tage tauscht man mit einem Tipp auf den Namen (bei zwei Personen ein Tausch, mit Opa reihum), ✕ = fällt aus. Der Bus entfällt in den Schulferien (`HeuteLogik.FERIEN`). Die Heute-Karte zeigt morgens den heutigen Plan, ab 10 Uhr schon den von morgen (samstags nichts, sonntags den Montag). Key `familie.bringen.v1`, `Bringen.termineZwischen(von, bis)` für Wochenansichten. Tests: `node --test bringen/logik.test.js`.

- **Geburtstage & Geschenke** (`geburtstage/`): Geburtstage, Jahrestage und andere Anlässe mit einer Ideenliste pro Anlass. Gekaufte Ideen erscheinen nach dem Anlass unter „Früher geschenkt“. Pro Anlass entsteht eine jährliche Aufgabe „Geschenk für …“, die rechtzeitig vorher fällig wird und sich abhakt, sobald ein Geschenk als gekauft markiert ist. Tests: `node --test geburtstage/geburtstage.test.js`.

- **Woche** (`kalender/`): Wochenansicht mit Google-Kalender-Terminen (nur lesen, jede Person meldet sich auf ihrem Handy mit Google an), Aufgaben und Essen. Termine aus dem Abfallkalender werden automatisch zur Aufgabe „Tonne rausstellen“ am Vorabend. Braucht eine OAuth-Client-ID in `kalender/google.js`. Weil Google reinen Web-Apps nur eine Stunde Zugriff gibt, lässt sich stattdessen ein kleines Google-Apps-Skript im eigenen Konto einrichten (`kalender/skript.html`, Anleitung und Code dort). Dessen Adresse und geheimer Schlüssel werden unter `familie.kalender.skript` mit allen Handys geteilt, dann braucht niemand mehr eine Anmeldung.

- **Heute** (`heute/`, auf der Startseite): Hinweise wie „Benno hat Sport“ (Mo + Do, nicht in den Ferien), heutige Google-Termine, überfällige und heute fällige Aufgaben zum Abhaken und das Essen des Tages. Feste Hinweise und Ferien stehen in `heute/heute-logik.js`. Tests: `node --test heute/heute-logik.test.js`.

- **Benachrichtigungen** (`gemeinsam/benachrichtigungen.html`, Startseite → 🔔): Push-Erinnerungen aufs Handy, auch wenn die App zu ist. Gegen 6:30 Uhr, was heute ansteht (wer bringt laut Bring-Plan, Hinweise wie Sport, heute fällige und überfällige Aufgaben, also auch Müll und Geschenke vor Geburtstagen), gegen 19:30 Uhr, was man für morgen vorbereiten muss. Pro Handy wählbar: wer es nutzt (Aufgaben anderer Personen kommen dann nicht) und welche Uhrzeiten. Auf dem iPhone nur aus der App auf dem Home-Bildschirm (ab iOS 16.4).
  - Technik: Standard-Web-Push (VAPID), kein eigener Server. `sw.js` (Service Worker) zeigt die Nachrichten, `gemeinsam/push.js` legt das Abo an und speichert das Gerät im synchronisierten Key `familie.push.v1` = `[{id, name, personId, morgens, abends, abo}]`. `push/nachrichten.js` baut den Text, `push/senden.js` läuft per GitHub Actions (`.github/workflows/push.yml`, zweimal morgens und abends wegen Sommer-/Winterzeit, jede Runde nur einmal am Tag, gemerkt im Firestore-Dokument `push.status`), liest die Familiendaten per Firestore-REST und verschickt. Abgelaufene Abos werden entfernt.
  - Einrichtung: Repository-Secrets `FAMILIE_CODE` (aus dem Einladungslink hinter `#familie=`) und `VAPID_PRIVATE_KEY` (passt zum öffentlichen Schlüssel in `push/nachrichten.js`). Test: Actions → „Push-Benachrichtigungen“ → Run workflow → `test`. Tests: `node --test push/nachrichten.test.js`.

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
- `geburtstage/geburtstage-daten.js` stellt `Anlaesse.termineZwischen(vonIso, bisIso)` bereit → `[{titel, datum, art, anlassId, modul: "geburtstage"}]` und `Anlaesse.demnaechst()` (sortiert, mit `tage` bis zum Anlass), z. B. für eine Heute-Ansicht.
