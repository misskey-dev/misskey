ChangeLog
=========

破壊的変更のみ記載。

This document describes breaking changes only.

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
