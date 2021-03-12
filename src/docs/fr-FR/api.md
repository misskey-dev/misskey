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

> このセッションIDは毎回生成し、使いまわさないようにしてください。

#### Step 2

`{_URL_}/miauth/{session}`をユーザーのブラウザで表示させる。`{session}`の部分は、セッションIDに置き換えてください。
> 例: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

表示する際、URLにクエリパラメータとしていくつかのオプションを設定できます:
* `name` ... アプリケーション名
    * > 例: `MissDeck`
* `icon` ... アプリケーションのアイコン画像URL
    * > 例: `https://missdeck.example.com/icon.png`
* `callback` ... 認証が終わった後にリダイレクトするURL
    * > 例: `https://missdeck.example.com/callback`
    * リダイレクト時には、`session`というクエリパラメータでセッションIDが付きます
* `permission` ... アプリケーションが要求する権限
    * > 例: `write:notes,write:following,read:drive`
    * 要求する権限を`,`で区切って列挙します
    * どのような権限があるかは[APIリファレンス](/api-doc)で確認できます

#### Step 3
ユーザーが発行を許可した後、`{_URL_}/api/miauth/{session}/check`にPOSTリクエストすると、レスポンスとしてアクセストークンを含むJSONが返ります。

レスポンスに含まれるプロパティ:
* `token` ... ユーザーのアクセストークン
* `user` ... ユーザーの情報

[Continuer avec « Utiliser l'API ».](#APIの使い方)

## APIの使い方
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [APIリファレンス](/api-doc)
* [ストリーミングAPI](./stream)
