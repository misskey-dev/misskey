# Misskey API

MisskeyAPIを使ってMisskeyクライアント、Misskey連携Webサービス、Bot等(以下「アプリケーション」と呼びます)を開発できます。 ストリーミングAPIもあるので、リアルタイム性のあるアプリケーションを作ることも可能です。

APIを使い始めるには、まずアクセストークンを取得する必要があります。 このドキュメントでは、アクセストークンを取得する手順を説明した後、基本的なAPIの使い方を説明します。

## Einen Zugriffstoken erhalten
基本的に、APIはリクエストにはアクセストークンが必要となります。 APIにリクエストするのが自分自身なのか、不特定の利用者に使ってもらうアプリケーションなのかによって取得手順は異なります。

* Im ersten Fall: Fahre mit "Einen Zugriffstoken für das eigene Benutzerkonto generieren" fort.
* Im zweiten Fall: Fahre mit "Einen Benutzer zur Generierung eines Zugangstokens für eine Anwendung auffordern" fort.

### Einen Zugriffstoken für das eigene Benutzerkonto generieren
In Einstellungen > API kann ein Zugriffstoken für das eigene Benutzerkonto generiert werden.

[Fahre mit "Verwendung der API" fort.](#APIの使い方)

### Einen Benutzer zur Generierung eines Zugangstokens für eine Anwendung auffordern
Um einen in einer Anwendung zu verwendenden Zugriffstoken für ein Benutzerkonto zu erhalten, fordere die Generierung eines solchen durch den unten beschrieben Prozess an.

#### Schritt 1

Generiere eine UUID.Diese werden wir ab jetzt die Sitzungs-ID nennen.

> Die selbe Sitzungs-ID sollte nie mehrfach wieder verwendet werden, generiere anstattdessen für jeden Zugriffstoken eine neue Sitzungs-ID.

#### Schritt 2

Öffne `{_URL_}/miauth/{session}` im Browser des Benutzers.`{session}` soll hierbei durch die vorher generierte Sitzungs-ID ersetzt werden.
> z.B.: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

表示する際、URLにクエリパラメータとしていくつかのオプションを設定できます:
* `name` ... アプリケーション名
    * > z.B.: `MissDeck`
* `icon` ... アプリケーションのアイコン画像URL
    * > z.B.: `https://missdeck.example.com/icon.png`
* `callback` ... 認証が終わった後にリダイレクトするURL
    * > z.B.: `https://missdeck.example.com/callback`
    * リダイレクト時には、`session`というクエリパラメータでセッションIDが付きます
* `permission` ... アプリケーションが要求する権限
    * > z.B.: `write:notes,write:following,read:drive`
    * 要求する権限を`,`で区切って列挙します
    * どのような権限があるかは[APIリファレンス](/api-doc)で確認できます

#### Schritt 3
ユーザーが発行を許可した後、`{_URL_}/api/miauth/{session}/check`にPOSTリクエストすると、レスポンスとしてアクセストークンを含むJSONが返ります。

レスポンスに含まれるプロパティ:
* `token` ... ユーザーのアクセストークン
* `user` ... ユーザーの情報

[Fahre mit "Verwendung der API" fort.](#APIの使い方)

## Verwendung der API
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [API-Referenz](/api-doc)
* [Streaming-API](./stream)
