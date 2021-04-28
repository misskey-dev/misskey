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
Ajoute un élément au menu note. Le premier paramètre spécifie le nom de l'action, le second paramètre spécifie une fonction de rappel qui est exécutée lorsque cet élément est sélectionné. La fonction de rappel reçoit un objet note comme premier paramètre.

### Plugin:register_user_action(title fn)
Ajoute un élément au menu de l'utilisateur.Le premier paramètre spécifie le nom de l'action, le second paramètre spécifie une fonction de rappel qui est exécutée lorsque cet élément est sélectionné. La fonction de rappel reçoit un objet utilisateur comme premier paramètre.

### Plugin:register_note_view_interruptor(fn)
Réécrit les informations de la note affichée dans l'interface utilisateur. L'objet note cible est passé comme premier argument à la fonction de rappel. La note est réécrite dans la valeur de retour de la fonction de rappel.

### Plugin:register_note_post_interruptor(fn)
Réécrit les informations de la note lors de la publication d'une note. L'objet note cible est passé comme premier argument à la fonction de rappel. La note sera réécrite dans la valeur de retour de la fonction de rappel.

### Plugin:open_url(url)
Ouvre l'URL passée comme premier argument dans un nouvel onglet du navigateur.

### Plugin:config
Un objet dans lequel la configuration du plugin est stockée.La valeur est saisie par la clé définie dans la configuration de la définition du plugin.
