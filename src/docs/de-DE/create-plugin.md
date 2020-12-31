# Erstellung von Plugins
Durch die Verwendung der Plugin-Funktionalität des Misskey Web-Clients kann dieser mit verschiedenen Funktionen erweitert werden. Diese Seite beinhaltet Definitionen von Metadaten für die Erstellung von Plugins sowie eine AiScript API-Referenz für Plugins.

## Metadaten
Plugins müssen benötigte Metadaten im AiScript Metadata-Format angeben. Bei diesen Metadaten handelt es sich um ein Objekt mit folgenden Attributen:

### name
Name des Plugins

### author
Name des Plugin-Erstellers

### version
Version des Plugins.Muss eine Zahl sein.

### description
Beschreibung des Plugins

### permissions
Die vom Plugin geforderten Berechtigungen.Werden bei Anfragen der Misskey API verwendet.

### config
Ein Objekt, dass die Einstellungen des Plugins enthält. Schlüssel representieren Namen von Einstellungen, und Werte sind einer der unten genannten Attribute.

#### type
Der Typ eines Einstellungswertes.Muss aus einem dieser Typen gewählt sein: string number boolean

#### label
Dem Benutzer angezeigter Einstellungsname

#### description
Beschreibung der Einstellung

#### default
Standardwert der Einstellung

## API-Referenz
Direkt in den AiScript-Standard eingebaute API wird nicht aufgelistet.

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
An object containing the plugin settings.プラグイン定義のconfigで設定したキーで値が入ります。
