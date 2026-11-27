// Familienrezeptsammlung. Neue Rezepte hier anhängen; die App übernimmt jedes Rezept einmal
// in die Gerichte (Zuordnung über die feste id, deshalb ids nie ändern).
// Felder: id, name, quelle, portionen, schnell, zutaten (eine Zeile pro Zutat), zubereitung (ein Schritt pro Zeile).
// Salz, Pfeffer, Wasser, Öl und Fett stehen im Rezept, kommen aber nicht auf die Einkaufsliste.
window.FAMILIEN_REZEPTE = [
  {
    id: 'rezept-curry-linsen-topf',
    name: 'Curry-Linsen-Topf',
    portionen: null,
    zutaten: ['6 Kartoffeln', '1 Zwiebel', '1 Dose Frühstücksfleisch', '1 Dose Linsen mit Suppengrün', '1 TL Instantbrühe', '4 Bananen', '½ Becher Crème fraîche', 'Curry', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Kartoffeln würfeln und in Salzwasser garkochen.',
      'Zwiebel würfeln und anbraten. Frühstücksfleisch würfeln und dazugeben.',
      'Linsen mit Suppengrün dazugeben. Etwa eine halbe Dose Wasser mit 1 TL Instantbrühe dazugeben und einmal aufkochen lassen.',
      'In der Zeit 3–4 Bananen in Scheiben schneiden, mit Curry bestreuen und nach dem Aufkochen in den Topf geben.',
      'Mit einem halben Becher Crème fraîche, Salz und Pfeffer abschmecken.',
      'Die Kartoffelwürfel zur Suppe geben.'
    ].join('\n')
  },
  {
    id: 'rezept-partysuppe',
    name: 'Partysuppe',
    portionen: 5,
    zutaten: ['500 g Hackfleisch', '1 rote Paprika', '1 Zwiebel', '1 Dose Mais', '1 Dose Kidneybohnen', '½ Flasche Salsasauce', '1 Pck Sahneschmelzkäse', '1 Becher Sahne', '1 Pck passierte Tomaten', 'Pizzagewürz', 'Salz', 'Pfeffer', 'Brühe (optional, zum Verlängern)'],
    zubereitung: [
      'Paprika und eine große Zwiebel würfeln.',
      'Das Hackfleisch mit den Zwiebeln krümelig anbraten.',
      'Alle weiteren Zutaten unterrühren, herzhaft würzen und aufkochen.',
      'Ein paar Stunden ziehen lassen und evtl. nachwürzen. Bei Bedarf mit Brühe verlängern.'
    ].join('\n')
  },
  {
    id: 'rezept-tortellinisalat',
    name: 'Lieblings-Tortellinisalat',
    portionen: null,
    zutaten: ['500 g Tortellini', '200 g gekochter Schinken', '300 g Tomaten', '300 g Zucchini', '1 Lauchzwiebel', '1 Zwiebel', '1 Glas Miracle Whip', '1 Becher saure Sahne', '1 TL Instantbrühe', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Tortellini nach Anweisung kochen und abtropfen lassen.',
      'Eine kleine (oder halbe) Zwiebel würfeln, mit etwas Wasser übergießen und mit einem gehäuften TL Instantbrühe aufkochen lassen.',
      'Während die Zwiebelbrühe abkühlt, Schinken, Tomaten, Zucchini und die große Lauchzwiebel kleinschneiden und mit den Tortellini in eine große Schüssel geben.',
      'Miracle Whip und saure Sahne in eine hohe Schüssel geben. Das leere Glas mit dem Zwiebelsud füllen, um den letzten Rest herauszubekommen, und ebenfalls in die hohe Schüssel geben.',
      'Mit Salz und Pfeffer abschmecken, zu den Tortellini geben und vermengen.'
    ].join('\n')
  },
  {
    id: 'rezept-mexikanischer-schichtsalat',
    name: 'Mexikanischer Schichtsalat',
    portionen: null,
    zutaten: ['1 Eisbergsalat', '4 Tomaten', '600 g Hackfleisch', '1 Zwiebel', '1 Flasche Salsasauce', '1 Dose Mais', '1 Dose Kidneybohnen', '2 Becher saure Sahne', '200 g Gouda', '1 Tüte Tortillachips', 'Knoblauch (optional)', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Das Hackfleisch mit der Zwiebel und etwas Salz und Pfeffer (evtl. auch Knoblauch) anbraten.',
      'Den Salat klein schneiden und in eine große Schüssel geben. Am schönsten sieht eine Glasschüssel aus.',
      'Darauf die gewürfelten großen Tomaten geben und mit dem Hackfleisch bedecken.',
      'Darüber eine Flasche Salsa schütten, am besten eine große. Achtung: Nicht durchrühren, es ist ein Schichtsalat!',
      'Darüber eine Dose Mais und eine Dose Kidneybohnen, darüber die 2 Becher saure Sahne. Über die saure Sahne den geriebenen Käse streuen, bis alles bedeckt ist.',
      'Am besten schon ein paar Stunden vorher zubereiten, damit alles schön durchziehen kann.',
      'Vor dem Servieren die Tortillachips etwas zerbröckeln und darüberstreuen.'
    ].join('\n')
  },
  {
    id: 'rezept-kartoffelsalat',
    name: 'Kartoffelsalat',
    portionen: null,
    zutaten: ['2 kg Kartoffeln', '2 Zwiebeln', '250 ml Brühe', '1 TL Senf', 'Zucker', '500 ml Mayonnaise', '5 Eier', 'Gewürzgurken', 'Fleischwurst', 'Tomaten (optional, zum Garnieren)', 'Petersilie (optional, zum Garnieren)', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Pellkartoffeln schon am Vortag kochen, abgekühlt schälen, aber ganz lassen und am besten mit einem sauberen Tuch abgedeckt kühl stellen.',
      'Am nächsten Tag nach Geschmack weitere Zutaten vorbereiten, z. B. 5 gekochte Eier, kleingewürfelte Gewürzgurken (nicht zu sauer, gern Spreewälder Art) und/oder kleingewürfelte Fleischwurst. Also zuerst die Eier kochen und kalt werden lassen, dann die anderen Zutaten klein würfeln.',
      'Die Pellkartoffeln in ziemlich dünne Scheiben schneiden.',
      'Die Brühe mit den ganz fein gehackten großen Zwiebeln, eingerührtem Senf, Salz, Pfeffer und Zucker in einem kleinen Topf aufkochen lassen.',
      'Etwas abkühlen lassen und über die Kartoffeln gießen. Kurz einziehen lassen, dann Eier, Gurken usw. zugeben.',
      'Gut durchziehen lassen und erst dann die Mayonnaise unterheben.',
      'Ggf. mit Eiern, Tomaten, Gewürzgurken und Petersilie garnieren.'
    ].join('\n')
  },
  {
    id: 'rezept-brokkoli-paprika-apfel-salat',
    name: 'Brokkoli-Paprika-Apfel-Salat',
    portionen: null,
    schnell: true,
    zutaten: ['250 g Brokkoli', '2 rote Paprika', '2 Äpfel', '30 g Öl', '15 g Essig oder Zitronensaft', '1 EL Senf', '1 TL Honig', '1 TL Salz', '½ TL Pfeffer', '2 EL Sonnenblumenkerne (optional)'],
    zubereitung: [
      'Öl, Essig oder Zitronensaft, Senf, Honig, Salz und Pfeffer für die Soße in eine große Schüssel geben und gut verrühren.',
      'Brokkoli roh in Röschen ohne Strunk zerteilen. Gemüse und Äpfel in kleine Stückchen schneiden und ebenfalls in die Schüssel geben.',
      'Umrühren und sofort servieren. Wer möchte, garniert mit ca. 2 EL Sonnenblumenkernen.'
    ].join('\n')
  },
  {
    id: 'rezept-schinken-nudelauflauf',
    name: 'Schinken-Nudelauflauf',
    portionen: 5,
    zutaten: ['500 g Nudeln', '4 Eier', '200 g gekochter Schinken', '500 g mittelalter Gouda', '1 Becher Sahne', '1 Becher Milch', '1 Prise Muskat', '1 TL Instantbrühe', 'Butter', '1 TL Salz', 'Pfeffer'],
    zubereitung: [
      'Dauert ca. 90 Minuten, reicht für 4–5 Personen.',
      'Nudeln kochen, Auflaufform einfetten.',
      'Schinken würfeln und mit den Nudeln und etwas geriebenem Käse in der Auflaufform vermischen.',
      'Den restlichen Käse grob reiben und darüber verteilen.',
      'Soße: 4 Eier, 1 Becher Sahne und 1 Becher Milch (den leeren Sahnebecher nehmen) in einem hohen Gefäß mit dem Schneebesen verquirlen. Mit einer Prise Muskat, etwas Pfeffer, 1 TL Salz und 1 TL Instantbrühe würzen.',
      'Soße über die Schinkennudeln geben und Butterflöckchen darauf verteilen.',
      'Bei 180 °C Umluft ca. 50 Min. backen. Evtl. abdecken, wenn der Käse zu dunkel wird. Fertig :)'
    ].join('\n')
  },
  {
    id: 'rezept-spargelpasta-in-cremesauce',
    name: 'Spargelpasta in Cremesauce',
    portionen: 4,
    zutaten: ['500 g Fusilli', '500 g grüner Spargel', '6 Möhren', '4 Frühlingszwiebeln', '3 EL Olivenöl', '100 ml Weißwein', '400 ml Schlagsahne', 'Parmesan', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Frühlingszwiebeln putzen, das Weiße und Hellgrüne schräg in Stücke schneiden. Spargelenden abschneiden und den Spargel ebenfalls schräg in Stücke schneiden.',
      'Möhren (ca. 500 g) schälen und in Streifen schneiden oder mit dem Sparschäler der Länge nach in breite Streifen hobeln.',
      'Nudeln kochen und in der Zwischenzeit Öl in einer Pfanne erhitzen. Gemüse darin 3–4 Minuten braten, salzen und pfeffern.',
      'Mit Wein ablöschen, Sahne angießen und aufkochen lassen.',
      'Pasta abgießen, abtropfen lassen und unter die Sauce mischen. Salzen, pfeffern und mit geriebenem Parmesan anrichten.'
    ].join('\n')
  },
  {
    id: 'rezept-hackfleisch-nudelauflauf',
    name: 'Hackfleisch-Nudelauflauf',
    portionen: null,
    zutaten: ['500 g Bandnudeln', '2 Zwiebeln', '500 g Hackfleisch', '6 EL Tomatenmark', '250 ml Rotwein', '1 TL Thymian (getrocknet)', '½ TL Cayennepfeffer', '2 Becher Schlagsahne', '200 g Gouda (gerieben)', 'Olivenöl', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Nudeln kochen und die großen Zwiebeln fein würfeln.',
      'Öl in einer Pfanne erhitzen, Zwiebeln darin kurz andünsten. Gemischtes Hackfleisch zufügen und kräftig anbraten.',
      'Tomatenmark unterrühren und mit Wein ablöschen. Mit Thymian, Cayennepfeffer und Salz würzen und ca. 5 Min. köcheln lassen.',
      'Nudeln abtropfen lassen, mit der Hackfleischsauce mischen und nochmals abschmecken.',
      'In eine gefettete Auflaufform geben, Sahne und Käse darauf verteilen.',
      'Im heißen Ofen bei 220 °C (Umluft 200 °C) 15–20 Min. überbacken.'
    ].join('\n')
  },
  {
    id: 'rezept-italienischer-wundertopf',
    name: 'Italienischer Wundertopf (One-Pot-Pasta)',
    portionen: 3,
    schnell: true,
    zutaten: ['1 Zwiebel', '1 Zehe Knoblauch', '250 g Farfalle', '150 g Spinat', '1 Dose gehackte Tomaten', 'Gemüsebrühe (1½ Dosen, mit der Tomatendose abmessen)', 'Basilikum (1 Handvoll)', '2 TL Majoran', '2 EL Frischkäse', 'Parmesan', 'Olivenöl', 'Cayennepfeffer oder Chilipulver', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Reicht für 2–3 Personen.',
      'Zwiebel schälen und in kleine Würfel schneiden. Olivenöl in einem großen Topf erhitzen und die Zwiebeln darin anbraten.',
      'In der Zwischenzeit den Knoblauch schälen, fein hacken und kurz mit anbraten.',
      'Die restlichen Zutaten (ohne Parmesan und Basilikum) dazugeben und die Nudeln gar kochen lassen.',
      'Kurz vor Ende das klein geschnittene Basilikum hinzugeben. Mit Salz, Pfeffer und Cayennepfeffer (oder Chilipulver) abschmecken.',
      'Mit frisch geriebenem Parmesan servieren.'
    ].join('\n')
  },
  {
    id: 'rezept-nils-holgerson',
    name: 'Nils Holgerson',
    portionen: null,
    schnell: true,
    zutaten: ['500 g Spaghetti', '1 Zwiebel', '400 g Wiener Würstchen', 'TK-Erbsen und Möhren (1 große Müslischale)', '2 EL Tomatenmark', '250 ml Wasser', '½ Becher Sahne', 'Brühe', 'italienische Kräuter', 'Speisestärke (optional)', 'Reibekäse', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Eine große Müslischale voll TK-Erbsen und Möhren (frische Möhren gehen auch) in Wasser ca. 7 Min. in der Mikrowelle vorgaren.',
      'Die kleine Zwiebel und die Würstchen schneiden. Das gegarte Gemüse mit den Zwiebeln in einem Topf mit Öl anbraten. Die Würstchen hinzugeben und weiterbraten.',
      'Parallel die Nudeln kochen.',
      'Tomatenmark kurz mit dem Gemüse-Wurst-Gemisch angehen lassen und mit dem Wasser (oder Brühe) ablöschen.',
      'Die Sahne hinzugeben und mit Salz, Pfeffer, Paprika, Petersilie, Oregano, Basilikum, Majoran und Thymian abschmecken. Ggf. die Soße mit Speisestärke andicken.',
      'Die Soße in einem Spaghetti-Nest anrichten und mit geriebenem Käse bestreuen.'
    ].join('\n')
  },
  {
    id: 'rezept-tortelloniauflauf',
    name: 'Blitzschneller Tortelloniauflauf',
    portionen: null,
    zutaten: ['2 Pck Tortelloni (je 400 g, Ricotta-Spinat und Fleisch)', '1 Pck passierte Tomaten', '1 Dose gehackte Tomaten', '½ Becher Sahne', 'TK-Erbsen', 'TK-Rahmspinat', '250 g Reibekäse (Gouda oder Mozzarella)', 'italienische Kräuter', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Passierte und gehackte Tomaten mit der Sahne in eine Auflaufform geben, mit Salz, Pfeffer und italienischen Kräutern (Basilikum, Oregano, Majoran, Thymian …) würzen und gut verrühren.',
      'Die frischen Tortelloni dazugeben und alles nochmal verrühren.',
      'TK-Erbsen und Rahmspinatwürfel nach Geschmack darüber verteilen und mit Käse bestreuen.',
      'Für etwa 30 Min. bei 180 °C Umluft in den Ofen geben.'
    ].join('\n')
  },
  {
    id: 'rezept-one-pot-pasta-champignons',
    name: 'One-Pot-Pasta mit Champignons',
    portionen: 3,
    schnell: true,
    zutaten: ['250 g braune Champignons', '2 Tomaten', '2 Zehen Knoblauch', '1 Stange Lauch', '1 rote Chilischote', '50 g Pinienkerne', '250 g Spaghetti', '150 g Ziegenfrischkäse', '500 ml Gemüsebrühe', '1 Bund Basilikum', '60 g Parmesan', 'Zitrone (für den Abrieb)', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Die Pinienkerne in den Topf geben und kurz rösten, bis sie rundum braun sind (Achtung: verbrennen schnell!).',
      'Währenddessen das Gemüse putzen und klein schneiden: Pilze in Scheiben, Tomaten in Würfel, Lauch in dünne Ringe. Die Chilischote entkernen und in feine Ringe schneiden. 1–2 Knoblauchzehen schälen und fein hacken.',
      'Die Spaghetti halbieren und in den Topf geben. Das Gemüse darauf verteilen, Zitronenabrieb, Frischkäse und Pinienkerne dazugeben und alles mit Gemüsebrühe auffüllen.',
      'Zum Kochen bringen und unter regelmäßigem Rühren ca. 15 Min. köcheln lassen, bis die Flüssigkeit fast komplett eingekocht ist und die Nudeln noch bissfest sind.',
      'Währenddessen das Basilikum grob hacken, den Parmesan hobeln und zum Schluss unter die Pasta rühren. Mit Salz und Pfeffer abschmecken.'
    ].join('\n')
  },
  {
    id: 'rezept-senfeier',
    name: 'Senfeier',
    portionen: 4,
    schnell: true,
    zutaten: ['6 Eier', '200 g gekochter Schinken', '1 EL Fett', '1 EL Mehl', '250 ml Brühe', 'Sahne', 'Zwiebelpulver', '1 TL Senf', 'Kartoffeln (als Beilage)', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Eier kochen. Schinken würfeln.',
      'Aus Fett und Mehl eine Mehlschwitze bereiten und mit ca. ¼ l Brühe ablöschen.',
      'Sahne und den gewürfelten Schinken hinzufügen. Mit Salz, Pfeffer, gemahlenen Zwiebeln und 1 TL Senf würzen.',
      'Eier pellen und kurz vor dem Servieren in die Soße geben.',
      'Dazu gekochte Kartoffeln reichen.'
    ].join('\n')
  },
  {
    id: 'rezept-pizza-strudel',
    name: 'Pizza-Strudel',
    portionen: 3,
    zutaten: ['1 Pck Blätterteig (Kühlregal, rechteckig)', '5 Scheiben Schinken', 'Käse (Pizza- oder Toastkäse)', '½ Dose Mais', 'Tomaten (optional)', 'Zwiebel (optional)', '1 Ei'],
    zubereitung: [
      'Reicht für ca. 2–3 Portionen.',
      'Den Teig ausbreiten, Schinkenscheiben, Mais und Käse darauflegen und zu einem Strudel zusammenrollen. Die Seiten aufklappen.',
      'Mit dem verquirlten Ei bestreichen und ca. 20 Min. bei 150–200 °C im Ofen backen, bis er goldbraun ist.',
      'Unter den Käse können noch Tomatenscheiben, Zwiebeln, Kapern usw., der Fantasie sind keine Grenzen gesetzt!'
    ].join('\n')
  },
  {
    id: 'rezept-gemuese-focaccia-feta',
    name: 'Gemüse-Focaccia mit Feta',
    portionen: 4,
    zutaten: ['1 Zehe Knoblauch', '500 g Joghurt (natur)', '1 Zucchini', '2 kleine Paprika (z. B. gelb und rot)', '3 Möhren', '1 Zwiebel', '1 EL Tiefkühlkräuter-Mix', '150 g Feta', '4 Focaccia-Brötchen (oder 1 großes Fladenbrot)', '200 g gekochter Schinken (2 dicke Scheiben)', 'Cayennepfeffer', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Knoblauch schälen und hacken, mit den TK-Kräutern, dem Joghurt und dem zerbröckelten Feta verrühren. Mit Salz und (weißem) Pfeffer abschmecken.',
      'Gemüse (mittelgroße Zucchini, 2–3 Möhren, ca. 300 g, und die kleine Zwiebel) putzen bzw. schälen und klein schneiden.',
      'Mit den Zwiebeln in einer Pfanne mit Öl unter Wenden 5–6 Minuten dünsten. Mit Salz und Cayennepfeffer abschmecken.',
      'Focaccia (oder Fladenbrot) aufschneiden und mit dem Gemüse, dem Schinken (ca. 200–250 g) und der Joghurtsoße belegen.'
    ].join('\n')
  },
  {
    id: 'rezept-kartoffelpfanne-gruener-spargel',
    name: 'Kartoffelpfanne mit grünem Spargel',
    portionen: 4,
    zutaten: ['1,5 kg kleine neue Kartoffeln', '500 g grüner Spargel', '1 Bund Frühlingszwiebeln', '125 g Baconwürfel', '3 EL Olivenöl', 'Parmesan', 'Kräuterquark', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Kartoffeln unter fließendem Wasser abbürsten und in Salzwasser ca. 8 Minuten vorkochen.',
      'Spargel (im unteren Drittel schälen und) Enden abschneiden. Stangen schräg in 5 cm große Stücke und Frühlingszwiebeln in Ringe schneiden.',
      'Kartoffeln abgießen, abschrecken und längs halbieren.',
      'Öl in einer großen Pfanne erhitzen, erst die Kartoffeln ca. 5 Min. rundum anbraten. Spargel, Bacon und Frühlingszwiebeln zugeben, salzen und pfeffern und ca. 10 Minuten unter Wenden weiterbraten.',
      'Parmesan darüberhobeln und mit Kräuterquark (der von Lidl) servieren.'
    ].join('\n')
  },
  {
    id: 'rezept-nasi-goreng',
    name: 'Nasi Goreng',
    portionen: 4,
    schnell: true,
    zutaten: ['Reis (1 großer Pott und etwas extra)', '200 g gekochter Schinken', '3 rote Paprika', '1 Stange Porree', '5 Eier', '1 EL Curry', 'Sojasauce', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Reis wie gewohnt kochen, in der Zwischenzeit die restlichen Zutaten (2–3 Paprika) klein schneiden.',
      'Den gekochten Reis mit Schinken, Paprika und Porree in Öl anbraten.',
      'Die Eier hinzugeben und stocken lassen.',
      'Mit Curry, Sojasauce nach Belieben, Salz und Pfeffer würzen.'
    ].join('\n')
  },
  {
    id: 'rezept-suesskartoffel-curry',
    name: 'Süßkartoffel-Curry mit Kokosmilch',
    portionen: 4,
    zutaten: ['1 Süßkartoffel', '1 Zwiebel', '3 Zehen Knoblauch', 'Ingwer (1 kleines Stück)', '1 rote Chili', '1 Dose gehackte Tomaten', '1 Dose Kichererbsen', '1 Dose Kokosmilch', 'Koriander oder Petersilie (frisch)', '1 TL Kurkuma', '1 TL Kreuzkümmel', '1 TL gemahlener Koriander', '1 TL Zimt', '1 TL Nelkenpulver', 'Reis', 'Olivenöl', 'Cayennepfeffer oder Chilipulver (optional)', 'Salz'],
    zubereitung: [
      'Kichererbsen in ein Sieb geben und unter fließendem Wasser abspülen.',
      'Zwiebel würfeln, 2–3 Knoblauchzehen, Ingwer und Chili kleinhacken.',
      'Öl in einer großen Pfanne erhitzen und die Zwiebeln 3–4 Min. darin anschwitzen. In der Zwischenzeit die Süßkartoffel schälen und würfeln.',
      'Knoblauch, Ingwer und Chili dazugeben und auch die Gewürze (je ½–1 TL Kurkuma, Kreuzkümmel, Koriander, Zimt, Nelkenpulver) kurz in der Pfanne angehen lassen.',
      'Mit den Tomaten ablöschen, Kichererbsen und Kokosmilch dazugeben. Die Süßkartoffelwürfel hinzugeben (sie sollten von der Soße bedeckt sein) und 25–45 Min. köcheln lassen, bis die Süßkartoffel durch ist.',
      'Währenddessen den Reis kochen.',
      'Zum Schluss mit Salz, Zimt und ggf. Cayennepfeffer oder Chilipulver abschmecken. Mit dem Reis anrichten und mit frischem Koriander garnieren.'
    ].join('\n')
  },
  {
    id: 'rezept-gebackene-suesskartoffel',
    name: 'Gebackene Süßkartoffel aus dem Ofen',
    portionen: 2,
    zutaten: ['2 Süßkartoffeln', '1 Kugel Büffelmozzarella', '2 rote Chilis', 'Basilikum (frisch)', 'Zitrone (für frischen Saft)', 'Olivenöl', 'Salz'],
    zubereitung: [
      'Reicht für 2 Personen.',
      'Mozzarella aus dem Kühlschrank holen, Ofen auf 180 °C Umluft vorheizen.',
      'Süßkartoffeln gut abwaschen, in eine Ofenform geben, mit Öl beträufeln und kräftig salzen. Mit der Hand beides nochmal gut einreiben.',
      'Mit einer Gabel mehrfach einstechen und ca. 45–60 Min. in den Ofen geben. Sie sind gar, wenn man mit der Gabel bis zur Mitte kommt.',
      'In der Zwischenzeit 1–2 Chilis klein hacken und den Mozzarella klein schneiden.',
      'Die Kartoffeln aus dem Ofen nehmen, mit Mozzarella, Chili und gezupftem Basilikum belegen. Mit frischem Zitronensaft beträufeln und ggf. etwas salzen.'
    ].join('\n')
  },
  {
    id: 'rezept-suesskartoffelbratlinge-erbsen',
    name: 'Süßkartoffelbratlinge mit Erbsen',
    portionen: null,
    zutaten: ['400 g Süßkartoffeln', '100 g Kartoffeln', '100 g TK-Erbsen', '3 EL Haferflocken', 'Kurkuma', 'gemahlener Koriander', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Aus dem BLW-Teil (Baby-led Weaning) des Rezeptbuchs.',
      'Süßkartoffeln und Kartoffeln schälen, in 2 cm große Würfel schneiden und in einem kleinen Topf mit Wasser ca. 20 Min. weich kochen.',
      'In ein Sieb schütten, sehr gut abtropfen lassen und in einer Schüssel mit einer Gabel oder dem Kartoffelstampfer zerdrücken.',
      'In der Zwischenzeit die TK-Erbsen in einen Messbecher geben, mit kochendem Wasser übergießen (etwa doppelt so hoch wie die Erbsen) und ca. 7 Min. stehen lassen. Dann ebenfalls abtropfen lassen.',
      'Zum Brei die Haferflocken und gewünschte Gewürze geben und gut verrühren. Anschließend die Erbsen unterheben.',
      'Mit den Händen Bratlinge formen, etwa 5–6 cm Durchmesser und 1 cm hoch.',
      'Entweder in der Pfanne bei mittlerer Hitze in Öl braten oder im Ofen bei 175–200 °C backen.'
    ].join('\n')
  },
  {
    id: 'rezept-erbsenpfannkuchen-kleinkinder',
    name: 'Erbsenpfannkuchen für Kleinkinder',
    portionen: null,
    schnell: true,
    zutaten: ['100 ml Mineralwasser (spritzig)', '200 g TK-Erbsen (oder frisch)', '1 Ei', '100 g Vollkornmehl', '½ TL Backpulver', '30 g Feta (optional)', '3 TL Petersilie (optional)', 'Öl'],
    zubereitung: [
      'Aus dem BLW-Teil des Rezeptbuchs, reicht für 2 Kleinkinder. Für Babys nur wenig oder gar keinen Feta (20–40 g).',
      'Tiefgekühlte Erbsen zum Auftauen mit kochendem Wasser übergießen, danach das Wasser gut abgießen.',
      'Alle Zutaten mit dem Pürierstab oder Standmixer zu einem gleichmäßigen Teig pürieren.',
      'In einer Pfanne mit Öl von jeder Seite 3–4 Minuten goldbraun ausbacken. Alternativ geht auch ein Waffeleisen.',
      'Oder im Backofen: Blech mit Backpapier auslegen (dünn mit Öl einpinseln, dann löst es sich besser), Teig ca. 0,5 cm dick ausstreichen und bei 180 °C Ober-/Unterhitze 15–20 Min. backen.',
      'Halten sich 3–4 Tage in einer luftdichten Dose im Kühlschrank und lassen sich bis zu 3 Monate einfrieren.'
    ].join('\n')
  },
  {
    id: 'rezept-teuflisches-sauerkraut',
    name: 'Teuflisches Sauerkraut',
    portionen: 4,
    zutaten: ['500 g Hackfleisch', '1 Dose Sauerkraut (400 g)', '1 Dose geschälte Tomaten (400 g)', '1 Zwiebel', '0,5 l Instantbrühe', '1 EL Öl', '1 EL Tomatenmark', '1 EL Mehl', '1 EL Tomatenketchup', 'Essig', 'Oregano', 'Kümmel (gemahlen)', 'Kartoffeln (als Beilage)', 'Pfeffer'],
    zubereitung: [
      'Sauerkraut aus der Dose vorher in einem Sieb abspülen.',
      'Öl erhitzen, gehackte Zwiebel (ca. 100 g) und Hackfleisch darin anbraten.',
      'Sauerkraut und gewürfelte Tomaten dazugeben, mit heißer Brühe auffüllen und etwa 15 Minuten kochen lassen.',
      'Mit etwas Mehl binden und mit den Gewürzen (Ketchup, Essig, Oregano, Kümmel, Pfeffer) kräftig süßsauer abschmecken.',
      'Dazu Kartoffeln. Lecker!'
    ].join('\n')
  },
  {
    id: 'rezept-schneller-flammkuchen',
    name: 'Schneller Flammkuchen',
    portionen: 3,
    schnell: true,
    zutaten: ['250 g Mehl', '125 ml Wasser', '2 EL Öl', '1 Prise Salz', '2 Zwiebeln', '100 g Speck (gewürfelt) oder Katenschinken', '1 Becher Schmand', '1 Becher Crème fraîche', 'Schnittlauch', 'Pfeffer'],
    zubereitung: [
      'Reicht für 2–3 Personen.',
      'Die Zubereitung war auf dem Foto nicht zu sehen. Bitte nachtragen.'
    ].join('\n')
  },
  {
    id: 'rezept-schnelle-quiche',
    name: 'Schnelle Quiche',
    portionen: null,
    zutaten: ['1 Pck Blätterteig', '500 g Gemüse (z. B. grüner Spargel)', '300 ml Sauce Hollandaise', '3 Eier', '1 Pck Feta'],
    zubereitung: [
      'Gemüse (schälen und) schneiden. Ggf. vorgaren (bei den Möhren für Benno gemacht).',
      'Blätterteig in eine Form geben und das Gemüse darauf verteilen.',
      'Sauce Hollandaise und die Eier verrühren und darübergeben. Alternative Soße: 4 Eier, 1 Becher Schmand, 1 TL Salz und 2 Prisen Pfeffer.',
      'Mit Fetabröseln toppen und etwa 40 Min. bei 180 °C Umluft in den Ofen.'
    ].join('\n')
  },
  {
    id: 'rezept-fischburger',
    name: 'Fischburger',
    portionen: 4,
    schnell: true,
    zutaten: ['4 Burger-Brötchen', '4 TK-Fischletti (Bofrost)', 'Remoulade', '1 Kopfsalat', '2 Tomaten', '1 Gurke', 'Butter', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Im Rezeptbuch steht es pro Person, hier sind die Mengen für 4 gerechnet.',
      'Fischletti nach Packungsangabe zubereiten.',
      'Pro Burger von unten nach oben stapeln: Brötchen-Unterseite, Butter, 1 Fischletti, 3 Scheiben Gurke, Tomatenscheiben, etwas Salz und Pfeffer, (Kopf-)Salat, Remoulade, Brötchen-Deckel.'
    ].join('\n')
  },
  {
    id: 'rezept-spargelflammkuchen',
    name: 'Spargelflammkuchen',
    portionen: null,
    zutaten: ['250 g Mehl', '125 ml Wasser', '15 g Hefe', '1 Bund grüner Spargel', '125 g Katenschinken', '400 g Crème fraîche', '125 g Parmesan (gehobelt)', 'Zucker', 'Olivenöl', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Mehl in eine Schüssel sieben und eine Mulde in die Mitte drücken. Hefe in lauwarmes Wasser bröseln, auflösen und in die Mulde gießen.',
      'Mit etwa 1 TL Salz und etwas Zucker zu einem glatten Teig verarbeiten und ca. 1 Stunde an einem warmen Ort gehen lassen.',
      'In der Zwischenzeit den Spargel waschen, schälen, die holzigen Enden abschneiden und in sehr dünne schräge Scheiben schneiden.',
      'Den Ofen auf 250 °C vorheizen und den Teig zu einem großen Fladen ausrollen.',
      'Den Teig mit Crème fraîche bestreichen, gut würzen, Spargel und Schinken darauf verteilen. Mit Olivenöl beträufeln und noch mal gut mit Salz und Pfeffer würzen.',
      'Zuletzt mit dem gehobelten Parmesan bestreuen und im Ofen 12–15 Min. backen.'
    ].join('\n')
  },
  {
    id: 'rezept-niku-chazuke',
    name: 'Niku Chazuke',
    portionen: 2,
    schnell: true,
    zutaten: ['300 g Rinderhackfleisch', 'Sesamöl (geröstet)', '4 EL Sake (oder Sherry)', '2 EL Mirin (oder Sherry)', '4 EL Sojasauce', '3 TL Rohrzucker', 'Reis (Basmati oder Sushi)', '2 Frühlingszwiebeln', '3 EL Hojicha oder anderer Grüntee', 'Ingwer (1 kleines Stück)', '2 Eier (optional)'],
    zubereitung: [
      'Reicht für 2 Personen.',
      'Reis aufsetzen. In einer Pfanne Sesamöl erhitzen und das Fleisch darin anbraten.',
      'In der Zwischenzeit die Frühlingszwiebeln in feine Ringe schneiden. Ingwer (mit der Kante eines Löffels) schälen und klein reiben.',
      'Sobald das Rindfleisch leicht goldbraune Stellen bekommt, Sake, Sojasauce, Mirin (1–2 EL) und Rohrzucker in die Pfanne geben und köcheln lassen, bis die Flüssigkeit etwas verdampft ist und eine schöne Soße entsteht.',
      'Grünen Tee nach Packungsanweisung mit 300 ml Wasser kochen.',
      'Den Reis auf zwei Teller geben, Fleisch darüber verteilen, mit Frühlingszwiebeln und Ingwer garnieren und mit einem guten Schuss Tee übergießen.',
      'Sehr gut passt ein pochiertes Ei obendrauf.'
    ].join('\n')
  },
  {
    id: 'rezept-indische-reispfanne',
    name: 'Indische Reispfanne',
    portionen: 4,
    zutaten: ['250 g Basmatireis', '500 g Hähnchenbrustfilet', '2 rote Paprika', '1 Zwiebel', '3 Bananen', '1 Glas Currysauce (Onkel Ben\'s Cremiges Curry)', 'Sahne', '2 EL Öl', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Reis in kochendem Salzwasser garen.',
      'Paprika waschen, putzen und in kleine Stücke schneiden.',
      'Fleisch waschen, trocknen, würfeln und in heißem Öl 8–10 Min. braten, danach mit Salz und schwarzem Pfeffer würzen.',
      'Zwiebel und Paprika zufügen und 5 Min. mitgaren.',
      '2–3 Bananen in Stücke schneiden und zugeben (statt der Aprikosen aus dem Originalrezept).',
      'Die Currysauce und etwas Sahne unterrühren, erhitzen und das Gericht nochmals abschmecken.'
    ].join('\n')
  },
  {
    id: 'rezept-schlemmerpfanne',
    name: 'Schlemmerpfanne',
    portionen: null,
    zutaten: ['4 Putenschnitzel', '3 Zwiebeln', '20 g Butter', 'Champignons', '100 g gekochter Schinken', '100 g roher Schinken', '1 Becher Crème fraîche', '1 Becher Sahne', 'Würzmischung (Maggi Würzmischung 1)', 'Paprikapulver', 'Mehl', 'Öl', 'Salz', 'Pfeffer'],
    zubereitung: [
      'Am Vortag vorbereiten: Das Gericht zieht 24 Stunden im Kühlschrank durch.',
      'Die 3–4 Schnitzel halbieren, würzen (Maggi Würzmischung 1, Paprika, Pfeffer, Salz), in Mehl wenden und ganz kurz in Öl anbraten. Anschließend in eine oder mehrere Auflaufformen schichten.',
      'Champignons in derselben Pfanne kurz braten und wieder herausnehmen.',
      'Die 2–3 Zwiebeln in Scheiben schneiden und in Butter andünsten, Champignons und gewürfelten Schinken zugeben.',
      'Danach Sahne und Crème fraîche zugeben, abschmecken und über die Schnitzel geben. 24 Stunden im Kühlschrank durchziehen lassen.',
      'Am nächsten Tag bei 180 °C ca. 1 Stunde backen.'
    ].join('\n')
  },
  {
    id: 'rezept-pizza-babka',
    name: 'Pizza-Babka',
    quelle: 'salamico.de',
    portionen: 3,
    zutaten: ['180 g Mehl (Type 550)', '12 g Zucker', '20 ml Milch', '80 g Butter', '1 Ei', '15 g Hefe (frisch)', '50 g Sour Cream', '3 g Oregano', '3 g Knoblauchpulver', '240 g Mozzarella', 'Tomatenmark', '80 g Salami', '80 g Parmesan', '1 Zehe Knoblauch', '2 EL Petersilie', '1 Dose geschälte Tomaten (400 g)', '5 g Salz', 'Meersalz'],
    zubereitung: [
      'Rezept von https://salamico.de/index.php/rezepte/123-pizza-babka-das-rezept-zum-trend-aus-new-york-city (für 2–3 Personen). Von den 80 g Butter kommen 20 g in den Teig und 60 g in die Knoblauchbutter.',
      'Teig: Hefe und Zucker in der Milch auflösen und kurz stehen lassen. Mit Mehl, Salz, 20 g Butter, Ei, Sour Cream, Oregano und Knoblauchpulver mindestens 10 Min. kneten. In einer geölten Schüssel mindestens 30 Min. warm gehen lassen.',
      'Füllung: Mozzarella zerpflücken und auf einem Küchentuch trocknen lassen. Salami in dünne Scheiben oder Würfel schneiden, Parmesan reiben.',
      'Knoblauchbutter: Petersilie hacken, Knoblauch pressen. 60 g Butter mit dem Knoblauch kurz erhitzen, vom Herd nehmen und die Petersilie unterrühren.',
      'Tomatensoße: Tomaten im Topf mit dem Kartoffelstampfer zerdrücken, aufkochen, einige Minuten einkochen und mit Meersalz abschmecken.',
      'Teig zu einem Rechteck (ca. 40 × 30 cm) ausrollen, dünn mit Tomatenmark bestreichen, Mozzarella und Salami bis zum Rand verteilen und Parmesan darüberstreuen.',
      'Von der langen Seite her aufrollen, mit der Naht nach unten legen und der Länge nach halbieren. Die beiden Stränge zu einem Zopf drehen.',
      'Den Zopf in eine geölte Backform legen und abgedeckt ca. 1 Stunde gehen lassen. Ofen auf 180 °C vorheizen.',
      'Mit der Hälfte der Knoblauchbutter bestreichen und ca. 40 Min. backen. Danach mit der restlichen Butter bestreichen und kurz ruhen lassen.',
      'In dicke Stücke schneiden und mit der Tomatensoße servieren.'
    ].join('\n')
  },
  {
    id: 'rezept-burrata-pasta',
    name: 'Burrata-Pasta mit Tomaten',
    quelle: 'gaumenfreundin.de',
    portionen: 4,
    schnell: true,
    zutaten: ['500 g Linguine', '800 g Kirschtomaten', '4 Kugeln Burrata', '4 Zehen Knoblauch', '4 EL Olivenöl', '1 TL Chiliflocken', '4 EL Basilikum', 'Salz und Pfeffer'],
    zubereitung: [
      'Rezept von https://www.gaumenfreundin.de/burrata-pasta-mit-tomaten/ (dort für 2 Portionen, hier verdoppelt für 4). Fertig in ca. 20 Min. Für die Kinder die Chiliflocken weglassen oder erst auf dem Teller dazugeben.',
      'Knoblauch hacken. Olivenöl in einer großen Pfanne erhitzen, Knoblauch und Chiliflocken bei mittlerer Hitze kurz anschwitzen.',
      'Kirschtomaten dazugeben, ca. 5 Min. braten und dabei mit dem Kochlöffel leicht zerdrücken.',
      'Inzwischen die Nudeln nach Packungsangabe kochen. Mit einer Kelle Kochwasser zu den Tomaten geben, unterheben und mit Salz und Pfeffer abschmecken.',
      'Auf Teller verteilen, auf jeden Teller eine Burrata setzen und mit gehacktem Basilikum bestreuen. Tipp von der Seite: geröstete Pinienkerne passen gut dazu.'
    ].join('\n')
  }
];
