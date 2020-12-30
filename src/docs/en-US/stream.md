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

It's possible to omit the credentials and use the Streaming API without logging in, but doing so will limit the data that can be received and the functions that can be used.E.g.:

```
%WS_URL%/streaming
```

---

To connect to the stream, using the later-mentioned API or subscribing to individual posts is possible. At this stage however it is not possible to receive timeline information about things such as new posts arriving yet. To do this, connecting to later-mentioned **Channels** is required.

**All interactions of sending to and receiving from the Stream are done in JSON format.**

## Channels
Within the Misskey Streaming API, a concept called Channels exists.These are used for the purpose of separating which data to receive. When first connecting to the Misskey Stream, you can not receive real-time updates yet. By connecting to channels in the stream, both sending and receiving various information related to said channels becomes possible.

### Connecting to a channel
To connect to a channel, send a message in JSON format like the following to the stream:

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
* `channel` specifies the name of the channel to connect to.A list of valid channels will be given later.
* `id` contains an arbitrary ID for both sending to and receiving from this channel.The stream sends out various different messages, so to differentiate which channel a message came from, such an ID is required.This ID can be something such as an UUID or a simple random number generator output.
* `params` include the parameters for connecting to the channel.Which parameters are required for connecting varies by channel.For channels which do not require any parameters, this property can be omitted.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> These IDs should be unique for each individual connection to a channel, not for each channel only.This is for cases in which multiple different connections with different parameters are made to the same channel.</p>
</div>

### Receiving messages from channels
For example, when an event is emitted in one of the timeline channels due to a new post being made.By receiving such messages, it's possible to become aware of new posts being made in a timeline in real-time.

When a channel sends a message, a JSON message like the following will be transmitted:
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
* `id` refers to the ID that was previously set when connecting to the channel.Using this, it is possible to figure out which channel a message came from.
* `type` contains the type of this message.Which types of messages are sent varies depending on the channel the message came from.
* `body` contains the actual contents of this message.What kind of data is included varies depending on the channel the message came from.

### Sending messages to channels
Depending on the channel, it is not only possible to receive messages, but also to send messages to the channel which can then trigger various different actions.

To send a message to a channel, send a message in JSON format like the following one to the stream:
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
* `id` refers to the ID that was previously set when connecting to the channel.Using this, it is possible to tell for which channel a message is intended.
* `type` sets the type of this message.The types of messages a channel accepts varies depending on the channel the message is being sent to.
* `body` sets the actual contents of the message.The types of content a channel accepts varies depending on which channel it is being sent to.

### Disconnecting from a channel
To connect to a channel, send a JSON message like the following to the stream:

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Here,
* `id` refers to the ID that was previously set when connecting to the channel.

## Making API requests via streams

It is possible to send requests to the API without a HTTP request by using the Stream.Doing so might help with keeping code cleaner and more efficient.

To send an API request through the stream, send a JSON message like the following to the stream:
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
* `id` must be set to an unique ID with which to identify separate request responses.This can be something such as an UUID or a simple random number generator output.
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

Misskey provides a structure called Post capturing".This structure makes it possible to receive events about a targeted post from the stream.

For example, to fetch and display a timeline to a user.Imagine that someone reacts to a post on this timeline.

Since the client does not have any way of knowing that a certain post has received a reaction, it is not possible to reflect the reaction on this post in real-time.

To solve this problem, Misskey introduced the feature of Post capturing.If you capture a post, events related to said post will be transmitted in real-time, allowing you to reflect the reaction to it on the timeline immediately.

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
This event indicates that all your notifications have been set to read.It is expected to be used in cases such as turning off the indicator that there are unread notifications.

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
