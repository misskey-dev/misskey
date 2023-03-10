<!--
## 13.x.x (unreleased)

### Improvements
-

### Bugfixes
-

You should also include the user name that made the change.
-->

## 13.x.x (unreleased)

### Improvements
- ユーザーごとにRenoteをミュートできるように
- ノートごとに絵文字リアクションを受け取るか設定できるように
- enhance(client): DM作成時にメンションも含むように
- enhance(client): フォロー申請のボタンのデザインを改善
- enhance(backend): OpenAPIエンドポイントを復旧
- 透明なWebP/AVIF映像はJPEGではなくWebPに変換するように

### Bugfixes
- ロールで広告を無効にするとadmin/adsでプレビューがでてこない問題を修正
- /api-consoleページにアクセスすると404が出る問題を修正

## 13.9.2 (2023/03/06)

### Improvements
- クリップ、チャンネルページに共有ボタンを追加
- チャンネルでタイムライン上部に投稿フォームを表示するかどうかのオプションを追加
- ブラウザでメディアプロキシ(/proxy)からファイルを保存した際に、なるべくオリジナルのファイル名を継承するように
- ドライブの「URLからアップロード」で、content-dispositionのfilenameがあればそれをファイル名に
- Identiconがローカルとリモートで同じになるように
  - これまでのIdenticonは異なる画像になります
- サーバーのパフォーマンスを改善

### Bugfixes
- ロールの権限で「一般ユーザー」のロールがいきなり設定できない問題を修正
- ユーザーページのバッジ表示を適切に折り返すように @arrow2nd
- fix(client): みつけるのロール一覧でコンディショナルロールが含まれるのを修正
- macOSでDev Containerが動作しない問題を修正 @RyotaK

## 13.9.1 (2023/03/03)

### Bugfixes
- ノートに添付したファイルが表示されない場合があるのを修正

## 13.9.0 (2023/03/03)

### Improvements
- 時限ロール
- アンテナでCWも検索対象にするように
- ノートの操作部をホバー時のみ表示するオプションを追加
- サウンドを追加
- サーバーのパフォーマンスを改善

### Bugfixes
- 外部メディアプロキシ使用時にアバタークロップができない問題を修正
- fix(server): メールアドレス更新時にバリデーションが正しく行われていないのを修正
- fix(server): チャンネルでミュートが正しく機能していないのを修正
- プッシュ通知でカスタム絵文字リアクションを表示できなかった問題を修正

## 13.8.1 (2023/02/26)

### Bugfixes
- モバイルでドロワーメニューが表示されない問題を修正

## 13.8.0 (2023/02/26)

### Improvements
- チャンネル内ハイライト
- ホームタイムラインのパフォーマンスを改善
- renoteした際の表示を改善
- バックグラウンドで一定時間経過したらページネーションのアイテム更新をしない
- enhance(client): MkUrlPreviewの閉じるボタンを見やすく
- Add dialog to remove follower
- enhance(client): improve clip menu ux
- 検索画面の統合
- enhance(client): ノートメニューからユーザーメニューを開けるように
- photoswipe 表示時に戻る操作をしても前の画面に戻らないように

### Bugfixes
- Windows環境でswcを使うと正しくビルドできない問題の修正
- fix(client): Android ChromeでPWAとしてインストールできない問題を修正
- 未知のユーザーが deleteActor されたら処理をスキップする
- fix(server): notes/createで、fileIdsと見つかったファイルの数が異なる場合はエラーにする
- fix(server): notes/createのバリデーションが機能していないのを修正
- fix(server): エラーのスタックトレースは返さないように

## 13.7.5 (2023/02/24)

### Note
13.7.0以前から直接このバージョンにアップデートする場合は全ての通知が削除**されません。**

### Improvements
- 紛らわしいため公開範囲の「ローカルのみ」オプションの名称を「連合なし」に変更
- Frontend: スマホ・タブレットの場合、チャンネルの投稿フォームに自動でフォーカスしないように

### Bugfixes
- 全ての通知が削除されてしまうのを修正

## 13.7.3 (2023/02/23)

### Note
~~13.7.0以前から直接このバージョンにアップデートする場合は全ての通知が削除**されません。**~~

### Improvements

### Bugfixes
- Client: 「キャッシュを削除」した後、ローカルのカスタム絵文字が表示されなくなるされなくなる問題を修正
- Client: 通知設定画面で以前からグループの招待を有効化していた場合、通知の表示に失敗する問題の修正
- Client: 通知設定画面に古いトグルが残っていた問題を修正

