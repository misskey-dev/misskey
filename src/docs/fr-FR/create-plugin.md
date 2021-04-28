# Création d'un plugin
En utilisant la fonction plugin du client web Misskey, vous pouvez étendre et y ajouter de nouvelles fonctionnalités. Cette page liste la définition des métadonnées et les références de l'API AIScript pour la création des plugins.

## Métadonnées
Les plugins doivent définir des métadonnées de plugin par défaut via le format de métadonnées AiScript. Les métadonnées sont un objet contenant les propriétés suivantes :

### name
Nom du plugin.

### author
Nom de l'auteur du plugin.

### version
Version du plugin.Cette valeur doit être un nombre.

### description
Description du plugin.

### permissions
Permissions requises par le plugin.Utilisé pour les requêtes de l'API Misskey.

### config
Un objet représentant les paramètres du plugin. Les clés représentent les noms des paramètres et les valeurs sont l'une des propriétés ci-dessous.

#### type
Une chaîne de caractères représentant le type de valeur du paramètre.Sélectionnez l'une des options suivantes : string number boolean

#### label
Nom du paramètre affiché à l'utilisateur.

#### description
Description du paramètre

#### default
Valeur par défaut du paramètre

## Références API de Misskey
L'API intégrée directement dans la norme AiScript elle-même ne sera pas répertoriée.

### Mk:dialog(title text type)
Affiche la boîte de dialogue.type peut être défini par les valeurs suivantes. info success warn error question Si elle est omise, c'est "info" qui est utilisée.

### Mk:confirm(title text type)
Affiche une boîte de dialogue de confirmation.Le type peut être défini par les valeurs suivantes. info success warn error question Si elle est omise, c'est "question" qui est utilisé par défaut. Si l'utilisateur sélectionne "OK", true est renvoyé, si l'utilisateur sélectionne "Cancel", false est renvoyé.

### Mk:api(endpoint params)
Envoie une requête à l'API Misskey.Le premier paramètre spécifie le point de terminaison de l'API, le second spécifie les paramètres de la requête sous forme d'objet.

### Mk:save(key value)
Fait persister une valeur arbitraire avec un nom arbitraire.La valeur persistante reste après la fin du contexte AiScript et peut être lue par Mk:load.

### Mk:load(key)
Lit la valeur du nom spécifié persisté par Mk:save.

### Plugin:register_post_form_action(title fn)
Ajoute une action au formulaire de soumission.Le premier argument est le nom de l'action, le second est la fonction de rappel lorsque l'action est sélectionnée. La fonction de rappel reçoit l'objet du formulaire de soumission comme premier argument.

### Plugin:register_note_action(title fn)
Ajoute un élément au menu note. 第一引数に項目名、第二引数に項目が選択された際のコールバック関数を渡します。 コールバック関数には、第一引数に対象のノートオブジェクトが渡されます。

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
