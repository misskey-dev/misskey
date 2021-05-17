# misskey.js
**Strongly-typed official Misskey SDK for browsers/Node.js.**

JavaScript(TypeScript)用の公式MisskeySDKです。ブラウザ/Node.js上で動作します。

以下が提供されています:
- ユーザー認証
- APIリクエスト
- ストリーミング
- ユーティリティ関数
- Misskeyの各種モデル(ノート、ユーザー等)の型定義

## Install
coming soon

# Usage
## Authenticate
todo

## API request
都度インスタンスやトークンを指定する場合
``` ts
import * as Misskey from 'misskey-js';

const meta = await Misskey.api.request('https://misskey.test', 'meta', { detail: true }, 'TOKEN');
```

最初にインスタンスやトークンを指定し、以後のリクエストでその情報を使いまわす場合
``` ts
import * as Misskey from 'misskey-js';

const cli = new Misskey.api.APIClient({
	origin: 'https://misskey.test'
});
cli.i = { token: 'TOKEN' };

const meta = await cli.request('meta', { detail: true });
```

## Streaming
``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useSharedConnection('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### チャンネルへの接続(使いまわす場合)
使いまわし可能なチャンネル(=パラメータを持たないチャンネル)に接続するときは、`useSharedConnection`メソッドを使用します。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const mainChannel = stream.useSharedConnection('main');
```

このメソッドを用いてチャンネルに接続することで、(同じStreamインスタンスを共有している場合)プログラム上の複数個所から呼び出しても内部的にまとめられます。

### チャンネルへの接続(使いまわし不可の場合)
パラメータを持つチャンネルへの接続は`connectToChannel`メソッドを使用します。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const messagingChannel = stream.connectToChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});
```

### チャンネルから切断
`dispose`メソッドを呼び出します。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const mainChannel = stream.useSharedConnection('main');

mainChannel.dispose();
```

### メッセージの受信
チャンネル接続インスタンスはEventEmitterを継承しており、メッセージがサーバーから受信されると受け取ったイベント名でペイロードをemitします。

``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useSharedConnection('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### メッセージの送信
チャンネル接続インスタンスの`send`メソッドを使用してメッセージをサーバーに送信することができます。

``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const messagingChannel = stream.connectToChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});

messagingChannel.send('read', {
	id: 'xxxxxxxxxx'
});
```

### Reference

#### `useSharedConnection(channel: string): SharedConnection`
使いまわし可能なチャンネル(=パラメータを持たないチャンネル)に接続します。
このメソッドを用いて接続したチャンネル接続は内部的に使いまわされるため、プログラム上の複数の場所から呼び出してもコネクションを無駄に増やさずに済みます。

#### `connectToChannel(channel: string, params?: any): NonSharedConnection`
チャンネルに接続します。返り値はそのチャンネルへのコネクションインスタンスです。

---

<div align="center">
	<a href="https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md"><img src="./i-want-you.png" width="300"></a>
</div>
