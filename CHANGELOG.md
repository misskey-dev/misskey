ChangeLog
=========

10.66.1
-------
* ActivityPubのsharedInboxに関して修正
* MFMでのカッコの判定を改善
* バグ修正

10.66.0
-------
* ユーザーごとのRSSフィードを提供するように
* リストのユーザーがすべて表示できない問題を修正
* デザインの調整
* パフォーマンスの改善

10.65.0
-------
* 検索で投稿やユーザーのURLを入力した際にそれをフェッチして表示するように
* リストのリネームと削除をできるように
* リストからユーザーを削除できるように
* リモートの絵文字を更新するように
* ActivityPubのための絵文字エンドポイントを実装
* 管理者がドライブのファイルのNSFWを設定できるように
* ServiceWorkerの設定を管理者ページで行えるように
* メンションの判定を改善
* リモートの投稿を引用した際にオリジナルのURLを挿入するように
* クライアントのパフォーマンス改善
* CWの内容がタブタイトルに表示されるのを修正
* アカウントを作成したときにログイン状態にならない問題を修正
* 時計の針にテーマカラーが適用されていなかったのを修正
* 一部の日時の表示が日本語で表示されていたのを修正
* プロフィールの写真欄に画像以外のファイルが含まれる問題を修正
* メンションが含まれる投稿に返信する際、フォームに予めそれらのメンションがセットされた状態にならない問題を修正
* デッキのTLにUIの動きを減らすオプションが適用されていなかったのを修正
* ログイン画面のタイムラインに隠した投稿が表示される問題を修正
* サジェストが複数開いてしまう問題を修正
* APから来たタグに登録時の長さ制限が適用されていなかったのを修正

10.64.2
-------
* UIの動きを減らすオプションが一部のアニメーションに適用されなかったのを修正

10.64.1
-------
* レートリミットの調整
* アニメーションの調整

10.64.0
-------
* いくつかのアニメーションを追加
* OGP向けにインスタンスのバナー画像を提供するように
* 管理者ページでドライブのファイルを表示できるように
* ユーザビリティの強化
* バグ修正

10.63.1
-------
* メンションの表示を改善
* バグ修正

10.63.0
-------
* ActivityPubのユーザーフィールドをユーザーページに表示
* 404ページの実装
* パフォーマンスの向上
* バグ修正

10.62.2
-------
* バグ修正
* ユーザビリティの向上

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
