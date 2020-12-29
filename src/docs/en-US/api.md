# Misskey API

MisskeyAPIを使ってMisskeyクライアント、Misskey連携Webサービス、Bot等(以下「アプリケーション」と呼びます)を開発できます。 ストリーミングAPIもあるので、リアルタイム性のあるアプリケーションを作ることも可能です。

APIを使い始めるには、まずアクセストークンを取得する必要があります。 このドキュメントでは、アクセストークンを取得する手順を説明した後、基本的なAPIの使い方を説明します。

## Obtaining an access token
基本的に、APIはリクエストにはアクセストークンが必要となります。 APIにリクエストするのが自分自身なのか、不特定の利用者に使ってもらうアプリケーションなのかによって取得手順は異なります。

* 前者の場合: [「自分自身のアクセストークンを手動発行する」](#自分自身のアクセストークンを手動発行する)に進む
* 後者の場合: [「アプリケーション利用者にアクセストークンの発行をリクエストする」](#アプリケーション利用者にアクセストークンの発行をリクエストする)に進む

### Manually issuing your own access token
You can create an access token in Settings > API

[Proceed to using the API.](#APIの使い方)

### Requesting the user to generate an access token
アプリケーション利用者のアクセストークンを取得するには、以下の手順で発行をリクエストします。

#### Step 1

Generate a UUID.We will call it the session ID from here on.

> The same session ID should not be used for multiple plugins, so please generate a new UUID for each plugin.

#### Step 2

`{_URL_}/miauth/{session}`をユーザーのブラウザで表示させる。`{session}`の部分は、セッションIDに置き換えてください。
> 例: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

表示する際、URLにクエリパラメータとしていくつかのオプションを設定できます:
* `name` ... アプリケーション名
    * > E.g.: `MissDeck`
* `icon` ... アプリケーションのアイコン画像URL
    * > E.g.: `https://missdeck.example.com/icon.png`
* `callback` ... 認証が終わった後にリダイレクトするURL
    * > E.g.: `https://missdeck.example.com/callback`
    * リダイレクト時には、`session`というクエリパラメータでセッションIDが付きます
* `permission` ... アプリケーションが要求する権限
    * > E.g.: `write:notes,write:following,read:drive`
    * 要求する権限を`,`で区切って列挙します
    * どのような権限があるかは[APIリファレンス](/api-doc)で確認できます

#### Step 3
ユーザーが発行を許可した後、`{_URL_}/api/miauth/{session}/check`にPOSTリクエストすると、レスポンスとしてアクセストークンを含むJSONが返ります。

レスポンスに含まれるプロパティ:
* `token` ... ユーザーのアクセストークン
* `user` ... ユーザーの情報

[Proceed to using the API.](#APIの使い方)

## Using the API
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [API Reference](/api-doc)
* [Streaming API](./stream)
