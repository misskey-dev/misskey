# Misskey API

You can use the Misskey API to develop Misskey clients, Misskey-linked web services, bots, etc. (hereinafter referred to as "applications"). Since there is also a streaming API, it is possible to create real-time applications.

To get started with the API, you first need to get an access token. This document describes the steps to get an access token and then the basic API usage.

## Obtain an access token
The API requires an access token for requests. The acquisition procedure differs depending on whether you are requesting the API or the application to be used by an unspecified user.

* For the former: Proceed to ["Manually issue your own access token"](#自分自身のアクセストークンを手動発行する)
* In the latter case: Proceed to ["Request application user to issue access token"](#アプリケーション利用者にアクセストークンの発行をリクエストする)

### Manually issue your own access token
You can issue your own access token in "Settings & API".

[Proceed to "How to use API".](#APIの使い方)

### Request the application user to issue an access token.
To obtain the access token of the application user, request issuance by following the steps below.

#### Step 1

Generate UUID.This is called the session ID.

> Generate this session ID every time and do not reuse it.

#### Step 2

`{_URL_}/miauth/{session}` Is displayed in the user's browser. `{session}` Replace with the session ID.
> Example: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

When displaying, you can set some options in the URL as query parameters:
* `name` ... App name
    * > Example: `MissDeck`
* `icon` ... App icon URL
    * > Example: `https://missdeck.example.com/icon.png`
* `callback` ... URL to redirect after authentication
    * > Example: `https://missdeck.example.com/callback`
    * At the time of redirect, the session ID is attached with the query parameter `session`.
* `permission` ... Privileges required by the application
    * > Example: `write:notes,write:following,read:drive`
    * List the required permissions separated by `,`
    * You can check what kind of permissions you have in [API Reference](/api-doc)

#### Step 3
After allowing the user to publish, a POST request to `{_URL_}/api/miauth/{session}/check` will return a JSON containing the access token as a response.

Properties included in the response:
* `token` ... User's access token
* `user` ... User info

[Proceed to "How to use API".](#APIの使い方)

## API usage
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。There is no REST support.** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [API Reference](/api-doc)
* [Streaming API](./stream)
