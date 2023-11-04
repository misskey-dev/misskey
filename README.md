# ダイスキー

[Misskey](https://github.com/misskey-dev/misskey/)の個人的なフォーク

## 変更点

### フロントエンド

- 「削除してタグづけ」（[モロヘイヤ](https://github.com/pooza/mulukhiya-toot-proxy/)の機能）へのリンクをノートのメニューに追加
- [ダイスキーブログ](https://blog.misskey.delmulin.com)へのリンクをノートのメニューに追加
- モロヘイヤHOMEへのリンクを右メニューに追加
- OAuth認証まわりでの文言修正
  - 不自然な文言「アプリケーションに戻ってやっていってください」を修正。
  - 認証キーが画面に表示されていなかった為、追加。
- 「固定タグ」ウィジェット
  - [karasugawasu/misskey](https://github.com/karasugawasu/misskey)からの移植。
- サーバーとの接続が失われたとき
  - `何もしない`オプションの追加
- クラシックUIの廃止
- パラメータ調整

### バックエンド

- デフォルトハッシュタグ（`#delmulin`）対応
  - ローカルタイムライン修正
  - ソーシャルタイムライン修正
