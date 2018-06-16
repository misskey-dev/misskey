ChangeLog
=========

4.0.0
-----

オセロがリバーシに変更されました。

### Migration

MongoDBの、`othelloGames`と`othelloMatchings`コレクションをそれぞれ`reversiGames`と`reversiMatchings`にリネームしてください。

You need to rename `othelloGames` and `othelloMatchings` MongoDB collections to `reversiGames` and `reversiMatchings`.

3.0.0
-----

### Migration

起動する前に、`node cli/recount-stats`してください。

Please run `node cli/recount-stats` before launch.
