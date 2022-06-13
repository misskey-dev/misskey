<!--
## 12.x.x (unreleased)

### Improvements

### Bugfixes
- 

You should also include the user name that made the change.
-->

## 12.111.1 (2022/06/13)

### Bugfixes
- some fixes of multiple notification read @tamaina
- some GenerateVideoThumbnail failed @Johann150
- Client: デッキでウィジェットの情報が保存されない問題を修正 @syuilo
- Client: ギャラリーの投稿を開こうとすると編集画面が表示される @futchitwo

## 12.111.0 (2022/06/11)
### Note
- Node.js 16.15.0 or later is required

### Improvements
- Supports Unicode Emoji 14.0 @mei23
- プッシュ通知を複数アカウント対応に #7667 @tamaina
- プッシュ通知にクリックやactionを設定 #7667 @tamaina
- ドライブに画像ファイルをアップロードするときオリジナル画像を破棄してwebpublicのみ保持するオプション @tamaina
- Server: always remove completed tasks of job queue @Johann150
- Client: アバターの設定で画像をクロップできるように @syuilo
- Client: make emoji stand out more on reaction button @Johann150
- Client: display URL of QR code for TOTP registration @tamaina
- Client: render quote renote CWs as MFM @pixeldesu
- API: notifications/readは配列でも受け付けるように #7667 @tamaina
- API: ユーザー検索で、クエリがusernameの条件を満たす場合はusernameもLIKE検索するように @tamaina
- MFM: Allow speed changes in all animated MFMs @Johann150
- The theme color is now better validated. @Johann150
  Your own theme color may be unset if it was in an invalid format.
  Admins should check their instance settings if in doubt.
- Perform port diagnosis at startup only when Listen fails @mei23
- Rate limiting is now also usable for non-authenticated users. @Johann150 @mei23
  Admins should make sure the reverse proxy sets the `X-Forwarded-For` header to the original address.

### Bugfixes
- Server: keep file order of note attachement @Johann150
- Server: fix missing foreign key for reports leading to reports page being unusable @Johann150
- Server: fix internal in-memory caching @Johann150
- Server: prevent crash when processing certain PNGs @syuilo
- Server: Fix unable to generate video thumbnails @mei23
- Server: Fix `Cannot find module` issue @mei23
- Federation: Add rel attribute to host-meta @mei23
- Federation: add id for activitypub follows @Johann150
- Federation: use `source` instead of `_misskey_content` @Johann150
- Federation: ensure resolver does not fetch local resources via HTTP(S) @Johann150
- Federation: correctly render empty note text @Johann150
- Federation: Fix quote renotes containing no text being federated correctly @Johann150
- Federation: remove duplicate br tag/newline @Johann150
- Federation: add missing authorization checks @Johann150
- Client: fix profile picture height in mentions @tamaina
- Client: fix abuse reports page to be able to show all reports @Johann150
- Client: fix settings page @tamaina
- Client: fix profile tabs @futchitwo
- Client: fix popout URL @futchitwo
- Client: correctly handle MiAuth URLs with query string @sn0w
- Client: ノート詳細ページの新しいノートを表示する機能の動作が正しくなるように修正する @xianonn
- MFM: more animated functions support `speed` parameter @futchitwo
- MFM: limit large MFM @Johann150

## 12.110.1 (2022/04/23)

### Bugfixes
- Fix GOP rendering @syuilo
- Improve performance of antenna, clip, and list @xianonn

## 12.110.0 (2022/04/11)

### Improvements
- Improve webhook @syuilo
- Client: Show loading icon on splash screen @syuilo

### Bugfixes
- API: parameter validation of users/show was wrong
- Federation: リモートインスタンスへのダイレクト投稿が届かない問題を修正 @syuilo

## 12.109.2 (2022/04/03)

### Bugfixes
- API: admin/update-meta was not working @syuilo
- Client: テーマを切り替えたり読み込んだりするとmeta[name="theme-color"]のcontentがundefinedになる問題を修正 @tamaina

## 12.109.1 (2022/04/02)

