# Entwicklung eines Misskey Reversi-Bots
Auf dieser Seite wird die Entwicklung eines Bots für Misskey Reversi erläutert.

1. Verbinde dich unter Verwendung folgender Parameter mit dem `games/reversi`-Stream:
    * `i`: API-Schlüssel des Bot-Kontos

2. Sobald den Bot eine Spieleinladung erreicht, wird das `invited`-Event vom Stream gesendet
    * Der Inhalt dieses Events ist ein `parent`-Attribut, was Daten über den Benutzer, der die Einladung verschickt hat, beinhaltet

3. Sende eine Anfrage an `games/reversi/match`, wobei der Wert des `user_id`-Parameters das `id`-Attribut des vorher erhaltenen `parent`-Objekts ist

4. Gelingt die Anfrage, werden die Spieldaten als Rückgabewert geliefert. Nutze diese dann, um die unten gelisteten Parameter an den `games/reversi-game`-Stream zu senden:
    * `i`: API-Schlüssel des Bot-Kontos
    * `game`: `id`-Attribut des `game`-Objekts

5. Währenddessen kann der Spielgegner die Spieleinstellungen verändern. Jedes mal, wenn eine Einstellung verändert wird, sendet der Stream ein `update-settings`-Event, weswegen möglicherweise Logik, um solche Events verarbeiten zu können, notwendig ist.

6. Sobald du mit den Spieleinstellungen zufrieden bist, sende die Nachricht `{ type: 'accept' }` an den Stream

7. Sobald das Spiel startet, wird das `started`-Event gesendet
    * Der Inhalt dieses Events sind die Spieldaten

8. Um einen Stein zu setzen, sende die folgende Nachricht an den Stream: `{ type: 'set', pos: <Position> }` (Positionsberechnungen werden später erläutert)

9. Setzt der Gegner oder du einen Stein, wird das `set`-Event vom Stream gesendet
    * Die Farbe der Spielfigur ist als `color` enthalten
    * Die Position der Spielfigur ist als `pos` enthalten

## Positionsberechnungen
Im Falle eines 8x8 Spielbrettes sind die Felder wie folgt aufgestellt (jeweils mit ihrem Index versehen):
```
+--+--+--+--+--+--+--+--+
| 0| 1| 2| 3| 4| 5| 6| 7|
+--+--+--+--+--+--+--+--+
| 8| 9|10|11|12|13|14|15|
+--+--+--+--+--+--+--+--+
|16|17|18|19|20|21|22|23|
...
```

### Berechnung von Indizes durch X und Y Koordinaten
```
pos = x + (y * mapWidth)
```
Bei `mapWidth` handelt es sich um wie folgt aus `map` entnommene Spielbrettdaten:
```
mapWidth = map[0].length
```

### Berechnung der X und Y Koordinaten durch Indizes
```
x = pos % mapWidth
y = Math.floor(pos / mapWidth)
```

## Spielbrettdaten
Die Spielbrettdaten sind innerhalb vom in den Spieldaten enthaltenen `map`-Attribut gespeichert. Da das Spielbrett als Array von Zeichenketten representiert wird, steht jedes Symbol für ein Spielfeld. Basierend auf diesen Informationen lässt sich der Spielbrettzustand rekonstruieren.
* `(Leer)` ... Kein Spielfeld
* `-` ... Spielfeld
* `b` ... Spielfeld auf dem zuerst platzierter Stein schwarz war
* `w` ... Spielfeld auf dem zuerst platzierter Stein weiß war

Sei folgendes simple 4*4 Spielbrett als Beispiel gegeben:
```text
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   | ○ | ● |   |
+---+---+---+---+
|   | ● | ○ |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
```

In diesem Fall sehen die Spielbrettdaten wie folgt aus:
```javascript
['----', '-wb-', '-bw-', '----']
```

## Erstellen eines Bots, der mit dem Benutzer durch das Zeigen von Fenstern kommunizieren kann
Das Kommunizieren mit dem Spieler kann durch das Anzeigen von Fenstern während der Vorbereitungsphase des Spiels umgesetz werden. Beispielsweise kann so die Schwierigkeit des Bots durch den Benutzer konfiguriert werden.

Um ein Fenster anzuzeigen, sende folgende Nachricht an den `reversi-game`-Stream:
```javascript
{
  type: 'init-form',
  body: [Array an Fenster-Elementen]
}
```

Details bezüglich des Arrays an Fenster-Elementen werden nun erklärt. Ein Element eines Fensters ist wie das folgende Objekt aufgebaut:
```javascript
{
  id: 'switch1',
  type: 'switch',
  label: 'Enable hoge',
  value: false
}
```
`id` ... Die ID des Elements. `type` ... Der Typ des Elements.Diese werden später erläutert. `label` ... Text der zusammen mit dem Element angezeigt wird. `value` ... Standardwert des Elements.

### Verarbeitung von Interaktionen mit Elementen
Interagiert der Benutzer mit einem der Elemente eines Fensters, so wird ein `update-form`-Element vom Stream gesendet. Die Inhalte dieses Events sind die ID des Elements sowie der Wert des Elements, der vom Benutzer eingestellt wurde. Wird beispielsweise der obige Beispielschalter eingeschaltet, wird das folgende Event gesendet:
```javascript
{
  id: 'switch1',
  value: true
}
```

### Typen von Form-Elementen
#### Schalter
type: `switch` Zeigt einen Schalter an.Eignet sich für Fälle, in denen etwas entweder ein- oder ausgeschaltet werden kann.

##### Attribute
`label` ... Auf dem Schalter anzuzeigender Text.

#### Optionsfeld
type: `radio` Zeigt ein Optionsfeld an.Eignet sich für Fälle, in denen verschiedene Optionen angezeigt werden.z.B. zur Einstellung der Stärke des Bots.

##### Attribute
`items` ... Die verfügbaren Optionen.z.B.:
```javascript
items: [{
  label: 'Schwach',
  value: 1
}, {
  label: 'Mittelmäßíg',
  value: 2
}, {
  label: 'Stark',
  value: 3
}]
```

#### Schieberegler
type: `slider` Zeigt einen Schieberegler an.

##### Attribute
`min` ... Der minimale Reglerwert. `max` ... Der maximale Reglerwert. `step` ... Der Abstand zwischen zwei Stufen des Reglers.

#### Textbox
type: `textbox` Zeigt eine Textbox an.Für verschiedene Fälle, in denen Texteingabe des Benutzers gefragt sind, verwendbar.

## Dem Benutzer Nachrichten zeigen
Dies ist eine alternative Methode, um mit dem Benutzer zu kommunieren, abgesehen vom Anzeigen eines Fensters während der Vorbereitungsphase des Spiels.Hierdurch kann dem Benutzer eine Nachricht angezeigt werden. Beispielsweise kann eine Warnung angezeigt werden, falls ein Spielmodus oder eine Spielkarte ausgewählt wird, mit der der Bot nicht kompatibel ist. Um eine Nachricht anzuzeigen, muss folgende Nachricht an den Stream gesendet werden:
```javascript
{
  type: 'message',
  body: {
    text: 'メッセージ内容',
    type: 'メッセージの種類'
  }
}
```
Nachrichtentypen: `success`, `info`, `warning`, `error`。

## Aufgeben
Um aufzugeben, sende eine Anfrage an <a href="./api/endpoints/games/reversi/games/surrender">diesen Endpunkt</a>.
