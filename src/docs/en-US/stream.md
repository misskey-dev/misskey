# Streaming API

By using the streaming API, you can receive various data (such as new posts arriving on the timeline, receiving direct messages, notifications about being followed, etc) in real-time and perform various different actions based on it.

## Connecting to streams

To use the streaming API, you must first connect to the **websocket** of the Misskey server.

Connect to the websocket located at the below URL, including your credentials within the `i` parameter.E.g.:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

Credentials refer to your own API key or the access token granted to an application by a user.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> To read about acquiring such credentials, please refer to <a href="./api">this document</a>.</p>
</div>

---

認証情報は省略することもできますが、その場合非ログインでの利用ということになり、受信できる情報や可能な操作は限られます。E.g.:

```
%WS_URL%/streaming
```

---

ストリームに接続すると、後述するAPI操作や、投稿の購読を行ったりすることができます。 しかしまだこの段階では、例えばタイムラインへの新しい投稿を受信したりすることはできません。 それを行うには、ストリーム上で、後述する**チャンネル**に接続する必要があります。

**ストリームでのやり取りはすべてJSONです。**

## Channels
MisskeyのストリーミングAPIにはチャンネルという概念があります。これは、送受信する情報を分離するための仕組みです。 Misskeyのストリームに接続しただけでは、まだリアルタイムでタイムラインの投稿を受信したりはできません。 ストリーム上でチャンネルに接続することで、様々な情報を受け取ったり情報を送信したりすることができるようになります。

### Connecting to a channel
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

Here,
* `channel`には接続したいチャンネル名を設定します。チャンネルの種類については後述します。
* `id`にはそのチャンネルとやり取りするための任意のIDを設定します。ストリームでは様々なメッセージが流れるので、そのメッセージがどのチャンネルからのものなのか識別する必要があるからです。このIDは、UUIDや、乱数のようなもので構いません。
* `params`はチャンネルに接続する際のパラメータです。チャンネルによって接続時に必要とされるパラメータは異なります。パラメータ不要のチャンネルに接続する際は、このプロパティは省略可能です。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> IDはチャンネルごとではなく「チャンネルの接続ごと」です。なぜなら、同じチャンネルに異なるパラメータで複数接続するケースもあるからです。</p>
</div>

### Receiving messages from channels
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

Here,
* `id`には前述したそのチャンネルに接続する際に設定したIDが設定されています。これで、このメッセージがどのチャンネルからのものなのか知ることができます。
* `type`にはメッセージの種類が設定されます。チャンネルによって、どのような種類のメッセージが流れてくるかは異なります。
* `body`にはメッセージの内容が設定されます。チャンネルによって、どのような内容のメッセージが流れてくるかは異なります。

### チャンネルに向けてメッセージを送信する
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

Here,
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。これで、このメッセージがどのチャンネルに向けたものなのか識別させることができます。
* `type`にはメッセージの種類を設定します。チャンネルによって、どのような種類のメッセージを受け付けるかは異なります。
* `body`にはメッセージの内容を設定します。チャンネルによって、どのような内容のメッセージを受け付けるかは異なります。

### Disconnecting from a channel
チャンネルから切断するには、次のようなデータをJSONでストリームに送信します:

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Here,
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。

## Making API requests via streams

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

Here,
* `id` must be set to an unique ID with which to identify separate request responses.This can be something such as an UUID or a simple random number generator.
* `endpoint` contains the API endpoint to which the request is sent.
* `data` contains the endpoint parameters to send.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> Please check the API reference for possible API endpoints and parameters.</p>
</div>

### Receiving responses

Once you send a request to the API, the stream will send a response message similar to the following:

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

Here,
* the `xxxxxxxxxxxxxxxx` part will normally be replaced with that request's previously set `id`.Due to this, it is easy to tell which response corresponds to which request.
* the actual response data is included as `body`.

## Post capturing

Misskeyは投稿のキャプチャと呼ばれる仕組みを提供しています。これは、指定した投稿のイベントをストリームで受け取る機能です。

例えばタイムラインを取得してユーザーに表示したとします。ここで誰かがそのタイムラインに含まれるどれかの投稿に対してリアクションしたとします。

しかし、クライアントからするとある投稿にリアクションが付いたことなどは知る由がないため、リアルタイムでリアクションをタイムライン上の投稿に反映して表示するといったことができません。

この問題を解決するために、Misskeyは投稿のキャプチャ機構を用意しています。投稿をキャプチャすると、その投稿に関するイベントを受け取ることができるため、リアルタイムでリアクションを反映させたりすることが可能になります。

### Capturing a post

To capture a post, send a message like the following to the stream:

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Here,
* the value of `id` must be the `id` of the post to capture.

Sending this message requests Misskey to capture it and thus events related to this post will start to be emitted.

For example, when a reaction is added to the post, the following message will be emitted:

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

Here,
* the ID of the note that caused the event is included in the `id` of the `body`.
* the type of the event is included in the `type` of the `body`.
* the details of the event are included in the `body` of the `body`.

#### Types of events

##### `reacted`
This event is emitted when a reaction is added to the captured post.

* the type of reaction is included as `reaction`.
* the ID of the user who sent the reaction is included as `userId`.

E.g.:
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
This event is emitted when the captured post is deleted.

* The date and time of deletion is included within `deletedAt`.

E.g.:
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
This event is emitted when a vote is submitted to a poll attached to the captured post.

* the ID of the selected option is included as `choice`.
* the ID of the user who sent the vote is included as `userId`.

E.g.:
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

### Canceling post capturing

Once a post is no longer displayed on the screen and events related to it do not need to be received any longer, please cancel post capturing on it.

Send the following message:

```json
{
    type: 'unsubNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Here,
* the value of `id` must be the `id` of the post for which to cancel capturing.

Once you send this message, events related to this post will no longer be transmitted.

# List of channels
## `main`
Basic information related to the account will be transmitted here.This channel does not have any parameters.

### List of sent events

#### `renote`
This event will be emitted when one of your posts is renoted.If you renote your own post, it will not be emitted.

#### `mention`
This event will be emitted when someone mentions you.

#### `readAllNotifications`
This event indicates that all your notifications have been set to read.このイベントを利用して、「通知があることを示すアイコン」のようなものをオフにしたりする等のケースが想定されます。

#### `meUpdated`
This event indicates that your profile information has been updated.

#### `follow`
This event will be emitted when you follow someone.

#### `unfollow`
This event will be emitted when you unfollow someone.

#### `followed`
This event will be emitted when someone follows you.

## `homeTimeline`
Information about posts on the home timeline will be transmitted here.This channel does not have any parameters.

### List of sent events

#### `note`
This event will be emitted when a new post arrives in the timeline.

## `localTimeline`
Information about posts on the local timeline will be transmitted here.This channel does not have any parameters.

### List of sent events

#### `note`
This event will be emitted when a new post arrives in the local timeline.

## `hybridTimeline`
Information about posts on the social timeline will be transmitted here.This channel does not have any parameters.

### List of sent events

#### `note`
This event will be emitted when a new post arrives in the social timeline.

## `globalTimeline`
Information about posts on the global timeline will be transmitted here.This channel does not have any parameters.

### List of sent events

#### `note`
This event will be emitted when a new post arrives in the global timeline.
