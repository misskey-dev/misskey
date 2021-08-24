# 插件开发
Misskey Web客户端插件功能使您可以扩展客户端并添加各种功能。 我们在这里给出用于创建插件的元数据定义和AiScript API参考。

## 元数据
プラグインは、AiScriptのメタデータ埋め込み機能を使って、デフォルトとしてプラグインのメタデータを定義する必要があります。 メタデータは次のプロパティを含むオブジェクトです。

### name
<<<<<<< HEAD
プラグイン名

### author
プラグイン作者

### version
プラグインバージョン。数値を指定してください。

### description
プラグインの説明

### permissions
プラグインが要求する権限。MisskeyAPIにリクエストする際に用いられます。

### config
プラグインの設定情報を表すオブジェクト。 キーに設定名、値に以下のプロパティを含めます。

#### type
設定値の種類を表す文字列。以下から選択します。 string number boolean

#### label
ユーザーに表示する設定名

#### description
設定の説明

#### default
設定のデフォルト値

## API 参考
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
=======
插件名称

### author
插件作者

### version
插件版本。请使用数字。

### description
插件说明

### permissions
插件要求的权限。需要在发送Misskey API请求时使用。

### config
表示插件设置信息的对象。 在键名中包含设置名称，在键值中包含以下属性。

#### type
代表设置值的类型的字符串。从下列项中选择： string number boolean

#### label
向用户显示的设置名称

#### description
设置说明

#### default
设置的默认值

## API 参考
AiScript标准内置API将不会公布。

### Mk:dialog(title text type)
显示一个对话框。type可以设置为以下值： info success warn error question 默认值为info。

### Mk:confirm(title text type)
显示确认对话框。type可以设置为以下值： info success warn error question 默认值为question。 如果用户选择“OK”，则返回true；如果用户选择“取消”，则返回false。

### Mk:api(endpoint params)
通过Misskey API发送请求。在第一个参数中传入终端名称，在第二个参数中传入参数对象。

### Mk:save(key value)
给任意对象名赋值，并使其持久化。所谓的持久化的值，指的是该值即使在AiScript上下文结束后仍然保留，并且可以通过Mk:load读取。

### Mk:load(key)
读取由Mk:save生成的持久化的值。

### Plugin:register_post_form_action(title fn)
将操作添加到发布表单。第一个参数是操作名，第二个参数是该操作对应的回调函数。 帖子表单对象作为第一个参数传给回调函数。

### Plugin:register_note_action(title fn)
将项目添加到帖子菜单。第一个参数是菜单项名字，第二个参数是该菜单项对应的回调函数。 目标项目对象作为第一个参数传给回调函数。

### Plugin:register_user_action(title fn)
将项目添加到用户菜单。第一个参数是菜单项名字，第二个参数是该菜单项对应的回调函数。 目标用户对象作为第一个参数传给回调函数。
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985

### Plugin:register_note_view_interruptor(fn)
UIに表示されるノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:register_note_post_interruptor(fn)
ノート投稿時にノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:open_url(url)
第一引数に渡されたURLをブラウザの新しいタブで開きます。

### Plugin:config
プラグインの設定が格納されるオブジェクト。プラグイン定義のconfigで設定したキーで値が入ります。
