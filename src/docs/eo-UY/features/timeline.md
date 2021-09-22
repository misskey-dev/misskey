# Templinio
タイムラインは、[ノート](./note)が時系列で表示される機能です。 タイムラインには以下で示す種類があり、種類によって表示されるノートも異なります。 なお、タイムラインの種類によってはサーバーにより無効になっている場合があります。

## Hejma
自分のフォローしているユーザーの投稿が流れます。HTLと略されます。

## Loka
全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。LTLと略されます。

## Sociala
自分のフォローしているユーザーの投稿と、全てのローカルユーザーの「ホーム」指定されていない投稿が流れます。STLと略されます。

## Malloka
全てのローカルユーザーの「ホーム」指定されていない投稿と、サーバーに届いた全てのリモートユーザーの「ホーム」指定されていない投稿が流れます。GTLと略されます。

## 比較
| ソース                   |           |       | Templinio |         |         |
| --------------------- | --------- | ----- | --------- | ------- | ------- |
| Uzantoj               | Videbleco | Hejma | Loka      | Sociala | Malloka |
| Lokaj (sekvataj)      | Publika   | ✔     | ✔         | ✔       | ✔       |
|                       | Nur hejma | ✔     |           | ✔       |         |
|                       | Sekvantoj | ✔     | ✔         | ✔       | ✔       |
| Transaj (sekvataj)    | Publika   | ✔     |           | ✔       | ✔       |
|                       | Nur hejma | ✔     |           | ✔       |         |
|                       | Sekvantoj | ✔     |           | ✔       | ✔       |
| Lokaj (ne sekvataj)   | Publika   |       | ✔         | ✔       | ✔       |
|                       | Nur hejma |       |           |         |         |
|                       | Sekvantoj |       |           |         |         |
| Transaj (ne sekvataj) | Publika   |       |           |         | ✔       |
|                       | Nur hejma |       |           |         |         |
|                       | Sekvantoj |       |           |         |         |