### Bugfixes
- API: Renoteが行えない問題を修正

## 12.109.0 (2022/04/02)

### Improvements
- Webhooks @syuilo
- Bull Dashboardを組み込み、ジョブキューの確認や操作を行えるように @syuilo
  - Bull Dashboardを開くには、最初だけ一旦ログアウトしてから再度管理者権限を持つアカウントでログインする必要があります
- Check that installed Node.js version fulfills version requirement @ThatOneCalculator
- Server: overall performance improvements @syuilo
- Federation: avoid duplicate activity delivery @Johann150
- Federation: limit federation of reactions on direct notes @Johann150
- Client: タッチパッド・タッチスクリーンでのデッキの操作性を向上 @tamaina

### Bugfixes
- email address validation was not working @ybw2016v
- API: fix endpoint endpoint @Johann150
- API: fix admin/meta endpoint @syuilo
- API: improved validation and documentation for endpoints that accept different variants of input @Johann150
- API: `notes/create`: The `mediaIds` property is now deprecated. @Johann150
  - Use `fileIds` instead, it has the same behaviour.
- Client: URIエンコーディングが異常でdecodeURIComponentが失敗するとURLが表示できなくなる問題を修正 @tamaina

## 12.108.1 (2022/03/12)

### Bugfixes
- リレーが動作しない問題を修正 @xianonn
- ulidを使用していると動作しない問題を修正 @syuilo
- 外部からOGPが正しく取得できない問題を修正 @syuilo
- instance can not get the files from other instance when there are items in allowedPrivateNetworks in .config/default.yml @ybw2016v

## 12.108.0 (2022/03/09)

### NOTE
このバージョンからNode v16.14.0以降が必要です

### Changes
- ノートの最大文字数を設定できる機能が廃止され、デフォルトで一律3000文字になりました @syuilo
- Misskey can no longer terminate HTTPS connections. @Johann150
  - If you did not use a reverse proxy (e.g. nginx) before, you will probably need to adjust
    your configuration file and set up a reverse proxy. The `https` configuration key is no
    longer recognized!

### Improvements
- インスタンスデフォルトテーマを設定できるように @syuilo
- ミュートに期限を設定できるように @syuilo
- アンケートが終了したときに通知が作成されるように @syuilo
- プロフィールの追加情報を最大16まで保存できるように @syuilo
- 連合チャートにPub&Subを追加 @syuilo
- 連合チャートにActiveを追加 @syuilo
- デフォルトで10秒以上時間がかかるデータベースへのクエリは中断されるように @syuilo
	- 設定ファイルの`db.extra`に`statement_timeout`を設定することでタイムアウト時間を変更できます
- Client: スプラッシュスクリーンにインスタンスのアイコンを表示するように @syuilo

### Bugfixes
- Client: リアクションピッカーの高さが低くなったまま戻らないことがあるのを修正 @syuilo
- Client: ユーザー名オートコンプリートが正しく動作しない問題を修正 @syuilo
- Client: タッチ操作だとウィジェットの編集がしにくいのを修正 @xianonn
- Client: register_note_view_interruptor()が動かないのを修正 @syuilo
- Client: iPhone X以降(?)でページの内容が全て表示しきれないのを修正 @tamaina
- Client: fix image caption on mobile @nullobsi

## 12.107.0 (2022/02/12)

### Improvements
- クライアント: テーマを追加 @syuilo

### Bugfixes
- API: stats APIで内部エラーが発生する問題を修正 @syuilo
- クライアント: ソフトミュートですべてがマッチしてしまう場合があるのを修正 @tamaina
- クライアント: デバイスのスクリーンのセーフエリアを考慮するように @syuilo
- クライアント: 一部環境でサイドバーの投稿ボタンが表示されない問題を修正 @syuilo

## 12.106.3 (2022/02/11)

### Improvements
- クライアント: スマートフォンでの余白を調整 @syuilo

### Bugfixes
- クライアント: ノートの詳細が表示されない問題を修正 @syuilo

## 12.106.2 (2022/02/11)