## 13.7.2 (2023/02/23)

### Note
13.7.0以前からアップデートする場合は全ての通知が削除されます。

### Improvements
- enhance: make pwa icon maskable
- chore(client): tweak custom emoji size

### Bugfixes
- マイグレーションが失敗することがあるのを修正

## 13.7.1 (2023/02/23)

### Improvements
- pnpm buildではswcを使うように

### Bugfixes
- NODE_ENV=productionでビルドできないのを修正

## 13.7.0 (2023/02/22)

### Changes
- チャット機能が削除されました

### Improvements
- Server: URLプレビュー（summaly）はプロキシを通すように
- Client: 2FA設定のUIをまともにした
- セキュリティキーの名前を変更できるように
- enhance(client): add quiz preset for play
- 広告開始時期を設定できるように
- みつけるで公開ロール一覧とそのメンバーを閲覧できるように
- enhance(client): MFMのx3, x4が含まれていたらノートをたたむように
- enhance(client): make possible to reload page of window

### Bugfixes
- ユーザー検索ダイアログでローカルユーザーを絞って検索できない問題を修正
- fix(client): MkHeader及びデッキのカラムでチャンネル一覧を選択したとき、最大5個までしか表示されない
- 管理画面の広告を10個以上見えるように
- Moderation note が保存できない
- ユーザーのハッシュタグ検索が機能していないのを修正

## 13.6.1 (2023/02/12)

### Improvements
- アニメーションを少なくする設定の時、MkPageHeaderのタブアニメーションを無効化
- Backend: activitypub情報がcorsでブロックされないようヘッダーを追加
- enhance: レートリミットを0%にできるように
- チャンネル内Renoteを行えるように

### Bugfixes
- Client: ユーザーページでアクティビティを見ることができない問題を修正

## 13.6.0 (2023/02/11)

### Improvements
- MkPageHeaderをごっそり変えた
  * モバイルではヘッダーは上下に分割され、下段にタブが表示されるように
  * iconOnlyのタブ項目がアクティブな場合にはタブのタイトルを表示するように
  * メインタイムラインではタイトルを表示しない
  * メインタイムラインかつモバイルで表示される左上のアバターを選択するとアカウントメニューが開くように
- ユーザーページのノート一覧をタブとして分離
- コンディショナルロールもバッジとして表示可能に
- enhance(client): ロールをより簡単に付与できるように
- enhance(client): 一度見たノートのRenoteは省略して表示するように
- enhance(client): 迷惑になる可能性のある投稿を行う前に警告を表示
- リアクションの数が多い場合の表示を改善
- 一部のMFM構文をopt-outに

### Bugfixes
- Client: ユーザーページでタブがほとんど見れないことがないように

## 13.5.6 (2023/02/10)

### Improvements
- 非ログイン時にMiAuthを踏んだ際にMiAuthであることを表示する
- /auth/のUIをアップデート
- 利用規約同意UIの調整
- クロップ時の質問を分かりやすく

### Bugfixes
- fix: prevent clipping audio plyr's tooltip

## 13.5.4 (2023/02/09)

### Improvements
- Server: UIのHTML（ノートなどの特別なページを除く）のキャッシュ時間を15秒から30秒に
- i/notificationsのレートリミットを緩和

### Bugfixes
- fix(client): validate url to improve security
- fix(client): dateの初期値が正常に入らない時がある

## 13.5.3 (2023/02/09)

### Improvements
- Client: デッキにチャンネルカラムを追加

## 13.5.2 (2023/02/08)

### Changes
- Revert: perf(client): do not render custom emojis in user names

### Bugfixes
- Client: register_note_view_interruptor not working
- Client: ログイントークンの再生成が出来ない

## 13.5.0 (2023/02/08)

### Changes
- perf(client): do not render custom emojis in user names

### Improvements
- Client: disableShowingAnimatedImagesのデフォルト値をprefers-reduced-motionにする
- enhance(client): tweak medialist style

### Bugfixes
- fix docker health check
- Client: MkEmojiPickerでもChromeで検索ダイアログで変換確定するとそのまま検索されてしまうのを修正
- fix(mfm): default degree not used in rotate
- fix(server): validate urls from ap to improve security

## 13.4.0 (2023/02/05)

