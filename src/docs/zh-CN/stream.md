# 流式API

通过流式API，您可以实时接收各种信息（例如，你的时间线中的新帖文，收到的消息，关注等），并进行各种操作。

## 连接到流

要使用流式API，您需要使用**websocket**连接到Misskey服务器。

请使用参数`i`连接到以下URL，并在websocket连接中包含认证信息。例如：
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

认证信息是您的API密钥，从应用程序连接到流时需要引用的用户访问令牌

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> 关于如何获取认证信息，请参考<a href="./api">此文档</a>。</p>
</div>

---

您可以省略身份验证信息。此时无需登录即可使用，但是可以接收的信息和可以执行的操作将受到限制。例：

```
%WS_URL%/streaming
```

---

通过连接到流，您可以执行后文所示的API操作并订阅帖子。 但是此时例如时间线上的新帖子等还无法接收到。 要实现此功能，您需要连接到后文所述的流的**频道**。

**所有流交互都是JSON格式。**

## 频道
频道是Misskey的流API中的概念。这是一种分离发送和接收信息的机制。 您无法仅通过连接到Misskey流来实时接收时间线帖子。 需要通过连接到流中的频道，您才能够接收和发送各种消息。

### 连接到频道
要连接到频道，请将JSON数据发送到流：

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

其中：
* `channel`中可以设置您要连接的频道名。频道类型将在后面说明。
* `id`设置用于与频道通信的ID。因为流中有着各种消息，因此需要确定消息来自哪个频道。该ID可以是UUID或随机数。
* `params`是连接到频道时传的参数。连接不同的频道时需要不同的参数。连接到无需参数的频道时，该属性为可选。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> ID对应的是“频道的连接”，而不是频道。因为在某些情况下会使用不同的参数对同一频道进行多个连接。</p>
</div>

### 从频道接收消息
例如，当有新帖子时，时间线的频道将发送一条消息。通过接收此消息，您可以实时知道时间线上有新帖子。

当频道发出消息时，以下数据将以JSON格式传输到流中：
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

其中：
* `id`为前文所述连接到频道时所设置的ID。因此可以知道此消息来自哪个频道。
* `type`为所设的消息类型。不同的频道会有不同类型的消息。
* `body`为所设的消息内容。不同的频道中的消息内容也会有不同。

### 向频道发送消息
根据频道的不同，您不仅可以接收消息，而且还可以发送消息并执行某些操作。

要将消息发送到频道，请将JSON格式数据发送到流：
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

其中：
* `id`为前文所述连接到频道时想要设置的ID。因此您可以决定此消息发送到哪个频道。
* `type`为想要设置的消息类型。不同的频道会接受不同类型的消息。
* `body`为想要设置的消息内容。不同的频道接受的消息内容也会不同。

### 断开频道连接
要断开与频道的连接，请将JSON格式数据发送到流：

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

其中：
* `id`为前文所述连接到频道时想要设置的ID。

## 通过流发送API请求

使用流的方式可以在不使用http请求的条件下来发送API请求。因此，您可以使用更简洁的代码来提高效率。

要通过流发送AP​​I请求，请将如下所示的JSON格式数据发送到流：
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

其中：
* `id`是一个唯一的ID，用来识别不同请求所对应的回应。可以使用UUID或者简单的随机数生成方法。
* `endpoint`包含请求要指定发送的API终端。
* `data`包含需要发送的终端参数。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> 详见API参考中的API终端和参数。</p>
</div>

### 接收回应

当你向API发送请求时，会受到流发送的如下格式的回应：

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

其中：
* `xxxxxxxxxxxxxxxx`部分包含该请求之前设置过的`id`。因此，可以判断出回应是对应的哪个请求。
* `body`包含回应的数据。

## 帖子抓取

Misskey提供一种被称为“帖子抓取”的机制。该功能以流的形式接受指定帖子的事件。

例如，假设您获得了时间线的数据并将其显示给用户。而现在有人对时间线中的某一个帖子做出了回应。

但是，由于客户端无法知道某个帖子有回应，因此无法在时间线上的帖子中反映并实时显示出来。

为了解决此问题，Misskey引入了帖子抓取的机制。抓取帖子时，您可以接收与该帖子相关的事件，因此您可以将帖子的回应实时反映出来。

### 抓取帖子

要抓取帖子，请向流发送下列格式的消息：

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

其中：
* 请将`id`的值设置为需要抓取的帖子`id`值

发送此消息表示您已请求Misskey抓取该贴子，并且您将收到与该帖子有关的事件。

例如，如果帖子有回应，您将收到以下消息：

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

其中：
* `body`里的`id`用来表示触发事件的帖子的ID。
* `body`里的`type`用来表示事件类型。
* `body`里的`body`用来表示事件详细内容。

#### 事件类型

##### `reacted`
在帖子有回应时触发。

* `reaction`用来表示回应的类型。
* `userId`用来表示做出回应的用户的ID。

例：
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
帖子删除时触发。

* `deletedAt`表示删除的日期和时间。

例：
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
帖子附带的问卷调查被投票时触发。

* `choice`表示选择项ID。
* `userId`表示投票的用户ID。

例：
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

### 取消帖子抓取

如果希望该帖子不再出现在屏幕上，并且您不再需要接收与该帖子相关的事件，可以发送取消帖子抓取的请求。

请发送以下消息：

```json
{
    type: 'unsubNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

其中：
* 请将`id`的值设置为需要取消抓取的帖子`id`值。

发送此消息后，将不再接收与该帖子相关的其他事件。

# 频道列表
## `main`
将会发送帐户的基本信息。该频道没有参数。

### 发送的事件列表

#### `renote`
当您的帖子被转发时会触发该事件。转发自己的帖子不会触发。

#### `mention`
有人提及您时会触发该事件。

#### `readAllNotifications`
这个事件表示您的所有通知都被设为已读。このイベントを利用して、「通知があることを示すアイコン」のようなものをオフにしたりする等のケースが想定されます。

#### `meUpdated`
自分の情報が更新されたことを表すイベントです。

#### `follow`
自分が誰かをフォローしたときに発生するイベントです。

#### `unfollow`
自分が誰かのフォローを解除したときに発生するイベントです。

#### `followed`
自分が誰かにフォローされたときに発生するイベントです。

## `homeTimeline`
ホームタイムラインの投稿情報が流れてきます。该频道没有参数。

### 发送的事件列表

#### `note`
タイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `localTimeline`
ローカルタイムラインの投稿情報が流れてきます。该频道没有参数。

### 发送的事件列表

#### `note`
ローカルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `hybridTimeline`
ソーシャルタイムラインの投稿情報が流れてきます。该频道没有参数。

### 发送的事件列表

#### `note`
ソーシャルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `globalTimeline`
グローバルタイムラインの投稿情報が流れてきます。该频道没有参数。

### 发送的事件列表

#### `note`
グローバルタイムラインに新しい投稿が流れてきたときに発生するイベントです。