### Bugfixes
- クライアント: 削除したノートがタイムラインから自動で消えない問題を修正 @syuilo
- クライアント: リアクション数が正しくないことがある問題を修正 @syuilo
- 一部環境でマイグレーションが動作しない問題を修正 @syuilo

## 12.106.1 (2022/02/11)

### Bugfixes
- クライアント: ワードミュートが保存できない問題を修正 @syuilo

## 12.106.0 (2022/02/11)

### Improvements
- Improve federation chart @syuilo
- クライアント: リアクションピッカーのサイズを設定できるように @syuilo
- クライアント: リアクションピッカーの幅、高さ制限を緩和 @syuilo
- Docker: Update to Node v16.13.2 @mei23
- Update dependencies

### Bugfixes
- validate regular expressions in word mutes @Johann150

## 12.105.0 (2022/02/09)

### Improvements
- インスタンスのテーマカラーを設定できるように @syuilo

### Bugfixes
- 一部環境でマイグレーションが失敗する問題を修正 @syuilo

## 12.104.0 (2022/02/09)

### Note
ビルドする前に`npm run clean`を実行してください。

このリリースはマイグレーションの規模が大きいため、インスタンスによってはマイグレーションに時間がかかる可能性があります。
マイグレーションが終わらない場合は、チャートの情報はリセットされてしまいますが`__chart__`で始まるテーブルの**レコード**を全て削除(テーブル自体は消さないでください)してから再度試す方法もあります。

### Improvements
- チャートエンジンの強化 @syuilo
	- テーブルサイズの削減
	- notes/instance/perUserNotesチャートに添付ファイル付きノートの数を追加
	- activeUsersチャートに新しい項目を追加
	- federationチャートに新しい項目を追加
	- apRequestチャートを追加
	- networkチャート廃止
- クライアント: 自インスタンス情報ページでチャートを見れるように @syuilo
- クライアント: デバイスの種類を手動指定できるように @syuilo
- クライアント: UIのアイコンを更新 @syuilo
- クライアント: UIのアイコンをセルフホスティングするように @syuilo
- NodeInfo のユーザー数と投稿数の内容を見直す @xianonn

### Bugfixes
- Client: タイムライン種別を切り替えると「新しいノートがあります」の表示が残留してしまうのを修正 @tamaina
- Client: UIのサイズがおかしくなる問題の修正 @tamaina
- Client: Setting instance information of notes to always show breaks the timeline @Johann150
- Client: 環境に依っては返信する際のカーソル位置が正しくない問題を修正 @syuilo
- Client: コントロールパネルのユーザー、ファイルにて、インスタンスの表示範囲切り替えが機能しない問題を修正 @syuilo
- Client: アップデートお知らせダイアログが出ないのを修正 @syuilo
- Client: Follows/Followers Visibility changes won't be saved unless clicking on an other checkbox @Johann150
- API: Fix API cast @mei23
- add instance favicon where it's missing @solfisher
- チャートの定期resyncが動作していない問題を修正 @syuilo

## 12.103.1 (2022/02/02)

### Bugfixes
- クライアント: ツールチップの表示位置が正しくない問題を修正

## 12.103.0 (2022/02/02)

### Improvements
- クライアント: 連合インスタンスページからインスタンス情報再取得を行えるように

### Bugfixes
- クライアント: 投稿のNSFW画像を表示したあとにリアクションが更新されると画像が非表示になる問題を修正
- クライアント: 「クリップ」ページが開かない問題を修正
- クライアント: トレンドウィジェットが動作しないのを修正
- クライアント: フェデレーションウィジェットが動作しないのを修正
- クライアント: リアクション設定で絵文字ピッカーが開かないのを修正
- クライアント: DMページでメンションが含まれる問題を修正
- クライアント: 投稿フォームのハッシュタグ保持フィールドが動作しない問題を修正
- クライアント: サイドビューが動かないのを修正
- クライアント: ensure that specified users does not get duplicates
- Add `img-src` and `media-src` directives to `Content-Security-Policy` for
  files and media proxy

## 12.102.1 (2022/01/27)
### Bugfixes
- チャットが表示できない問題を修正

