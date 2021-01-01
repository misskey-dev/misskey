# Streaming API

Durch die Verwendung des Streaming-APIs können verschiedene Daten (z.B. darüber, dass neue Beiträge geschrieben wurden, neue Direktnachrichten eingetroffen sind, Benachrichtigungen über einen neuen Follower, usw) in Echtzeit empfangen werden und dann basierend auf diesen verschiedene Aktionen getätigt werden.

## Eine Verbindung zum Stream aufbauen

Um das Streaming-API zu benutzen, muss zuerst eine Verbindung zu Misskey's **websocket** Server aufgebaut werden.

Baue bitte mit Hilfe der unten stehenden URL eine websocket-Verbindung auf, wobei die Anmeldedaten als `i`-Parameter enthalten sind.z.B.:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

Anmeldedaten steht hierfür entweder für den eigenen API-Schlüssel oder bei Verbindungen zum Stream für den durch eine Anwendung generierten Zugangstoken eines Benutzers.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> Siehe <a href="./api">dieses Dokument</a> für Informationen, wie solche Anmeldedaten erhalten werden können.</p>
</div>

---

Ein Verbindungsaufbau ohne Anmeldedaten ist ebenso möglich, jedoch wird in diesem Fall der Zugriff auf manche Daten sowie die Verwendung mancher Funktionen eingeschränkt.z.B.:

```
%WS_URL%/streaming
```

---

Eine Verbindung zum Stream kann durch die später erläuterte API oder durch das Abbonieren individueller Beiträge getätigt werden. Jedoch können zu diesem Zeitpunkt noch keine Informationen über Chroniken wie das Eintreffen neuer Beiträge empfangen werden. Um dies zu ermöglichen, müssen Verbindungen zu später erläuterten **Kanälen** aufgebaut werden.

**Alle Nachrichten an den sowie vom Stream sind in JSON-Format.**

## Kanäle
Innerhalb des Misskey Streaming-APIs existiert das Konzept von Kanälen.Diese werden zur Abspaltung der Informationen, die erhalten werden sollen, verwendet. Wird eine Verbindung zum Misskey Stream aufgebaut, so ist es noch nicht möglich, sofort Echtzeit-Aktualisierungen zu empfangen. Durch den Verbindungsaufbau zu Kanälen des Streams wird beidseitige Kommunikation bezüglich Informationen dieses Kanals ermöglicht.

### Verbindungen zu Kanälen aufbauen
Um eine Verbindung zu einem Kanal aufzubauen, sende die folgende Nachricht:

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
* steht `channel` für den Namen des Kanals, zu dem eine Verbindung aufgebaut werden soll.Eine Liste der verfügbaren Kanäle wird später angegeben.
* steht `id` für eine einzigartige ID zur Kommunikation mit diesem Kanal.Da durch den Stream viele verschiedene Nachrichten erhalten werden können, ist eine Zuordnung, zu welchen Kanal eine Nachricht gehört, notwendig.Diese ID kann eine UUID oder etwas wie der Wert eines Zufallszahlengenerators sein.
* steht `params` für die Parameter zum Verbindunsgaufbau.Je nach Kanal können die verfügbaren Parameter abweichen.Bei Kanälen, die keine Parameter akzeptieren, kann dieses Attribut ausgelassen werden.

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
Um die Verbindung zu einem Kanal zu trennen, sende die folgende Nachricht:

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Hier,
* steht `id` für die zum Verbindungsaufbau gewählte ID.

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
* existiert `id` zur Zuordnung von Anfrage und Antwort und muss auf eine einzigartige ID gesetzt werden.Die Verwendung von UUIDs oder auch dem Wert eines simplen Zufallszahlengenerators ist empfohlen.
* gibt `endpoint` den Endpoint an, an den die Anfrage gesendet werden soll.
* enthält `data` die Parameter der Anfrage des Endpoints.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> Siehe die API-Referenz bezüglich einer Auflistung verfügbarer API-Endpoints sowie dessen Parameter.</p>
</div>

### Verarbeitung von Antworten auf Anfragen

Sobald eine Anfrage an die API gesendet wurde, wird eine Antwort wie die folgende empfangen:

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

Um einen Beitrag zu erfassen, sende folgende Nachricht an den Stream:

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Hier,
* `id` enthält die `id` des Beitrags der erfasst werden soll.

Sobald diese Nachricht gesendet wurde wird dieser Beitrag von Misskey erfasst und es können von nun an diesen Beitrag betreffende Events empfangen werden.

Beispielsweise wird das folgende Event empfangen, sobald einem erfassten Beitrag eine Reaktion hinzugefügt wurde:

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

Sobald ein Beitrag nicht mehr auf der Chronik angezeigt wird und somit diesen Beitrag betreffende Events nicht mehr benötigt werden, bitten wir um die Aufhebung der Erfassung dieses Beitrags.

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
Allgemeine den Benutzer betreffende Informationen werden über diesen Kanal empfangen.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `renote`
Wird ausgelöst, sobald ein eigener Beitrag ein Renote erhält.Renotes von eigenen Beiträgen lösen dieses Event nicht aus.

#### `mention`
Wird ausgelöst, sobald der Benutzer von einem anderen Benutzer erwähnt wird.

#### `readAllNotifications`
Dieses Event gibt an, dass alle Benachrichtungen auf gelesen gesetzt wurden.Es wird erwartet, dass dieses Event für bsp. Fälle eingesetzt wird, in denen der Indikator für ungelesene Benachrichtigungen deaktiviert werden soll.

#### `meUpdated`
Wird bei Aktualisierung der eigenen Benutzerdaten augelöst.

#### `follow`
Wird augelöst, sobald einem neuen Benutzer gefolgt wird.

#### `unfollow`
Wird augelöst, sobald einem Benutzer nicht mehr gefolgt wird.

#### `followed`
Wird augelöst, sobald der Benutzer einen neuen Follower erhält.

## `homeTimeline`
Informationen über Beiträge der Startseiten-Chronik werden über diesen Kanal empfangen.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der Chronik ein neuer Beitrag erscheint.

## `localTimeline`
Informationen über Beiträge der lokalen Chronik werden über diesen Kanal empfangen.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der lokalen Chronik ein neuer Beitrag erscheint.

## `hybridTimeline`
Informationen über Beiträge der Sozial-Chronik werden über diesen Kanal empfangen.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der Sozial-Chronik ein neuer Beitrag erscheint.

## `globalTimeline`
Informationen über Beiträge der globalen Chronik werden über diesen Kanal empfangen.Dieser Kanal hat keine Parameter.

### Liste der Events, die augelöst werden können

#### `note`
Wird augelöst, sobald auf der globalen Chronik ein neuer Beitrag erscheint.
