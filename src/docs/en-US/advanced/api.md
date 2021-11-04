# Misskey API

You can use the Misskey API to develop Misskey clients, Misskey-linked web services, bots, etc. (hereinafter referred to as "applications"). Since there is also a streaming API, it is possible to create real-time applications.

To get started with the API, you first need to get an access token. This document describes the steps to get an access token and then the basic API usage.

## Obtain an access token
The API requires an access token for requests. The acquisition procedure differs depending on whether you are requesting the API or the application to be used by an unspecified user.

* For the former: Proceed to
 "Manually issue your own access token" </ 0></li> 
  
  * In the latter case: Proceed to  "Request application user to issue access token" </ 0></li> </ul> 
  
  

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


> 例: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

表示する際、URLにクエリパラメータとしていくつかのオプションを設定できます:

* `name` ... App name 
      * > 例: `MissDeck`
* `icon` ... App icon URL 
      * > 例: `https://missdeck.example.com/icon.png`
* `callback` ... 認証が終わった後にリダイレクトするURL 
      * > 例: `https://missdeck.example.com/callback`
    * リダイレクト時には、`session`というクエリパラメータでセッションIDが付きます
* `permission` ... App permissions 
      * > 例: `write:notes,write:following,read:drive`
    * 要求する権限を`,`で区切って列挙します
    * どのような権限があるかは[APIリファレンス](/api-doc)で確認できます



#### Step 3

ユーザーが発行を許可した後、`{_URL_}/api/miauth/{session}/check`にPOSTリクエストすると、レスポンスとしてアクセストークンを含むJSONが返ります。

レスポンスに含まれるプロパティ:

* `token` ... User access token
* `user` ... User info

[Proceed to "How to use API".](#APIの使い方)



## API usage

**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。There is no REST support.** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [API Reference](/api-doc)
* [Streaming API](./stream)