## 12.102.0 (2022/01/27)

### NOTE
アップデート後、一部カスタム絵文字が表示できなくなる場合があります。その場合、一旦絵文字管理ページから絵文字を一括エクスポートし、再度コントロールパネルから一括インポートすると直ります。
⚠ 12.102.0以前にエクスポートされたzipとは互換性がありません。アップデートしてからエクスポートを行なってください。

### Changes
- Room機能が削除されました
  - 後日別リポジトリとして復活予定です
- リバーシ機能が削除されました
  - 後日別リポジトリとして復活予定です
- Chat UIが削除されました
- ノートに添付できるファイルの数が16に増えました
- カスタム絵文字にSVGを指定した場合、PNGに変換されて表示されるようになりました

### Improvements
- カスタム絵文字一括編集機能
- カスタム絵文字一括インポート
- 投稿フォームで一時的に投稿するアカウントを切り替えられるように
- Unifying Misskey-specific IRIs in JSON-LD `@context`
- クライアントのパフォーマンス向上
- セキュリティの向上

### Bugfixes
- アップロードエラー時の処理を修正

## 12.101.1 (2021/12/29)

### Bugfixes
- SVG絵文字が表示できないのを修正
- エクスポートした絵文字の拡張子がfalseになることがあるのを修正

## 12.101.0 (2021/12/29)

### Improvements
- クライアント: ノートプレビューの精度を改善
- クライアント: MFM sparkleエフェクトの改善
- クライアント: デザインの調整
- セキュリティの向上

### Bugfixes
- クライアント: 一部のコンポーネントが裏に隠れるのを修正
- fix html blockquote conversion

## 12.100.2 (2021/12/18)

### Bugfixes
- クライアント: Deckカラムの増減がページをリロードするまで正しく反映されない問題を修正
- クライアント: 一部のコンポーネントが裏に隠れるのを修正
- クライアント: カスタム絵文字一覧ページの負荷が高いのを修正

## 12.100.1 (2021/12/17)

### Bugfixes
- クライアント: デザインの調整

## 12.100.0 (2021/12/17)

### Improvements
- クライアント: モバイルでの各種メニュー、リアクションピッカーの表示を改善

### Bugfixes
- クライアント: 一部のコンポーネントが裏に隠れるのを修正

## 12.99.3 (2021/12/14)
### Bugfixes
- クライアント: オートコンプリートがダイアログの裏に隠れる問題を修正

## 12.99.2 (2021/12/14)

## 12.99.1 (2021/12/14)

## 12.99.0 (2021/12/14)

### Improvements
- Added a user-level instance mute in user settings
- フォローエクスポートでミュートしているユーザーを含めないオプションを追加
- フォローエクスポートで使われていないアカウントを含めないオプションを追加
- カスタム絵文字エクスポート機能
- チャートのパフォーマンスの改善
- グループから抜けられるように

### Bugfixes
- クライアント: タッチ機能付きディスプレイを使っていてマウス操作をしている場合に一部機能が動作しない問題を修正
- クライアント: クリップの設定を編集できない問題を修正
- クライアント: メニューなどがウィンドウの裏に隠れる問題を修正

## 12.98.0 (2021/12/03)

### Improvements
- API: /antennas/notes API で日付による絞り込みができるように
- クライアント: アンケートに投票する際に確認ダイアログを出すように
- クライアント: Renoteなノート詳細ページから元のノートページに遷移できるように
- クライアント: 画像ポップアップでクリックで閉じられるように
- クライアント: デザインの調整
- フォロワーを解除できる機能

