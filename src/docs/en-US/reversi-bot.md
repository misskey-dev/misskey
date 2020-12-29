# Development of Misskey Reversi Bots
Misskeyのリバーシ機能に対応したBotの開発方法をここに記します。

1. Connect to the `games/reversi` stream with the following parameters:
    * `i`: API key of the bot account

2. 対局への招待が来たら、ストリームから`invited`イベントが流れてくる
    * イベントの中身に、`parent`という名前で対局へ誘ってきたユーザーの情報が含まれている

3. `games/reversi/match`へ、`user_id`として`parent`の`id`が含まれたリクエストを送信する

4. 上手くいくとゲーム情報が返ってくるので、`games/reversi-game`ストリームへ、以下のパラメータを付けて接続する:
    * `i`: API key of the bot account
    * `game`: The `id` of the `game`

5. この間、相手がゲームの設定を変更するとその都度`update-settings`イベントが流れてくるので、必要であれば何かしらの処理を行う

6. 設定に満足したら、`{ type: 'accept' }`メッセージをストリームに送信する

7. ゲームが開始すると、`started`イベントが流れてくる
    * イベントの中身にはゲーム情報が含まれている

8. 石を打つには、ストリームに`{ type: 'set', pos: <位置> }`を送信する(位置の計算方法は後述)

9. 相手または自分が石を打つと、ストリームから`set`イベントが流れてくる
    * Contains the stone color as `color`
    * Contains the position as `pos`

## Calculating positions
8x8のマップを考える場合、各マスの位置(インデックスと呼びます)は次のようになっています:
```
+--+--+--+--+--+--+--+--+
| 0| 1| 2| 3| 4| 5| 6| 7|
+--+--+--+--+--+--+--+--+
| 8| 9|10|11|12|13|14|15|
+--+--+--+--+--+--+--+--+
|16|17|18|19|20|21|22|23|
...
```

### Find indices from X, Y coordinates
```
pos = x + (y * mapWidth)
```
`mapWidth` can be acquired from the `map` information as follows:
```
mapWidth = map[0].length
```

### Find X, Y coordinates from indices
```
x = pos % mapWidth
y = Math.floor(pos / mapWidth)
```

## Map information
マップ情報は、ゲーム情報の`map`に入っています。 文字列の配列になっており、ひとつひとつの文字がマス情報を表しています。 それをもとにマップのデザインを知る事が出来ます:
* `(スペース)` ... マス無し
* `-` ... マス
* `b` ... 初期配置される黒石
* `w` ... 初期配置される白石

例えば、4*4の次のような単純なマップがあるとします:
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

この場合、マップデータはこのようになります:
```javascript
['----', '-wb-', '-bw-', '----']
```

## ユーザーにフォームを提示して対話可能Botを作成する
ユーザーとのコミュニケーションを行うため、ゲームの設定画面でユーザーにフォームを提示することができます。 例えば、Botの強さをユーザーが設定できるようにする、といったシナリオが考えられます。

To display a form, send the following message to the `reversi-game` stream:
```javascript
{
  type: 'init-form',
  body: [Array of form control fields]
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

### Type of form control
#### Switch
type: `switch` Shows a slider.何かの機能をオン/オフさせたい場合に有用です。

##### Properties
`label` ... The text written on the switch.

#### Radio button
type: `radio` Shows a radio button.選択肢を提示するのに有用です。例えば、Botの強さを設定させるなどです。

##### Properties
`items` ... ラジオボタンの選択肢。例:
```javascript
items: [{
  label: 'Weak',
  value: 1
}, {
  label: 'Moderate',
  value: 2
}, {
  label: 'Strong',
  value: 3
}]
```

#### Slider
type: `slider` Shows a slider.

##### Properties
`min` ... The minimum value of the slider. `max` ... The maximum value of the slider. `step` ... The step between each value on the slider.

#### Textbox
type: `textbox` Shows a textbox.These can be used for all general purposes which require user input.

## Showing a message to a user
設定画面でユーザーと対話する、フォーム以外のもうひとつの方法がこれです。ユーザーになにかメッセージを表示することができます。 例えば、ユーザーがBotの対応していないモードやマップを選択したとき、警告を表示するなどです。 メッセージを表示するには、次のメッセージをストリームに送信します:
```javascript
{
  type: 'message',
  body: {
    text: 'Message contents',
    type: 'Message type'
  }
}
```
Message types: `success`, `info`, `warning`, `error`。

## Give up
To give up, send a request to <a href="./api/endpoints/games/reversi/games/surrender">this endpoint</a>.
