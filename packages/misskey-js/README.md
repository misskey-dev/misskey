# misskey.js
**Strongly-typed official Misskey SDK for browsers/Node.js.**

[![Test](https://github.com/misskey-dev/misskey.js/actions/workflows/test.yml/badge.svg)](https://github.com/misskey-dev/misskey.js/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/misskey-dev/misskey.js/branch/develop/graph/badge.svg?token=PbrTtk3nVD)](https://codecov.io/gh/misskey-dev/misskey.js)

[![NPM](https://nodei.co/npm/misskey-js.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/misskey-js)

JavaScript(TypeScript)用の公式MisskeySDKです。ブラウザ/Node.js上で動作します。

以下が提供されています:
- ユーザー認証
- APIリクエスト
- ストリーミング
- ユーティリティ関数
- Misskeyの各種型定義

対応するMisskeyのバージョンは12以上です。

## Install
```
npm i misskey-js
```

# Usage
インポートは以下のようにまとめて行うと便利です。

``` ts
import * as Misskey from 'misskey-js';
```

便宜上、以後のコード例は上記のように`* as Misskey`としてインポートしている前提のものになります。

ただし、このインポート方法だとTree-Shakingできなくなるので、コードサイズが重要なユースケースでは以下のような個別インポートをお勧めします。

``` ts
import { api as misskeyApi } from 'misskey-js';
```

## Authenticate (MiAuth)
MiAuthでの認証に対応しています。

### Step 1: 認証URLを生成
`APIClient`クラスの`getMiAuthURL`メソッドを使用して認証URLを生成します（これは同期関数です）。生成したURLにユーザーを誘導し、認可させてください。

``` ts
const cli = new Misskey.api.APIClient({
	origin: 'https://misskey.test',
});

const { url } = cli.getMiAuthURL({
	name: 'My app',
	callback: 'https://example.com/callback',
	permission: ['read:account'],
});

// URLに飛ばす（例）
location.href = url;
```

### Step 2: セッションIDからアクセストークンを取得
`APIClient`クラスの`authWithMiAuth`メソッドを使用してセッションIDからアクセストークンを取得します。アクセストークンは返却されるほか、以降同一のインスタンスを利用したリクエストに自動で設定されます（この挙動は第２引数に`false`を与えることで回避できます）。

コールバックURLを指定した場合、セッションIDはURLパラメータの`session`から取得できます。

``` ts
const sessionId = new URL(location.href).searchParams.get('session');

const cli = new Misskey.api.APIClient({
	origin: 'https://misskey.test',
});

const { token } = await cli.authWithMiAuth(sessionId);

// 以後、同じAPIClientを使い続ける場合はトークンが自動で設定されます
const i = await cli.request('i');
```

## API request
APIを利用する際は、利用するサーバーの情報とアクセストークンを与えて`APIClient`クラスのインスタンスを初期化し、そのインスタンスの`request`メソッドを呼び出してリクエストを行います。

``` ts
const cli = new Misskey.api.APIClient({
	origin: 'https://misskey.test',
	credential: 'TOKEN',
});

const meta = await cli.request('meta', { detail: true });
```

`request`の第一引数には呼び出すエンドポイント名、第二引数にはパラメータオブジェクトを渡します。レスポンスはPromiseとして返ります。

## Streaming
misskey.jsのストリーミングでは、二つのクラスが提供されます。
ひとつは、ストリーミングのコネクション自体を司る`Stream`クラスと、もうひとつはストリーミング上のチャンネルの概念を表す`Channel`クラスです。
ストリーミングを利用する際は、まず`Stream`クラスのインスタンスを初期化し、その後で`Stream`インスタンスのメソッドを利用して`Channel`クラスのインスタンスを取得する形になります。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

コネクションが途切れても自動で再接続されます。

### チャンネルへの接続
チャンネルへの接続は`Stream`クラスの`useChannel`メソッドを使用します。

パラメータなし
``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const mainChannel = stream.useChannel('main');
```

パラメータあり
``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const messagingChannel = stream.useChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});
```

### チャンネルから切断
`Channel`クラスの`dispose`メソッドを呼び出します。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const mainChannel = stream.useChannel('main');

mainChannel.dispose();
```

### メッセージの受信
`Channel`クラスはEventEmitterを継承しており、メッセージがサーバーから受信されると受け取ったイベント名でペイロードをemitします。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### メッセージの送信
`Channel`クラスの`send`メソッドを使用してメッセージをサーバーに送信することができます。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const messagingChannel = stream.useChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});

messagingChannel.send('read', {
	id: 'xxxxxxxxxx'
});
```

### コネクション確立イベント
`Stream`クラスの`_connected_`イベントが利用可能です。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
stream.on('_connected_', () => {
	console.log('connected');
});
```

### コネクション切断イベント
`Stream`クラスの`_disconnected_`イベントが利用可能です。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
stream.on('_disconnected_', () => {
	console.log('disconnected');
});
```

### コネクションの状態
`Stream`クラスの`state`プロパティで確認できます。

- `initializing`: 接続確立前
- `connected`: 接続完了
- `reconnecting`: 再接続中

---

<div align="center">
	<a href="https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md"><img src="https://assets.misskey-hub.net/public/i-want-you.png" width="300"></a>
</div>