### Bugfixes
- クライアント: LTLやGTLが無効になっている場合でもUI上にタブが表示される問題を修正
- クライアント: ログインにおいてパスワードが誤っている際のエラーメッセージが正しく表示されない問題を修正
- クライアント: リアクションツールチップ、Renoteツールチップのユーザーの並び順を修正
- クライアント: サウンドのマスターボリュームが正しく保存されない問題を修正
- クライアント: 一部環境において通知が表示されると操作不能になる問題を修正
- クライアント: モバイルでタップしたときにツールチップが表示される問題を修正
- クライアント: リモートインスタンスのノートに返信するとき、対象のノートにそのリモートインスタンス内のユーザーへのメンションが含まれていると、返信テキスト内にローカルユーザーへのメンションとして引き継がれてしまう場合がある問題を修正
- クライアント: 画像ビューワーで全体表示した時に上側の一部しか表示されない画像がある問題を修正
- API: ユーザーを取得時に条件によっては内部エラーになる問題を修正

### Changes
- クライアント: ノートにモデレーターバッジを表示するのを廃止

## 12.97.0 (2021/11/19)

### Improvements
- クライアント: 返信先やRenoteに対しても自動折りたたみされるように
- クライアント: 長いスレッドの表示を改善
- クライアント: 翻訳にもMFMを適用し、元の文章の改行などを保持するように
- クライアント: アカウント削除に確認ダイアログを出すように

### Bugfixes
- クライアント: ユーザー検索の「全て」が動作しない問題を修正
- クライアント: リアクション一覧、Renote一覧ツールチップのスタイルを修正

## 12.96.1 (2021/11/13)
### Improvements
- npm scriptの互換性を向上

## 12.96.0 (2021/11/13)

### Improvements
- フォロー/フォロワーを非公開にできるように
- インスタンスプロフィールレンダリング ready
- 通知のリアクションアイコンをホバーで拡大できるように
- RenoteボタンをホバーでRenoteしたユーザー一覧を表示するように
- 返信の際にメンションを含めるように
- 通報があったときに管理者へEメールで通知されるように
- メールアドレスのバリデーションを強化

### Bugfixes
- アカウント削除処理があると高負荷になる問題を修正
- クライアント: 長いメニューが画面からはみ出す問題を修正
- クライアント: コントロールパネルのジョブキューに個々のジョブが表示されないのを修正
- クライアント: fix missing i18n string
- fix html conversion issue with code blocks

### Changes
- ノートにモバイルからの投稿か否かの情報を含めないように

## 12.95.0 (2021/10/31)

### Improvements
- スレッドミュート機能

### Bugfixes
- リレー向けのActivityが一部実装で除外されてしまうことがあるのを修正
- 削除したノートやユーザーがリモートから参照されると復活することがあるのを修正
- クライアント: ページ編集時のドロップダウンメニューなどが動作しない問題を修正
- クライアント: コントロールパネルのカスタム絵文字タブが切り替わらないように見える問題を修正
- API: ユーザー情報の hasUnreadChannel が常に false になっている問題を修正

## 12.94.1 (2021/10/25)

### Improvements

### Bugfixes
- クライアント: ユーザーページのナビゲーションが失敗する問題を修正

## 12.94.0 (2021/10/25)

### Improvements
- クライアント: 画像ビューアを強化
- クライアント: メンションにユーザーのアバターを表示するように
- クライアント: デザインの調整
- クライアント: twemojiをセルフホスティングするように

### Bugfixes
- クライアント: CWで画像が隠されたとき、画像の高さがおかしいことになる問題を修正

### NOTE
- このバージョンから、iOS 15未満のサポートがされなくなります。対象のバージョンをお使いの方は、iOSのバージョンアップを行ってください。

## 12.93.2 (2021/10/23)

### Bugfixes
- クライアント: ウィジェットを追加できない問題を修正

## 12.93.1 (2021/10/23)

### Bugfixes
- クライアント: 通知上でローカルのリアクションが表示されないのを修正

## 12.93.0 (2021/10/23)

### Improvements
- クライアント: コントロールパネルのパフォーマンスを改善
- クライアント: 自分のリアクション一覧を見れるように
	- 設定により、リアクション一覧を全員に公開することも可能
- クライアント: ユーザー検索の精度を強化
- クライアント: 新しいライトテーマを追加
- クライアント: 新しいダークテーマを追加
- API: ユーザーのリアクション一覧を取得する users/reactions を追加
- API: users/search および users/search-by-username-and-host を強化
- ミュート及びブロックのインポートを行えるように
- クライアント: /share のクエリでリプライやファイル等の情報を渡せるように
- チャートのsyncを毎日0時に自動で行うように

