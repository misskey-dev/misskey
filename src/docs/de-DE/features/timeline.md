# Chronik
タイムラインは、[ノート](./note)が時系列で表示される機能です。 タイムラインには以下で示す種類があり、種類によって表示されるノートも異なります。 なお、タイムラインの種類によってはサーバーにより無効になっている場合があります。

## Startseite
自分のフォローしているユーザーの投稿が流れます。HTLと略されます。

## Lokal
全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。LTLと略されます。

## Sozial
自分のフォローしているユーザーの投稿と、全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。STLと略されます。

## Global
全てのローカルユーザーの「ホーム」指定されていない投稿と、サーバーに届いた全てのリモートユーザーの「ホーム」指定されていない投稿が流れます。GTLと略されます。

## Vergleiche
| ソース          |                 |            | Chronik |        |        |
| ------------ | --------------- | ---------- | ------- | ------ | ------ |
| Benutzer     | Sichtbarkeit    | Startseite | Lokal   | Sozial | Global |
| ローカル (フォロー)  | Veröffentlichen | ✔          | ✔       | ✔      | ✔      |
|              | Startseite      | ✔          |         | ✔      |        |
|              | Gefolgt von     | ✔          | ✔       | ✔      | ✔      |
| リモート (フォロー)  | Veröffentlichen | ✔          |         | ✔      | ✔      |
|              | Startseite      | ✔          |         | ✔      |        |
|              | Gefolgt von     | ✔          |         | ✔      | ✔      |
| ローカル (未フォロー) | Veröffentlichen |            | ✔       | ✔      | ✔      |
|              | Startseite      |            |         |        |        |
|              | Gefolgt von     |            |         |        |        |
| リモート (未フォロー) | Veröffentlichen |            |         |        | ✔      |
|              | Startseite      |            |         |        |        |
|              | Gefolgt von     |            |         |        |        |