### Improvements
- ロールにアイコンを設定してユーザー名の横に表示できるように
- feat: timeline page for non-login users
- 実績の単なるラッキーの獲得確立を調整
- Add Thai language support

### Bugfixes
- fix(server): 自分のノートをお気に入りに登録しても実績解除される問題を修正
- fix(server): clean up file in FileServer
- fix(server): Deny UNIX domain socket
- fix(server): validate filename and emoji name to improve security
- fix(client): validate input response in aiscript
- fix(client): add webhook delete button
- fix(client): tweak notification style
- fix(client): インラインコードを折り返して表示する

## 13.3.3 (2023/02/04)

### Bugfixes
- Server: improve security

## 13.3.2 (2023/02/04)

### Improvements
- 外部メディアプロキシへの対応を強化しました
  外部メディアプロキシのFastify実装を作りました
  https://github.com/misskey-dev/media-proxy
- Server: improve performance

### Bugfixes
- Client: validate urls to improve security

## 13.3.1 (2023/02/04)

### Bugfixes
- Client: カスタム絵文字にアニメーション画像を再生しない設定が適用されていない問題を修正
- Client: オートコンプリートでUnicode絵文字がカスタム絵文字として表示されてしまうのを修正
- Client: Fix Vue-plyr CORS issue
- Client: validate urls to improve security

## 13.3.0 (2023/02/03)
### Changes
- twitter/github/discord連携機能が削除されました
- ハッシュタグごとのチャートが削除されました
- syslogのサポートが削除されました

### Improvements
- ロールで広告の非表示が有効になっている場合は最初から広告を非表示にするように

## 13.2.6 (2023/02/01)
### Changes
- docker-compose.ymlをdocker-compose.yml.exampleにしました。docker-compose.ymlとしてコピーしてから使用してください。

### Improvements
- 絵文字ピッカーのパフォーマンスを改善
- AiScriptを0.12.4に更新

### Bugfixes
- Server: リレーと通信できない問題を修正
- Client: classicモード使用時にwindowサイズによってdefaultに変更された後に、windowサイズが元に戻ったらclassicに戻すように修正 #9669
- Client: Chromeで検索ダイアログで変換確定するとそのまま検索されてしまう問題を修正

## 13.2.4 (2023/01/27)
### Improvements
- リモートカスタム絵文字表示時のパフォーマンスを改善
- Default to `animation: false` when prefers-reduced-motion is set
- リアクション履歴が公開なら、ログインしていなくても表示できるように
- tweak blur setting
- tweak custom emoji cache

### Bugfixes
- fix aggregation of retention
- ダッシュボードでオンラインユーザー数が表示されない問題を修正
- フォロー申請・フォローのボタンが、通知から消えている問題を修正

## 13.2.3 (2023/01/26)
### Improvements
- カスタム絵文字の更新をリアルタイムで反映するように

### Bugfixes
- turnstile-failed: missing-input-secret

## 13.2.2 (2023/01/25)
### Improvements
- サーバーのパフォーマンスを改善

### Bugfixes
- サインイン時に誤ったレートリミットがかかることがある問題を修正
- MFMのposition、rotate、scaleで小数が使えない問題を修正

## 13.2.1 (2023/01/24)
### Improvements
- デザインの調整
- サーバーのパフォーマンスを改善

## 13.2.0 (2023/01/23)

### Improvements
- onlyServer / onlyQueue オプションを復活
- 他人の実績閲覧時は獲得条件を表示しないように
- アニメーション減らすオプション有効時はリアクションのアニメーションを無効に
- カスタム絵文字一覧のパフォーマンスを改善

### Bugfixes
- Aiscript: button is not defined

## 13.1.7 (2023/01/22)

### Improvements
- 新たな実績を追加
- MFMにscaleタグを追加

## 13.1.4 (2023/01/22)

### Improvements
- 新たな実績を追加

### Bugfixes
- Client: ローカリゼーション更新時にリロードが繰り返されることがあるのを修正

## 13.1.3 (2023/01/22)

### Bugfixes
- Client: リアクションのカスタム絵文字の表示の問題を修正

## 13.1.2 (2023/01/22)

### Bugfixes
- Client: リアクションのカスタム絵文字の表示の問題を修正

## 13.1.1 (2023/01/22)