### Bugfixes
- クライアント: テーマの管理が行えない問題を修正
- API: アプリケーション通知が取得できない問題を修正
- クライアント: リモートノートで意図せずローカルカスタム絵文字が使われてしまうことがあるのを修正
- ActivityPub: not reacted な Undo.Like がinboxに滞留するのを修正

### Changes
- 連合の考慮に問題があることなどが分かったため、モデレーターをブロックできない仕様を廃止しました
- データベースにログを保存しないようになりました
	- ログを永続化したい場合はsyslogを利用してください

## 12.92.0 (2021/10/16)

### Improvements
- アカウント登録にメールアドレスの設定を必須にするオプション
- クライアント: 全体的なUIのブラッシュアップ
- クライアント: MFM関数構文のサジェストを実装
- クライアント: ノート本文を投稿フォーム内でプレビューできるように
- クライアント: 未読の通知のみ表示する機能
- クライアント: 通知ページで通知の種類によるフィルタ
- クライアント: アニメーションを減らす設定の適用範囲を拡充
- クライアント: 新しいダークテーマを追加
- クライアント: テーマコンパイラに hue と saturate 関数を追加
- ActivityPub: HTML -> MFMの変換を強化
- API: グループから抜ける users/groups/leave エンドポイントを実装
- API: i/notifications に unreadOnly オプションを追加
- API: ap系のエンドポイントをログイン必須化+レートリミット追加
- MFM: Add tag syntaxes of bold <b></b> and strikethrough <s></s>

### Bugfixes
- Fix createDeleteAccountJob
- admin inbox queue does not show individual jobs
- クライアント: ヘッダーのタブが折り返される問題を修正
- クライアント: ヘッダーにタブが表示されている状態でタイトルをクリックしたときにタブ選択が表示されるのを修正
- クライアント: ユーザーページのタブが機能していない問題を修正
- クライアント: ピン留めユーザーの設定項目がない問題を修正
- クライアント: Deck UIにおいて、重ねたカラムの片方を畳んだ状態で右に出すと表示が壊れる問題を修正
- API: 管理者およびモデレーターをブロックできてしまう問題を修正
- MFM: Mentions in the link label are parsed as text
- MFM: Add a property to the URL node indicating whether it was enclosed in <>
- MFM: Disallows < and > in hashtags

### Changes
- 保守性やユーザビリティの観点から、Misskeyのコマンドラインオプションが削除されました。
	- 必要であれば、代わりに環境変数で設定することができます
- MFM: パフォーマンス、保守性、構文誤認識抑制の観点から、旧関数構文のサポートが削除されました。
	- 旧構文(`[foo bar]`)を使用せず、現行の構文(`$[foo bar]`)を使用してください。

## 12.91.0 (2021/09/22)

### Improvements
- ActivityPub: リモートユーザーのDeleteアクティビティに対応
- ActivityPub: add resolver check for blocked instance
- ActivityPub: deliverキューのメモリ使用量を削減
- API: 管理者用アカウント削除APIを実装(/admin/accounts/delete)
	- リモートユーザーの削除も可能に
- アカウントが凍結された場合に、凍結された旨を表示してからログアウトするように
- 凍結されたアカウントにログインしようとしたときに、凍結されている旨を表示するように
- リスト、アンテナタイムラインを個別ページとして分割
- UIの改善
- MFMにsparklesエフェクトを追加
- 非ログイン自は更新ダイアログを出さないように
- クライアント起動時、アップデートが利用可能な場合エラー表示およびダイアログ表示しないように

### Bugfixes
- アカウントデータのエクスポート/インポート処理ができない問題を修正
- アンテナの既読が付かない問題を修正
- popupで設定ページを表示すると、アカウントの削除ページにアクセスすることができない問題を修正
- "問題が発生しました"ウィンドウを開くと☓ボタンがなくて閉じれない問題を修正

## 12.90.1 (2021/09/05)

