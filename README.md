# ダイスキー

- https://misskey.delmulin.com/
- [Misskey](https://github.com/misskey-dev/misskey/)の私的フォーク

## 変更点

### フロントエンド

- 「削除してタグづけ」（[モロヘイヤ](https://github.com/pooza/mulukhiya-toot-proxy/)の機能）へのリンクをノートのメニューに追加
- OAuth認証まわりでの文言修正
  - 不自然な文言「アプリケーションに戻ってやっていってください」を修正
  - 認証キーが画面に表示されていなかった為、追加
- 「固定タグ」ウィジェット
  - [karasugawasu/misskey](https://github.com/karasugawasu/misskey)からの移植
- 選択メニュー（MkSelect）
  - 長い選択肢文字列を折り返さずに`…`で縮める
- 本文中のURL（MkUrl）を短縮表示
  - ホスト名とパスのみ表示
  - 長いパスの末尾に`…`を置いて縮める
- サーバーとの接続が失われたとき
  - `なにもしない`オプションの追加
- [ナビゲーションバー拡張](https://github.com/pooza/misskey/pull/342)
- [プロキシアカウント無効化](https://github.com/pooza/misskey/pull/346)
- クラシックUIの廃止
- 各種パラメータ調整

### バックエンド

- デフォルトハッシュタグ対応
	- デフォルトハッシュタグを含む投稿を、検索時にも「ローカル」とみなす。
  - https://github.com/misskey-dev/misskey/pull/13098
- 2024/2に大量発生したスパムへの対策
