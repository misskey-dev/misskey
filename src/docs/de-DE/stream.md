# Streaming API

ストリーミングAPIを使うと、リアルタイムで様々な情報(例えばタイムラインに新しい投稿が流れてきた、メッセージが届いた、フォローされた、など)を受け取ったり、様々な操作を行ったりすることができます。

## Eine Verbindung zum Stream aufbauen

ストリーミングAPIを利用するには、まずMisskeyサーバーに**websocket**接続する必要があります。

以下のURLに、`i`というパラメータ名で認証情報を含めて、websocket接続してください。z.B.:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

認証情報は、自分のAPIキーや、アプリケーションからストリームに接続する際はユーザーのアクセストークンのことを指します。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> 認証情報の取得については、<a href="./api">こちらのドキュメント</a>をご確認ください。</p>
</div>

---

認証情報は省略することもできますが、その場合非ログインでの利用ということになり、受信できる情報や可能な操作は限られます。z.B.:

```
%WS_URL%/streaming
```

---

ストリームに接続すると、後述するAPI操作や、投稿の購読を行ったりすることができます。 しかしまだこの段階では、例えばタイムラインへの新しい投稿を受信したりすることはできません。 それを行うには、ストリーム上で、後述する**チャンネル**に接続する必要があります。

**Alle Nachrichten an den sowie vom Stream sind in JSON-Format.**

## Kanäle
MisskeyのストリーミングAPIにはチャンネルという概念があります。これは、送受信する情報を分離するための仕組みです。 Misskeyのストリームに接続しただけでは、まだリアルタイムでタイムラインの投稿を受信したりはできません。 ストリーム上でチャンネルに接続することで、様々な情報を受け取ったり情報を送信したりすることができるようになります。

### Verbindungen zu Kanälen aufbauen
チャンネルに接続するには、次のようなデータをJSONでストリームに送信します:

```json
{
    type: 'connect',
    body: {
        channel: 'xxxxxxxx',
        id: 'foobar',
        params: {
            ...
        }
    }
}
```

Hier,
* `channel`には接続したいチャンネル名を設定します。チャンネルの種類については後述します。
* `id`にはそのチャンネルとやり取りするための任意のIDを設定します。ストリームでは様々なメッセージが流れるので、そのメッセージがどのチャンネルからのものなのか識別する必要があるからです。このIDは、UUIDや、乱数のようなもので構いません。
* `params`はチャンネルに接続する際のパラメータです。チャンネルによって接続時に必要とされるパラメータは異なります。パラメータ不要のチャンネルに接続する際は、このプロパティは省略可能です。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> IDはチャンネルごとではなく「チャンネルの接続ごと」です。なぜなら、同じチャンネルに異なるパラメータで複数接続するケースもあるからです。</p>
</div>

### Verarbeitung von eintreffenden Nachrichten der Kanäle
例えばタイムラインのチャンネルなら、新しい投稿があった時にメッセージを発します。そのメッセージを受け取ることで、タイムラインに新しい投稿がされたことをリアルタイムで知ることができます。

チャンネルがメッセージを発すると、次のようなデータがJSONでストリームに流れてきます:
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

Hier,
* `id`には前述したそのチャンネルに接続する際に設定したIDが設定されています。これで、このメッセージがどのチャンネルからのものなのか知ることができます。
* `type`にはメッセージの種類が設定されます。チャンネルによって、どのような種類のメッセージが流れてくるかは異なります。
* `body`にはメッセージの内容が設定されます。チャンネルによって、どのような内容のメッセージが流れてくるかは異なります。

### Nachrichten an Kanäle senden
チャンネルによっては、メッセージを受け取るだけでなく、こちらから何かメッセージを送信し、何らかの操作を行える場合があります。

チャンネルにメッセージを送信するには、次のようなデータをJSONでストリームに送信します:
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

Hier,
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。これで、このメッセージがどのチャンネルに向けたものなのか識別させることができます。
* `type`にはメッセージの種類を設定します。チャンネルによって、どのような種類のメッセージを受け付けるかは異なります。
* `body`にはメッセージの内容を設定します。チャンネルによって、どのような内容のメッセージを受け付けるかは異なります。

### Verbindungen zu Kanälen trennen
チャンネルから切断するには、次のようなデータをJSONでストリームに送信します:

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Hier,
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。

## API-Anfragen durch den Stream senden

ストリームを経由してAPIリクエストすると、HTTPリクエストを発生させずにAPIを利用できます。そのため、コードを簡潔にできたり、パフォーマンスの向上を見込めるかもしれません。

ストリームを経由してAPIリクエストするには、次のようなデータをJSONでストリームに送信します:
```json
{
    type: 'api',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        endpoint: 'notes/create',
        data: {
            text: 'yee haw!'
        }
    }
}
```

Hier,
* `id`には、APIのレスポンスを識別するための、APIリクエストごとの一意なIDを設定する必要があります。UUIDや、簡単な乱数のようなもので構いません。
* `endpoint`には、あなたがリクエストしたいAPIのエンドポイントを指定します。
* `data`には、エンドポイントのパラメータを含めます。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> APIのエンドポイントやパラメータについてはAPIリファレンスをご確認ください。</p>
</div>

