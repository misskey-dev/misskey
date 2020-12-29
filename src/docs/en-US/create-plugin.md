# Creating plugins
Misskey Webクライアントのプラグイン機能を使うと、クライアントを拡張し、様々な機能を追加できます。 ここではプラグインの作成にあたってのメタデータ定義や、AiScript APIリファレンスを掲載します。

## Metadata
Plugins must define default plugin metadata via the AiScript metadata format. Metadata is an object containing the following properties:

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
Add an item to the note menu.Enter an item name as the first parameter, and a callback function for when the menu item is pressed as second parameter. A note object of the targeted note is passed to the callback function as first parameter.

### Plugin:register_user_action(title fn)
Add an item to the user menu.Enter an item name as the first parameter, and a callback function for when the menu item is pressed as second parameter. A user object of the selected user is passed to the callback function as first parameter.

### Plugin:register_note_view_interruptor(fn)
Modify the data of notes displayed in the UI. A note object is passed to the callback function as first parameter. The note will be modified based on the note object returned by the callback function.

### Plugin:register_note_post_interruptor(fn)
Modify the data of notes about to be posted. A note object is passed to the callback function as first parameter. The note will be modified based on the note object returned by the callback function.

### Plugin:open_url(url)
Opens the URL given as first argument in a new browser tab.

### Plugin:config
An object containing the plugin settings.The values entered in the plugin definition are saved under the setting keys.
