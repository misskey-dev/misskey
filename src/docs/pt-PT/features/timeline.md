# Linha do tempo
タイムラインは、[ノート](./note)が時系列で表示される機能です。 タイムラインには以下で示す種類があり、種類によって表示されるノートも異なります。 なお、タイムラインの種類によってはサーバーにより無効になっている場合があります。

## Início
Postagens de usuários que você segue serão mostradas.Abreviado como HTL.

## Local
全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。LTLと略されます。

## Social
自分のフォローしているユーザーの投稿と、全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。STLと略されます。

## Global
全てのローカルユーザーの「ホーム」指定されていない投稿と、サーバーに届いた全てのリモートユーザーの「ホーム」指定されていない投稿が流れます。GTLと略されます。

## Comparação
| Fonte           |              |        | Linha do tempo |        |        |
| --------------- | ------------ | ------ | -------------- | ------ | ------ |
| Usuários        | Visibilidade | Início | Local          | Social | Global |
| Local (seguir)  | Público      | ✔      | ✔              | ✔      | ✔      |
|                 | Início       | ✔      |                | ✔      |        |
|                 | Seguidores   | ✔      | ✔              | ✔      | ✔      |
| Remoto (seguir) | Público      | ✔      |                | ✔      | ✔      |
|                 | Início       | ✔      |                | ✔      |        |
|                 | Seguidores   | ✔      |                | ✔      | ✔      |
| ローカル (未フォロー)    | Público      |        | ✔              | ✔      | ✔      |
|                 | Início       |        |                |        |        |
|                 | Seguidores   |        |                |        |        |
| リモート (未フォロー)    | Público      |        |                |        | ✔      |
|                 | Início       |        |                |        |        |
|                 | Seguidores   |        |                |        |        |