### Verarbeitung von Antworten auf Anfragen

APIへリクエストすると、レスポンスがストリームから次のような形式で流れてきます。

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

Hier,
* steht an Stelle der `xxxxxxxxxxxxxxxx` die vorher angegebene `id`.Dadurch ist eine Zuordnung von Anfrage zu Antwort möglich.
* ist der Antwortwert der Anfrage in `body` enthalten.

## Beitragserfassung

Misskeyは投稿のキャプチャと呼ばれる仕組みを提供しています。これは、指定した投稿のイベントをストリームで受け取る機能です。

例えばタイムラインを取得してユーザーに表示したとします。ここで誰かがそのタイムラインに含まれるどれかの投稿に対してリアクションしたとします。

しかし、クライアントからするとある投稿にリアクションが付いたことなどは知る由がないため、リアルタイムでリアクションをタイムライン上の投稿に反映して表示するといったことができません。

この問題を解決するために、Misskeyは投稿のキャプチャ機構を用意しています。投稿をキャプチャすると、その投稿に関するイベントを受け取ることができるため、リアルタイムでリアクションを反映させたりすることが可能になります。

### Einen Beitrag erfassen

投稿をキャプチャするには、ストリームに次のようなメッセージを送信します:

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Hier,
* `id`にキャプチャしたい投稿の`id`を設定します。

このメッセージを送信すると、Misskeyにキャプチャを要請したことになり、以後、その投稿に関するイベントが流れてくるようになります。

例えば投稿にリアクションが付いたとすると、次のようなメッセージが流れてきます:

```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

Hier,
* das `id`-Attribut in `body` enthält die ID des Beitrags, der das Event ausgelöst hat.
* das `type`-Attribut in `body` die Art des Events.
* das `body`-Attribut von `body` enthält weitere Informationen über das Event.

#### Arten von Events

##### `reacted`
Wird bei Reaktion auf den Beitrag ausgelöst.

* `reaction` enthält die Art der Reaktion.
* `userId` enthält die ID des Benutzers, der die Reaktion hinzufügte

z.B.:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

##### `deleted`
Wird bei Löschung des Beitrags ausgelöst.

* `deletedAt` enthält Löschdatum und Zeitpunkt.

z.B.:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'deleted',
        body: {
            deletedAt: '2018-10-22T02:17:09.703Z'
        }
    }
}
```

##### `pollVoted`
Wird bei Abstimmung in einer dem Beitrag angehörigen Umfrage ausgelöst.

* `choice` enthält die ID der gewählten Auswahlmöglichkeit.
* `userId` enthält die ID des Benutzers, der auf die Umfrage antwortete

z.B.:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'pollVoted',
        body: {
            choice: 2,
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

### Beitragserfassung aufheben

その投稿がもう画面に表示されなくなったりして、その投稿に関するイベントをもう受け取る必要がなくなったときは、キャプチャの解除を申請してください。

Sende die folgende Nachricht:

```json
{
    type: 'unsubNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Hier,
* `id` enthält die `id` des Beitrags, für den Erfassung aufgehoben werden soll.

Sobald diese Nachricht versendet wurde, werden mit diesem Beitrag verbundene Events nicht mehr empfangen.

# List aller Kanäle
## `main`
アカウントに関する基本的な情報が流れてきます。このチャンネルにパラメータはありません。

### Liste der Events, die augelöst werden können

#### `renote`
Wird ausgelöst, sobald ein eigener Beitrag ein Renote erhält.Renotes von eigenen Beiträgen lösen dieses Event nicht aus.

#### `mention`
Wird ausgelöst, sobald der Benutzer von einem anderen Benutzer erwähnt wird.

#### `readAllNotifications`
自分宛ての通知がすべて既読になったことを表すイベントです。このイベントを利用して、「通知があることを示すアイコン」のようなものをオフにしたりする等のケースが想定されます。

#### `meUpdated`
Wird bei Aktualisierung der eigenen Benutzerdaten augelöst.

#### `follow`
Wird augelöst, sobald einem neuen Benutzer gefolgt wird.

#### `unfollow`
Wird augelöst, sobald einem Benutzer nicht mehr gefolgt wird.

#### `followed`
Wird augelöst, sobald der Benutzer einen neuen Follower erhält.

## `homeTimeline`
Sendet Informationen über Beiträge der Startseiten-Chronik.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der Chronik ein neuer Beitrag erscheint.

## `localTimeline`
Sendet Informationen über Beiträge der lokalen Chronik.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der lokalen Chronik ein neuer Beitrag erscheint.

## `hybridTimeline`
Sendet Informationen über Beiträge der Sozial-Chronik.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird gesendet, sobald auf der Sozial-Chronik ein neuer Beitrag erscheint.

## `globalTimeline`
Sendet Informationen über Beiträge der globalen Chronik.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird gesendet, sobald auf der globalen Chronik ein neuer Beitrag erscheint.