### Improvements
- ローカルのカスタム絵文字を表示する際のパフォーマンスを改善
- Client: 瞬間的に大量の実績を解除した際の挙動を改善

### Bugfixes
- Client: アップデート時にローカリゼーションデータが更新されないことがあるのを修正

## 13.1.0 (2023/01/21)

### Improvements
- 実績機能
- Playのプリセットを追加
- Playのscriptの文字数制限を緩和
- AiScript GUIの強化
- リアクション一覧詳細ダイアログを表示できるように
- 存在しないカスタム絵文字をテキストで表示するように
- Alt text in image viewer
- ジョブキューのプロセスとWebサーバーのプロセスを分離

### Bugfixes
- playを削除する手段がなかったのを修正
- The … button on notes does nothing when not logged in
- twitterと連携するときに autwh is not a function になるのを修正

## 13.0.0 (2023/01/16)

### TL;DR
- New features (Role system, Misskey Play, New widgets, New charts, 🍪👈, etc)
- Rewriten backend
- Better performance (backend and frontend)
- Various usability improvements
- Various UI tweaks

### Notable features
- ロール機能
	- 従来より柔軟にユーザーのポリシーを管理できます。例えば、「インスタンスのパトロンはアンテナを30個まで作れる」「基本的にLTLは見れないが、許可した人だけ見れる」「招待制インスタンスだけどユーザーなら誰でも他者を招待できる」のような運用はもちろん、「ローカルユーザーかつアカウント作成から1日未満のユーザーはパブリックな投稿を行えない」のように複数条件を組み合わせて、自動でロールを付与する設定も可能です。
- Misskey Play
	- 従来の動的なPagesに代わる、新しいプラットフォームです。動的なコンテンツ(アプリケーション)に特化していて、Pagesに比べてはるかに柔軟なアプリケーションを作成可能です。

### Changes
#### For server admins
- Node.js 18.x or later is required
- PostgreSQL 15.x is required
	- Misskey not using 15 specific features at 13.0.0, but may do so in the future.
	- Docker環境でPostgreSQLのアップデートを行う際のガイドはこちら: https://github.com/misskey-dev/misskey/pull/9641#issue-1536336620
- Elasticsearchのサポートが削除されました
	- 代わりに今後任意の検索プロバイダを設定できる仕組みを構想しています。その仕組みを使えば今まで通りElasticsearchも利用できます
- Yarnからpnpmに移行されました
  corepackの有効化を推奨します: `sudo corepack enable`
- インスタンスブロックはサブドメインにも適用されるようになります
- ロールの導入に伴い、いくつかの機能がロールと統合されました
	- モデレーターはロールに統合されました。今までのモデレーター情報は失われるため、予めモデレーター一覧を記録しておき、アップデート後にモデレーターロールを作りアサインし直してください。
	- サイレンスはロールに統合されました。今までのユーザーは恩赦されるため、予めサイレンス一覧を記録しておくのをおすすめします。
	- ユーザーごとのドライブ容量設定はロールに統合されました。
	- インスタンスデフォルトのドライブ容量設定はロールに統合されました。アップデート後、ベースロールもしくはコンディショナルロールでドライブ容量を編集してください。
	- LTL/GTLの解放状態はロールに統合されました。
- Dockerの実行をrootで行わないようにしました。Dockerかつオブジェクトストレージを使用していない場合は`chown -hR 991.991 ./files`を実行してください。
  https://github.com/misskey-dev/misskey/pull/9560

#### For users
- ノートのウォッチ機能が削除されました
- アンケートに投票された際に通知が作成されなくなりました
- ノートの数式埋め込みが削除されました
- 新たに動的なPagesを作ることはできなくなりました
	- 代わりにAiScriptを用いてより柔軟に動的なコンテンツを作成できるMisskey Play機能が実装されています。
- AiScriptが0.12.2にアップデートされました
	- 0.12.xの変更点についてはこちら https://github.com/syuilo/aiscript/blob/master/CHANGELOG.md#0120
	- 0.12.x未満のプラグインは読み込むことはできません
- iOS15以下のデバイスはサポートされなくなりました
- Firefox110以下はサポートされなくなりました
  - 109でもContainerQueriesのフラグを有効にする事で問題なく使用できます

#### For app developers
- API: metaのレスポンスに`emojis`プロパティが含まれなくなりました
	- カスタム絵文字一覧情報を取得するには、`emojis`エンドポイントにリクエストします
