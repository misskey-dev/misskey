# Développement du bot Reversi de Misskey
Cette page explique comment développer un bot pour la fonction Reversi de Misskey.

1. Connectez-vous au flux `games/reversi` avec les paramètres suivants :
    * `i` : Clé API pour le compte du bot

2. Lorsqu'une invitation à un jeu arrive, un événement `invited` sera lancé à partir du flux.
    * Le contenu de cet événement est un attribut `parent`, qui contient des informations sur l'utilisateur qui a envoyé l'invitation.

3. Envoie une requête à `games/reversi/match`, où la valeur du paramètre `user_id` est l'attribut `id` de l'objet `parent` obtenu précédemment.

4. Si la requête fonctionne, les informations sur le jeu seront renvoyées et vous pourrez vous connecter au flux `games/reversi-game` avec les paramètres suivants :
    * `i` : Clé API pour le compte du bot
    * `game`: `game` de `id`

5. Pendant ce temps, l'adversaire peut modifier les paramètres du jeu. Chaque fois qu'un paramètre est modifié, le flux envoie un événement `update-settings`, donc une logique pour gérer ces événements peut être nécessaire.

6. Une fois que vous êtes satisfait des paramètres du jeu, envoyez le message `{ type : 'accept' }` au flux.

7. Lorsque le jeu commence, l'événement `started` sera envoyé.
    * Les informations sur l'état du jeu seront inclus dans cet événement.

8. Pour placer une pierre, envoyez `{ type : 'set', pos : <Position&gt ; }` au flux (voir ci-dessous pour savoir comment calculer la position).

9. Lorsque votre adversaire ou vous-même placer une pierre, un événement `set` est envoyé depuis le flux.
    * `color` contient la couleur de la pierre déplacée
    * `pos` contient la position de la pierre

## Calculer la position
Si nous considérons une carte 8x8, la position de chaque carré (appelée index) est la suivante :
```
+--+--+--+--+--+--+--+--+
| 0| 1| 2| 3| 4| 5| 6| 7|
+--+--+--+--+--+--+--+--+
| 8| 9|10|11|12|13|14|15|
+--+--+--+--+--+--+--+--+
|16|17|18|19|20|21|22|23|
...
```

### Trouver les index à partir des coordonnées X, Y
```
pos = x + (y * mapWidth)
```
`mapWidth` est une donnée de la carte prise sur la `map` comme suit :
```
mapWidth = map[0].length
```

### Trouver les coordonnées X, Y depuis l'index
```
x = pos % mapWidth
y = Math.floor(pos / mapWidth)
```

## Information sur la carte
Les données de la carte sont incluses dans `map` dans les données du jeu. Comme les données sont représentées sous la forme d'un tableau de chaînes de caractères, chaque caractère représente un champ. Sur la base de ces données, vous pouvez reconstruire l'état de la carte :
* `(Vide)` ... マス無し
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
#### Interrupteur
type: `switch` スイッチを表示します。何かの機能をオン/オフさせたい場合に有用です。

##### プロパティ
`label` ... スイッチに表記するテキスト。

#### ラジオボタン
type: `radio` ラジオボタンを表示します。選択肢を提示するのに有用です。例えば、Botの強さを設定させるなどです。

##### プロパティ
`items` ... ラジオボタンの選択肢。例:
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

#### スライダー
type: `slider` スライダーを表示します。

##### プロパティ
`min` ... スライダーの下限。 `max` ... スライダーの上限。 `step` ... 入力欄で刻むステップ値。

#### テキストボックス
type: `textbox` テキストボックスを表示します。ユーザーになにか入力させる一般的な用途に利用できます。

## ユーザーにメッセージを表示する
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
メッセージの種類: `success`, `info`, `warning`, `error`。

## 投了する
投了をするには、<a href="./api/endpoints/games/reversi/games/surrender">このエンドポイント</a>にリクエストします。
