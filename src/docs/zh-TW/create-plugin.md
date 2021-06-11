# 創建插件
Misskey Webクライアントのプラグイン機能を使うと、クライアントを拡張し、様々な機能を追加できます。 ここではプラグインの作成にあたってのメタデータ定義や、AiScript APIリファレンスを掲載します。

## 元資料
プラグインは、AiScriptのメタデータ埋め込み機能を使って、デフォルトとしてプラグインのメタデータを定義する必要があります。 メタデータは次のプロパティを含むオブジェクトです。

### name
插件名稱

### author
插件的作者

### version
插件版本只允許數字！

### Description
插件的說明

### permissions
插件所需的權限。 MisskeyAPIにリクエストする際に用いられます。

### config
表示插件配置資料的對象。 在鍵中包含設置名稱，在值中包含以下屬性。

#### type
表示設置值類型的字串。 從以下選擇。 string number boolean

#### label
設置顯示給用戶的名稱

#### Description
插件的說明

#### default
設定的預設値

## API 參考
AiScript標準で組み込まれているAPIは掲載しません。

### Mk:dialog(title text type)
ダイアログを表示します。typeには以下の値が設定できます。 info success warn error question 省略すると info になります。

### Mk:confirm(title text type)
確認ダイアログを表示します。typeには以下の値が設定できます。 info success warn error question 省略すると question になります。 ユーザーが"OK"を選択した場合は true を、"キャンセル"を選択した場合は false が返ります。

### Mk:api(endpoint params)
Misskey APIにリクエストします。第一引数にエンドポイント名、第二引数にパラメータオブジェクトを渡します。

### Mk:save(key value)
任意の値に任意の名前を付けて永続化します。永続化した値は、AiScriptコンテキストが終了しても残り、Mk:loadで読み取ることができます。

### Mk:load(key)
Mk:saveで永続化した指定の名前の値を読み取ります。

### Plugin:register_post_form_action(title fn)
投稿フォームにアクションを追加します。第一引数にアクション名、第二引数にアクションが選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に投稿フォームオブジェクトが渡されます。

### Plugin:register_note_action(title fn)
ノートメニューに項目を追加します。第一引数に項目名、第二引数に項目が選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。

### Plugin:register_user_action(title fn)
ユーザーメニューに項目を追加します。第一引数に項目名、第二引数に項目が選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に対象のユーザーオブジェクトが渡されます。

### Plugin:register_note_view_interruptor(fn)
UIに表示されるノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:register_note_post_interruptor(fn)
ノート投稿時にノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:open_url(url)
第一引数に渡されたURLをブラウザの新しいタブで開きます。

### Plugin:config
プラグインの設定が格納されるオブジェクト。プラグイン定義のconfigで設定したキーで値が入ります。