### Bugfixes
- Dockerfileを修正
- ノート翻訳時に公開範囲が考慮されていない問題を修正

## 12.90.0 (2021/09/04)

### Improvements
- 藍モード、および藍ウィジェット
	- クライアントに藍ちゃんを召喚することができるようになりました。
- URLからのアップロード, APの添付ファイル, 外部ファイルのプロキシ等では、Privateアドレス等へのリクエストは拒否されるようになりました。
	- developmentで動作している場合は、この制限は適用されません。
	- Proxy使用時には、この制限は適用されません。
		Proxy使用時に同等の制限を行いたい場合は、Proxy側で設定を行う必要があります。
	- `default.yml`にて`allowedPrivateNetworks`にCIDRを追加することにより、宛先ネットワークを指定してこの制限から除外することが出来ます。
- アップロード, ダウンロード出来るファイルサイズにハードリミットが適用されるようになりました。(約250MB)
	- `default.yml`にて`maxFileSize`を変更することにより、制限値を変更することが出来ます。

### Bugfixes
- 管理者が最初にサインアップするページでログインされないのを修正
- CWを維持する設定を復活
- クライアントの表示を修正

## 12.89.2 (2021/08/24)

### Bugfixes
- カスタムCSSを有効にしているとエラーになる問題を修正

## 12.89.1 (2021/08/24)

### Improvements
- クライアントのデザインの調整

### Bugfixes
- 翻訳でDeepLのProアカウントに対応していない問題を修正
- インスタンス設定でDeepLのAuth Keyが空で表示される問題を修正
- セキュリティの向上

## 12.89.0 (2021/08/21)

### Improvements
- アカウント削除の安定性を向上
- 絵文字オートコンプリートの挙動を改修
- localStorageのaccountsはindexedDBで保持するように
- ActivityPub: ジョブキューの試行タイミングを調整 (#7635)
- API: sw/unregisterを追加
- ワードミュートのドキュメントを追加
- クライアントのデザインの調整
- 依存関係の更新

### Bugfixes
- チャンネルを作成しているとアカウントを削除できないのを修正
- ノートの「削除して編集」をするとアンケートの選択肢が[object Object]になる問題を修正

## 12.88.0 (2021/08/17)

### Features
- ノートの翻訳機能を追加
  - 有効にするには、サーバー管理者がDeepLの無料アカウントを登録し、取得した認証キーを「インスタンス設定 > その他 > DeepL Auth Key」に設定する必要があります。
- Misskey更新時にダイアログを表示するように
- ジョブキューウィジェットに警報音を鳴らす設定を追加

### Improvements
- ブロックの挙動を改修
	- ブロックされたユーザーがブロックしたユーザーに対してアクション出来ないようになりました。詳細はドキュメントをご確認ください。
- UIデザインの調整
- データベースのインデックスを最適化
- Proxy使用時にKeep-Aliveをサポート
- DNSキャッシュでネガティブキャッシュをサポート
- 依存関係の更新

### Bugfixes
- タッチ操作でウィンドウを閉じることができない問題を修正
- Renoteされた時刻が投稿された時刻のように表示される問題を修正
- コントロールパネルでファイルを削除した際の表示を修正
- ActivityPub: 長いユーザーの名前や自己紹介の対応

## 12.87.0 (2021/08/12)

### Improvements
- 絵文字オートコンプリートで一文字目は最近使った絵文字をサジェストするように
- 絵文字オートコンプリートのパフォーマンスを改善
- about-misskeyページにドキュメントへのリンクを追加
- Docker: Node.jsを16.6.2に
- 依存関係の更新
- 翻訳の更新

### Bugfixes
- Misskey更新時、テーマキャッシュの影響でスタイルがおかしくなる問題を修正

## 12.86.0 (2021/08/11)

### Improvements
- ドキュメントの更新
	- ドキュメントにchangelogを追加
- ぼかし効果のオプションを追加
- Vueを3.2.1に更新
- UIの調整

### Bugfixes
- ハッシュタグ入力が空のときに#が付くのを修正
- フォローリクエストのEメール通知を修正
