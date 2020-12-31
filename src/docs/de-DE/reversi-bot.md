# Entwicklung eines Misskey Reversi-Bots
Auf dieser Seite wird die Entwicklung eines Bots für Misskey Reversi erläutert.

1. Verbinde dich unter Verwendung folgender Parameter mit dem `games/reversi`-Stream:
    * `i`: API-Schlüssel des Bot-Kontos

2. Sobald den Bot eine Spieleinladung erreicht, wird das `invited`-Event vom Stream gesendet
    * Der Inhalt dieses Events ist ein `parent`-Attribut, was Daten über den Benutzer, der die Einladung verschickt hat, beinhaltet

3. Sende eine Anfrage an `games/reversi/match`, wobei der Wert des `user_id`-Parameters das `id`-Attribut der vorher erhaltenen `parent`-Daten ist

4. Gelingt die Anfrage, werden die Spieldaten als Rückgabewert geliefert. Nutze diese dann, um die unten gelisteten Parameter an den `games/reversi-game`-Stream zu senden:
    * `i`: API-Schlüssel des Bot-Kontos
    * `game`: `id`-Attribut des `game`-Objekts

5. この間、相手がゲームの設定を変更するとその都度`update-settings`イベントが流れてくるので、必要であれば何かしらの処理を行う

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

## ユーザーにフォームを提示して対話可能Botを作成する
ユーザーとのコミュニケーションを行うため、ゲームの設定画面でユーザーにフォームを提示することができます。 例えば、Botの強さをユーザーが設定できるようにする、といったシナリオが考えられます。

フォームを提示するには、`reversi-game`ストリームに次のメッセージを送信します:
```javascript
{
  type: 'init-form',
  body: [フォームコントロールの配列]
}
```

フォームコントロールの配列については今から説明します。 フォームコントロールは、次のようなオブジェクトです:
```javascript
{
  id: 'switch1',
  type: 'switch',
  label: 'Enable hoge',
  value: false
}
```
`id` ... コントロールのID。 `type` ... コントロールの種類。後述します。 `label` ... コントロールと一緒に表記するテキスト。 `value` ... コントロールのデフォルト値。

### フォームの操作を受け取る
ユーザーがフォームを操作すると、ストリームから`update-form`イベントが流れてきます。 イベントの中身には、コントロールのIDと、ユーザーが設定した値が含まれています。 例えば、上で示したスイッチをユーザーがオンにしたとすると、次のイベントが流れてきます:
```javascript
{
  id: 'switch1',
  value: true
}
```

### フォームコントロールの種類
#### Schalter
type: `switch` Zeigt einen Schalter an.何かの機能をオン/オフさせたい場合に有用です。

##### Attribute
`label` ... Auf dem Schalter anzuzeigender Text.

#### Optionsfeld
type: `radio` Zeigt ein Optionsfeld an.選択肢を提示するのに有用です。例えば、Botの強さを設定させるなどです。

##### Attribute
`items` ... Die verfügbaren Optionen.z.B.:
```javascript
items: [{
  label: '弱',
  value: 1
}, {
  label: '中',
  value: 2
}, {
  label: '強',
  value: 3
}]
```

#### Schieberegler
type: `slider` Zeigt einen Schieberegler an.

##### Attribute
`min` ... スライダーの下限。 `max` ... スライダーの上限。 `step` ... 入力欄で刻むステップ値。

#### Textbox
type: `textbox` Zeigt eine Textbox an.ユーザーになにか入力させる一般的な用途に利用できます。

## Dem Benutzer Nachrichten zeigen
設定画面でユーザーと対話する、フォーム以外のもうひとつの方法がこれです。ユーザーになにかメッセージを表示することができます。 例えば、ユーザーがBotの対応していないモードやマップを選択したとき、警告を表示するなどです。 メッセージを表示するには、次のメッセージをストリームに送信します:
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