- API: カスタム絵文字エンティティに`url`プロパティが含まれなくなりました
	- 絵文字画像を表示するには、`<instance host>/emoji/<emoji name>.webp`にリクエストすると画像が返ります。
	- e.g. `https://p1.a9z.dev/emoji/misskey.webp`
	- remote: `https://p1.a9z.dev/emoji/syuilo_birth_present@mk.f72u.net.webp`
- API: `user`および`note`エンティティに`emojis`プロパティが含まれなくなりました
- API: `user`エンティティに`avatarColor`および`bannerColor`プロパティが含まれなくなりました
- API: `instance`エンティティに`latestStatus`、`lastCommunicatedAt`、`latestRequestSentAt`プロパティが含まれなくなりました
- API: `instance`エンティティの`caughtAt`は`firstRetrievedAt`に名前が変わりました

### Improvements
- Role system @syuilo
- Misskey Play @syuilo
- Introduce retention-rate aggregation @syuilo
- Make possible to export favorited notes @syuilo
- Add per user pv chart @syuilo
- Push notification of Antenna note @tamaina
- AVIF support @tamaina
- Add Cloudflare Turnstile CAPTCHA support @CyberRex0
- レートリミットをユーザーごとに調整可能に @syuilo
- 非モデレーターでも、権限を持つロールをアサインされたユーザーはインスタンスの招待コードを発行できるように @syuilo
- 非モデレーターでも、権限を持つロールをアサインされたユーザーはカスタム絵文字の追加、編集、削除を行えるように @syuilo
- クリップおよびクリップ内のノートの作成可能数を設定可能に @syuilo
- ユーザーリストおよびユーザーリスト内のユーザーの作成可能数を設定可能に @syuilo
- ハードワードミュートの最大文字数を設定可能に @syuilo
- Webhookの作成可能数を設定可能に @syuilo
- ノートをピン留めできる数を設定可能に @syuilo
- Server: signToActivityPubGet is set to true by default @syuilo
- Server: improve syslog performance @syuilo
- Server: Use undici instead of node-fetch and got @tamaina
- Server: Judge instance block by endsWith @tamaina
- Server: improve note scoring for featured notes @CyberRex0
- Server: アンケート選択肢の文字数制限を緩和 @syuilo
- Server: プロフィールの文字数制限を緩和 @syuilo
- Server: add rate limits for some endpoints @syuilo
- Server: improve stats api performance @syuilo
- Server: improve nodeinfo performance @syuilo
- Server: delete outdated notifications regularly to improve db performance @syuilo
- Server: delete outdated hard-mutes regularly to improve db performance @syuilo
- Server: delete outdated notes of antenna regularly to improve db performance @syuilo
- Server: improve activitypub deliver performance @syuilo
- Client: use tabler-icons instead of fontawesome to better design @syuilo
- Client: Add new gabber kick sounds (thanks for noizenecio)
- Client: Add link to user RSS feed in profile menu @ssmucny
- Client: Compress non-animated PNG files @saschanaz
- Client: YouTube window player @sim1222
- Client: show readable error when rate limit exceeded @syuilo
- Client: enhance dashboard of control panel @syuilo
- Client: Vite is upgraded to v4 @syuilo, @tamaina
- Client: HMR is available while yarn dev @tamaina
- Client: Implement the button to subscribe push notification @tamaina
- Client: Implement the toggle to or not to close push notifications when notifications or messages are read @tamaina
- Client: show Unicode emoji tooltip with its name in MkReactionsViewer.reaction @saschanaz
- Client: OpenSearch support @SoniEx2 @chaoticryptidz
- Client: Support remote objects in search @SoniEx2
- Client: user activity page @syuilo
- Client: Make widgets of universal/classic sync between devices @tamaina
- Client: add user list widget @syuilo
- Client: Add AiScript App widget
- Client: add profile widget @syuilo
- Client: add instance info widget @syuilo
- Client: Improve RSS widget @tamaina
- Client: add heatmap of daily active users to about page @syuilo
- Client: introduce fluent emoji @syuilo
- Client: add new theme @syuilo
- Client: add new mfm function (position, fg, bg) @syuilo
- Client: show fireworks when visit user who today is birthday @syuilo
- Client: show bot warning on screen when logged in as bot account @syuilo
- Client: AiScriptからカスタム絵文字一覧を参照できるように @syuilo
- Client: improve overall performance of client @syuilo
- Client: ui tweaks @syuilo
- Client: clicker game @syuilo

