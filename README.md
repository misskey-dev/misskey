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
``` ts
import * as Misskey from 'misskey-js';

const cli = new Misskey.api.APIClient({
	origin: 'https://misskey.test',
	credential: 'TOKEN',
});

const meta = await cli.request('meta', { detail: true });
```

## Streaming
``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### チャンネルへの接続
チャンネルへの接続は`useChannel`メソッドを使用します。

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
`dispose`メソッドを呼び出します。

``` ts
const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });

const mainChannel = stream.useChannel('main');

mainChannel.dispose();
```

### メッセージの受信
チャンネル接続インスタンスはEventEmitterを継承しており、メッセージがサーバーから受信されると受け取ったイベント名でペイロードをemitします。

``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const mainChannel = stream.useChannel('main');
mainChannel.on('notification', notification => {
	console.log('notification received', notification);
});
```

### メッセージの送信
チャンネル接続インスタンスの`send`メソッドを使用してメッセージをサーバーに送信することができます。

``` ts
import * as Misskey from 'misskey-js';

const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
const messagingChannel = stream.useChannel('messaging', {
	otherparty: 'xxxxxxxxxx',
});

messagingChannel.send('read', {
	id: 'xxxxxxxxxx'
});
```

---

<div align="center">
	<a href="https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md"><img src="./i-want-you.png" width="300"></a>
</div>
