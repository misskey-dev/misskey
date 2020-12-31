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
Zeigt ein Dialogfenster an.type muss aus einem der folgenden Werte gewählt werden. info success warn error question Falls kein Typ angegeben wird, wird dieser zu info gesetzt.

### Mk:confirm(title text type)
Zeigt ein Bestätigungsfenster an.type muss aus einem der folgenden Werte gewählt werden. info success warn error question Falls kein Typ angegeben wird, wird dieser zu question gesetzt. Drückt der Benutzer "OK" wird true zurückgegeben, drückt er "Cancel" wird false zurückgegeben.

### Mk:api(endpoint params)
Sendet eine Misskey API-Anfrage.第一引数にエンドポイント名、第二引数にパラメータオブジェクトを渡します。

### Mk:save(key value)
Speichert einen beliebigen Wert dauerhaft unter einem beliebigen Namen.Der gespeicherte Wert bleibt auch nach Verlassen des AiScript-Kontexts erhalten und kann mit Mk:load ausgelesen werden.

### Mk:load(key)
Läd den Wert des gegebenen Schlüssels, der zuvor mit Mk:save gespeichert wurde

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
Öffnet die als ersten Parameter gegebene URL in einem neuen Browser-Tab.

### Plugin:config
Ein Objekt, dass die Plugin-Einstellungen enthält.Die in den Plugin-Einstellung eingetragenen Werte sind hier unter den Einstellungsnamen gespeichert.
