# ダイスキー

- https://misskey.delmulin.com/
- [Misskey](https://github.com/misskey-dev/misskey/)の私的フォーク

## 変更点

### フロントエンド

- 「削除してタグづけ」（[モロヘイヤ](https://github.com/pooza/mulukhiya-toot-proxy/)の機能）へのリンクをノートのメニューに追加
- 左メニュー
  - モロヘイヤHOMEへのリンクを追加
  - [ダイスキーブログ](https://blog.misskey.delmulin.com)へのリンクを追加
- OAuth認証まわりでの文言修正
  - 不自然な文言「アプリケーションに戻ってやっていってください」を修正。
  - 認証キーが画面に表示されていなかった為、追加。
- 「固定タグ」ウィジェット
  - [karasugawasu/misskey](https://github.com/karasugawasu/misskey)からの移植。
- サーバーとの接続が失われたとき
  - `何もしない`オプションの追加
- クラシックUIの廃止
- 各種パラメータ調整

### バックエンド

- デフォルトハッシュタグ（`#delmulin`）対応
  - ローカルタイムラインを修正
  - ソーシャルタイムラインを修正
