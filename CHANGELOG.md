ChangeLog
=========

破壊的変更のみ記載。

This document describes breaking changes only.

10.0.0
------

ストリーミングAPIに破壊的変更があります。運営者がすべきことはありません。

変更は以下の通りです

* ストリーミングでやり取りする際の snake_case が全て camelCase に
* リバーシのストリームエンドポイント名が reversi → gamesReversi、reversiGame → gamesReversiGame に
* ストリーミングの個々のエンドポイントが廃止され、一旦元となるストリームに接続してから、個々のチャンネル(今までのエンドポイント)に接続します。詳細は後述します。
* ストリームから流れてくる、キャプチャした投稿の更新イベントに投稿自体のデータは含まれず、代わりにアクションが設定されるようになります。詳細は後述します。
* ストリームに接続する際に追加で指定していたパラメータ(トークン除く)が、URLにクエリとして含むのではなくチャンネル接続時にパラメータ指定するように

### 個々のエンドポイントが廃止されることによる新しいストリーミングAPIの利用方法
具体的には、まず https://example.misskey/streaming にwebsocket接続します。
次に、例えば「messaging」ストリーム(チャンネルと呼びます)に接続したいときは、ストリームに次のようなデータを送信します:
``` javascript
{
  type: 'connect',
  body: {
    channel: 'messaging',
    id: 'foobar',
    params: {
      otherparty: 'xxxxxxxxxxxx'
    }
  }
}
```
ここで、`id`にはそのチャンネルとやり取りするための任意のIDを設定します。
IDはチャンネルごとではなく「チャンネルの接続ごと」です。なぜなら、同じチャンネルに異なるパラメータで複数接続するケースもあるからです。
`params`はチャンネルに接続する際のパラメータです。チャンネルによって接続時に必要とされるパラメータは異なります。パラメータ不要のチャンネルに接続する際は、このプロパティは省略可能です。

チャンネルにメッセージを送信するには、次のようなデータを送信します:
``` javascript
{
  type: 'channel',
  body: {
    id: 'foobar',
    type: 'something',
    body: {
      some: 'thing'
    }
  }
}
```
ここで、`id`にはチャンネルに接続するときに指定したIDを設定します。

逆に、チャンネルからメッセージが流れてくると、次のようなデータが受信されます:
``` javascript
{
  type: 'channel',
  body: {
    id: 'foobar',
    type: 'something',
    body: {
      some: 'thing'
    }
  }
}
```
ここで、`id`にはチャンネルに接続するときに指定したIDが設定されています。

### 投稿のキャプチャに関する変更
投稿の更新イベントに投稿情報は含まれなくなりました。代わりに、その投稿が「リアクションされた」「アンケートに投票された」「削除された」といったアクション情報が設定されます。

具体的には次のようなデータが受信されます:
``` javascript
{
  type: 'noteUpdated',
  body: {
    id: 'xxxxxxxxxxx',
    type: 'reacted',
    body: {
      reaction: 'hmm'
    }
  }
}
```

* reacted ... 投稿にリアクションされた。`reaction`プロパティにリアクションコードが含まれます。
* pollVoted ... アンケートに投票された。`choice`プロパティに選択肢ID、`userId`に投票者IDが含まれます。

9.0.0
-----

Misskey v8.64.0 を使っている方は、9.0.0に際しては特にすべきことはありません。
Misskey v8.64.0 に満たないバージョンをお使いの方は、一旦8.64.0にアップデートして(そして起動して)から9.0.0に再度アップデートしてください。

8.0.0
-----

### Migration

起動する前に、`node cli/migration/8.0.0`してください。

Please run `node cli/migration/8.0.0` before launch.


7.0.0
-----

### Migration

起動する前に、`node cli/migration/7.0.0`してください。

Please run `node cli/migration/7.0.0` before launch.

6.0.0
-----

### Migration

オブジェクトストレージを使用している場合、設定ファイルの`drive.config.secure`を`drive.config.useSSL`にリネームしてください。

If you use object storage, please rename `drive.config.secure` to `drive.config.useSSL` in config.

5.0.0
-----

### Migration

起動する前に、`node cli/migration/5.0.0`してください。

Please run `node cli/migration/5.0.0` before launch.

4.0.0
-----

オセロがリバーシに変更されました。

Othello is rename to Reversi.

### Migration

MongoDBの、`othelloGames`と`othelloMatchings`コレクションをそれぞれ`reversiGames`と`reversiMatchings`にリネームしてください。

Please rename `othelloGames` and `othelloMatchings` MongoDB collections to `reversiGames` and `reversiMatchings` respectively.

3.0.0
-----

### Migration

起動する前に、`node cli/recount-stats`してください。

Please run `node cli/recount-stats` before launch.
