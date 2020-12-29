# Creating plugins
Misskey Webクライアントのプラグイン機能を使うと、クライアントを拡張し、様々な機能を追加できます。 ここではプラグインの作成にあたってのメタデータ定義や、AiScript APIリファレンスを掲載します。

## Metadata
プラグインは、AiScriptのメタデータ埋め込み機能を使って、デフォルトとしてプラグインのメタデータを定義する必要があります。 メタデータは次のプロパティを含むオブジェクトです。

### name
Plugin name

### author
Plugin author

### version
Plugin version.Please enter a number.

### description
Plugin description

### permissions
Permissions required by the plugin.Used when making requests to the Misskey API.

### config
An object representing the plugin's settings. Set the keys to setting names and the values to one of the below properties.

#### type
A string representing the setting's value type.Selected from one of the below types. string number boolean

#### label
Setting name to do display to the user

#### description
Description of the setting

#### default
Default value of the setting

## API Reference
API built into AiScript is not listed.

### Mk:dialog(title text type)
Display a dialog.You can select one of the below types. info success warn error question If no type is selected, "info" is chosen by default.

### Mk:confirm(title text type)
Display a confirmation dialog.You can select one of the below types. info success warn error question If no type is selected, "question" is chosen by default. If the user presses "OK" true will be returned, if they press "Cancel" false will be returned.

### Mk:api(endpoint params)
Sends a request to the Misskey API.Specify the endpoint name as the first parameter and the request parameters as the second argument.

### Mk:save(key value)
Persistently saves any given value under a given key.The saved value will remain even after the AiScript context ends and can be loaded with Mk:load.

### Mk:load(key)
Reads the value of the given key that was previously saved with Mk:save.

### Plugin:register_post_form_action(title fn)
Add an action to the post form.Enter an action name as the first parameter, and a callback function for when the action is executed as second parameter. A post form object is passed to the callback function as first argument.

### Plugin:register_note_action(title fn)
Add an item to the note menu.第一引数に項目名、第二引数に項目が選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。

### Plugin:register_user_action(title fn)
ユーザーメニューに項目を追加します。第一引数に項目名、第二引数に項目が選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に対象のユーザーオブジェクトが渡されます。

### Plugin:register_note_view_interruptor(fn)
UIに表示されるノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:register_note_post_interruptor(fn)
ノート投稿時にノート情報を書き換えます。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。 コールバック関数の返り値でノートが書き換えられます。

### Plugin:open_url(url)
Opens the URL given as first argument in a new browser tab.

### Plugin:config
An object containing the plugin settings.The values entered in the plugin definition are saved under the setting keys.
