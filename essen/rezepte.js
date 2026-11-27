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
  }
];