### Bugfixes
- Server: Fix @tensorflow/tfjs-core's MODULE_NOT_FOUND error @ikuradon
- Server: 引用内の文章がnyaizeされてしまう問題を修正 @kabo2468
- Server: Bug fix for Pinned Users lookup on instance @squidicuzz
- Server: Fix peers API returning suspended instances @ineffyble
- Server: trim long text of note from ap @syuilo
- Server: Ap inboxの最大ペイロードサイズを64kbに制限 @syuilo
- Server: アンテナの作成数上限を追加 @syuilo
- Server: pages/likeのエラーIDが重複しているのを修正 @syuilo
- Server: pages/updateのパラメータによってはsummaryの値が更新されないのを修正 @syuilo
- Server: Escape SQL LIKE @mei23
- Server: 特定のPNG画像のアップロードに失敗する問題を修正 @usbharu
- Server: 非公開のクリップのURLでOGPレンダリングされる問題を修正 @syuilo
- Server: アンテナタイムライン（ストリーミング）が、フォローしていないユーザーの鍵投稿も拾ってしまう @syuilo
- Server: follow request list api pagination @sim1222
- Server: ドライブ容量超過時のエラーが適切にレスポンスされない問題を修正 @syuilo
- Client: パスワードマネージャーなどでユーザー名がオートコンプリートされない問題を修正 @massongit
- Client: 日付形式の文字列などがカスタム絵文字として表示されるのを修正 @syuilo
- Client: case insensitive emoji search @saschanaz
- Client: 画面の幅が狭いとウィジェットドロワーを閉じる手段がなくなるのを修正 @syuilo
- Client: InAppウィンドウが操作できなくなることがあるのを修正 @tamaina
- Client: use proxied image for instance icon @syuilo
- Client: Webhookの編集画面で、内容を保存することができない問題を修正 @m-hayabusa
- Client: Page編集でブロックの移動が行えない問題を修正 @syuilo
- Client: update emoji picker immediately on all input @saschanaz
- Client: チャートのツールチップが画面に残ることがあるのを修正 @syuilo
- Client: fix wrong link in tutorial @syuilo

### Special thanks
- All contributors
- All who have created instances for the beta test
- All who participated in the beta test

## 12.119.1 (2022/12/03)
### Bugfixes
- Server: Mitigate AP reference chain DoS vector @skehmatics

## 12.119.0 (2022/09/10)

### Improvements
- Client: Add following badge to user preview popup @nvisser
- Client: mobile twitter url can be used as widget @caipira113
- Client: Improve clock widget @syuilo

### Bugfixes
- マイグレーションに失敗する問題を修正
- Server: 他人の通知を既読にできる可能性があるのを修正 @syuilo
- Client: アクセストークン管理画面、アカウント管理画面表示できないのを修正 @futchitwo

## 12.118.1 (2022/08/08)

### Bugfixes
- Client: can not show some setting pages @syuilo

## 12.118.0 (2022/08/07)

### Improvements
- Client: 設定のバックアップ/リストア機能
- Client: Add vi-VN language support
- Client: Add unix time widget @syuilo

### Bugfixes
- Server: リモートユーザーを正しくブロックできるように修正する @xianonn
- Client: 一度作ったwebhookの設定画面を開こうとするとページがフリーズする @syuilo
- Client: MiAuth認証ページが機能していない @syuilo
- Client: 一部のアプリからファイルを投稿フォームへドロップできない場合がある問題を修正 @m-hayabusa

## 12.117.1 (2022/07/19)

### Improvements
- Client: UIのブラッシュアップ @syuilo

### Bugfixes
- Server: ファイルのアップロードに失敗することがある問題を修正 @acid-chicken
- Client: リアクションピッカーがアプリ内ウィンドウの後ろに表示されてしまう問題を修正 @syuilo
- Client: ユーザー情報の取得の再試行を修正 @xianonn
- Client: MFMチートシートの挙動を修正 @syuilo
- Client: 「インスタンスからのお知らせを受け取る」の設定を変更できない問題を修正 @syuilo

## 12.117.0 (2022/07/18)

### Improvements
- Client: ウィンドウを最大化できるように @syuilo
- Client: Shiftキーを押した状態でリンクをクリックするとアプリ内ウィンドウで開くように @syuilo
- Client: デッキを使用している際、Ctrlキーを押した状態でリンクをクリックするとページ遷移を強制できるように @syuilo
- Client: UIのブラッシュアップ @syuilo

