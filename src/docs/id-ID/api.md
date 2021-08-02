# Misskey API

Dengan menggunakan Misskey API kamu dapat mengembangkan klien Misskey, Webservice yang terintegrasi dengan Misskey, Bots (nantinya akan disebut "Aplikasi" disini), dll. Terdapat juga streaming API, yang memungkinan untuk membuat aplikasi real-time.

Untuk memulai menggunakin API, kamu harus memiliki access token terlebih dahulu. Halaman ini akan menjelaskan bagaimana untuk mendapatkan access token dan menjelaskan instruksi penggunaan dasar dari Misskey API.

## Mendapatkan access token
Pada dasarnya, semua request API membutuhkan access token. Metode untuk mendapatkan sebuah access token bermacam-macam bergantung pada kamu sendiri yang mengirim request API atau request tersebut dikirim melalui aplikasi yang dipakai oleh pengguna akhir.

* Apabila kamu pengguna lama: Langsung saja menuju [ "Menerbitkan access token untuk akun kamu sendiri secara manual" ](#自分自身のアクセストークンを手動発行する)
* Apabila kamu pengguna baru: Langsung saja menuju [ "Meminta aplikasi pengguna untuk menghasilkan access token" ](#アプリケーション利用者にアクセストークンの発行をリクエストする)

### Menerbitkan access token untuk akun kamu sendiri secara manual
Kamu dapat membuat access token untuk akun milikmu di Pengaturan > API.

[Lanjutkan untuk menggunakan API.](#APIの使い方)

### アプリケーション利用者にアクセストークンの発行をリクエストする
アプリケーション利用者のアクセストークンを取得するには、以下の手順で発行をリクエストします。

#### Step 1

UUIDを生成する。以後これをセッションIDと呼びます。

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

[Lanjutkan untuk menggunakan API.](#APIの使い方)

## Menggunakan API
**APIはすべてPOSTで、リクエスト/レスポンスともにJSON形式です。RESTではありません。** アクセストークンは、`i`というパラメータ名でリクエストに含めます。

* [APIリファレンス](/api-doc)
* [ストリーミングAPI](./stream)
