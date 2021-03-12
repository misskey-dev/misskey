# API de Misskey

Vous pouvez utiliser l'API de Misskey pour développer des clients Misskey, des services web s'intégrant à Misskey, des Bots (que nous appellerons plus loin "Applications"), etc. Comme l'API streaming est aussi implémenté, vous avez la possibilité de créer des applications de temps réel.

Pour pouvoir vous servir de l'API, il vous faudra d'abord obtenir un jeton d'accès. Ce guide a été conçu pour vous accompagner dans le processus d'obtention du jeton d'accès, puis donner des instructions de base sur l'utilisation de l'API.

## Obtenir le jeton d'accès
Une requête d'API, par essence, nécessite un jeton d'accès. La procédure d'acquisition du jeton diffère selon que vous effectuez la requête vous-même, ou qu'elle est envoyée via une application par un utilisateur final non défini.

* Dans le premier cas : allez à [« Générer manuellement un jeton d'accès pour son propre compte »](#自分自身のアクセストークンを手動発行する).
* Dans le second cas : allez à [« Demander la génération du jeton d'accès via un utilisateur d'application »](#アプリケーション利用者にアクセストークンの発行をリクエストする).

### Générer manuellement un jeton d'accès pour son propre compte
Vous pouvez générer votre propre jeton d'accès en allant dans { Paramètres > API }.

[Continuer avec « Utiliser l'API ».](#APIの使い方)

### Demander la génération du jeton d'accès via un utilisateur d'application
Pour obtenir un jeton d'accès pour le compte utilisateur final de votre application, suivez la procédure de génération ci-dessous.

#### Étape 1

Générez un UUID. Nous l'appellerons « ID de session » dans la suite de ce guide.

> Un même ID de session ne devrait pas être utilisé plusieurs fois ; veillez à en générer un nouveau pour chaque jeton d'accès.

#### Étape 2

Ouvrez l'adresse `{_URL_}/miauth/{session}` dans le navigateur de l'utilisateur. Remplacez alors la partie `{session}` de l'URL par l'ID de session que vous venez de générer.
> Par ex. : `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

En ouvrant cette URL, vous pourrez configurer un certain nombre d'options pour les paramètres de requête :
* `name` :  nom de l'application
    * > Ex. : `MissDeck`
* `icon` :  URL de l'icône de l'application
    * > Ex. : `https://missdeck.example.com/icon.png`
* `callback` :  URL de redirection après l'authentification
    * > Ex. : `https://missdeck.example.com/callback`
    * Lors de la redirection, un paramètre de requête `session` contenant l'ID de session sera joint.
* `permission` :  permissions requises par l'application
    * > Ex. : `write:notes,write:following,read:drive`
    * Listez les permissions requises en utilisant une `,` pour les séparer.
    * Vous pouvez vérifier quelles sont les permissions disponibles sur [les références API de Misskey](/api-doc).

#### Étape 3
Si vous envoyez une requête POST à `{_URL_}/api/miauth/{session}/check` une fois que l'utilisateur a validé le jeton d'accès, la réponse arrivera sous forme de fichier JSON contenant ce jeton.

Propriétés incluses dans la réponse :
* `token` :  jeton d'accès de l'utilisateur
* `user` :  données de l'utilisateur

[Continuer avec « Utiliser l'API ».](#APIの使い方)

## APIの使い方
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [APIリファレンス](/api-doc)
* [ストリーミングAPI](./stream)