## 12.116.1 (2022/07/17)

### Bugfixes
- Client: デッキUI時に ページで表示 ボタンが機能しない問題を修正 @syuilo
- Error During Migration Run to 12.111.x

## 12.116.0 (2022/07/16)

### Improvements
- Client: registry editor @syuilo
- Client: UIのブラッシュアップ @syuilo

### Bugfixes
- Error During Migration Run to 12.111.x
- Server: TypeError: Cannot convert undefined or null to object @syuilo

## 12.115.0 (2022/07/16)

### Improvements
- Client: Deckのプロファイル切り替えを簡単に @syuilo
- Client: UIのブラッシュアップ @syuilo

## 12.114.0 (2022/07/15)

### Improvements
- RSSティッカーで表示順序をシャッフルできるように @syuilo

### Bugfixes
- クライアントが起動しなくなることがある問題を修正 @syuilo

## 12.113.0 (2022/07/13)

### Improvements
- Support <plain> syntax for MFM

### Bugfixes
- Server: Fix crash at startup if TensorFlow is not supported @mei23
- Client: URLエンコードされたルーティングを修正

## 12.112.3 (2022/07/09)

### Improvements
- Make active email validation configurable

### Bugfixes
- Server: Fix Attempts to update all notifications @mei23

## 12.112.2 (2022/07/08)

### Bugfixes
- Fix Docker doesn't work @mei23
  Still not working on arm64 environment. (See 12.112.0)

## 12.112.1 (2022/07/07)
same as 12.112.0

## 12.112.0 (2022/07/07)

### Known issues
- 現在arm64環境ではインストールに失敗します。これは次のバージョンで修正される予定です。

### Changes
- ハイライトがみつけるに統合されました
- カスタム絵文字ページはインスタンス情報ページに統合されました
- 連合ページはインスタンス情報ページに統合されました
- メンション一覧ページは通知一覧ページに統合されました
- ダイレクト投稿一覧ページは通知一覧ページに統合されました
- メニューからアンテナタイムラインを表示する方法は廃止され、タイムライン上部のアイコンからアクセスするようになりました
- メニューからリストタイムラインを表示する方法は廃止され、タイムライン上部のアイコンからアクセスするようになりました

### Improvements
- Server: Allow GET method for some endpoints @syuilo
- Server: Auto NSFW detection @syuilo
- Server: Add rate limit to i/notifications @tamaina
- Client: Improve control panel @syuilo
- Client: Show warning in control panel when there is an unresolved abuse report @syuilo
- Client: Statusbars @syuilo
- Client: Add instance-cloud widget @syuilo
- Client: Add rss-ticker widget @syuilo
- Client: Removing entries from a clip @futchitwo
- Client: Poll highlights in explore page @syuilo
- Client: Improve deck UI @syuilo
- Client: Word mute also checks content warnings @Johann150
- Client: メニューからページをリロードできるように @syuilo
- Client: Improve emoji picker performance @syuilo
- Client: For notes with specified visibility, show recipients when hovering over visibility symbol. @Johann150
- Client: Make widgets available again on a tablet @syuilo
- ユーザーにモデレーションメモを残せる機能 @syuilo
- Make possible to delete an account by admin @syuilo
- Improve player detection in URL preview @mei23
- Add Badge Image to Push Notification #8012 @tamaina
- Server: Improve performance
- Server: Supports IPv6 on Redis transport. @mei23
  IPv4/IPv6 is used by default. You can tune this behavior via `redis.family`.
- Server: Add possibility to log IP addresses of users @syuilo
- Add additional drive capacity change support @CyberRex0

### Bugfixes
- Server: Fix GenerateVideoThumbnail failed @mei23
- Server: Ensure temp directory cleanup @Johann150
- favicons of federated instances not showing @syuilo
- Admin: The checkbox for blocking an instance works again @Johann150
- Client: Prevent access to user pages when not logged in @pixeldesu @Johann150
- Client: Disable some hotkeys (e.g. for creating a post) for not logged in users @pixeldesu
- Client: Ask users that are not logged in to log in when trying to vote in a poll @Johann150
- Instance mutes also apply in antennas etc. @Johann150

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
ビルドする前に`yarn clean`を実行してください。

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
