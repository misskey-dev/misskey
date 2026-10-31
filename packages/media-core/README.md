# @misskey-dev/media-core

Misskey のメディア処理のライブラリです。Misskey 本体のバックエンドと、スタンドアロン版メディアプロキシ ([misskey-dev/media-proxy](https://github.com/misskey-dev/media-proxy)) の両方で使用します。

このパッケージは Misskey 本体と同じバージョン番号でリリースされます。

メディアプロキシの仕様は [SPECIFICATION.md](./SPECIFICATION.md) を参照してください。

## Peer dependencies

`sharp`、`@misskey-dev/sharp-read-bmp` はピア依存関係です。利用側でインストールしてください。
`@misskey-dev/media-core/standalone` を使用する場合は `fastify` も、`@misskey-dev/media-core/video` を使用する場合は `fluent-ffmpeg` (と ffmpeg / ffprobe) も必要です。

```bash
npm install @misskey-dev/media-core sharp @misskey-dev/sharp-read-bmp
# スタンドアロン版メディアプロキシとして使う場合
npm install fastify
# 動画の処理を使う場合
npm install fluent-ffmpeg
```

## 提供するもの

### `@misskey-dev/media-core`

本体バックエンドとスタンドアロン版メディアプロキシの両方で使用するものです。

- ファイル: `detectType` (MIME タイプの判定)、`calcHash`、`detectImageSize`、`getFileSize` など
- 画像: `convertToWebp` / `convertToAvif` / `convertToPng` などの変換、`getBlurhash`
- ダウンロード: `downloadUrl` (サイズ制限・タイムアウト付き)
- メディアプロキシ: `getProxyTargetUrl` / `validateProxyUserAgent` / `convertProxyImage` / `createProxyResponseHeaders`
- 共通: `StatusError`、`FILE_TYPE_BROWSERSAFE`、`isMimeImage`、`correctFilename`、`contentDisposition` など

### `@misskey-dev/media-core/video`

動画の処理です。fluent-ffmpeg を必要としない利用側で読み込まれないよう、サブパスに分けています。

- `generateVideoThumbnail`: 動画のサムネイルを WebP で生成する
- `hasVideoTrack`: 映像トラックがあるかどうかを判定する (`detectType` の `hasVideoTrack` に渡す)

### `@misskey-dev/media-core/standalone`

スタンドアロン版メディアプロキシでのみ使用するものです。読み込むモジュール (と依存パッケージ) を限定するため、サブパスに分けています。

- `mediaProxyPlugin`: スタンドアロンのメディアプロキシとして動作する Fastify プラグイン
- `createHttpAgents`: ダウンロードに使用するエージェントを作成する

```js
import Fastify from 'fastify';
import { mediaProxyPlugin } from '@misskey-dev/media-core/standalone';

const fastify = Fastify();
fastify.register(mediaProxyPlugin, {
	userAgent: 'MisskeyMediaProxy',
	allowedPrivateNetworks: [],
	maxSize: 262144000,
	// proxy: 'http://127.0.0.1:3128',
});
```

## 接続先の検証について

`mediaProxyPlugin` に `getAgents` または `proxy` を指定した場合、接続先 IP アドレスの検証はエージェント (プロキシ) 側の責務となります。
どちらも省略した場合は既定のエージェントを使用し、レスポンス受信時に接続先が `allowedPrivateNetworks` に含まれないプライベートアドレスであればダウンロードを中断します (リクエスト送信後の判定であることに注意してください)。

## ディレクトリ構成

`src/` 以下のディレクトリ間の依存の向きは ESLint (`import/no-restricted-paths`) で固定しています。

| ディレクトリ | 内容 | 依存してよいもの |
| --- | --- | --- |
| `common/` | エラー型、MIME タイプ、ファイル名、一時ファイルなどの共通処理 | なし |
| `file/` | ファイルの形式判定、ハッシュ、画像サイズ | `common/` |
| `image/` | 画像の変換、blurhash | `common/` |
| `download/` | ファイルのダウンロード | `common/` |
| `proxy/` | メディアプロキシの仕様に基づく処理 | `common/` / `file/` / `image/` / `download/` |
| `video/` | 動画の処理 (`./video` から公開) | `common/` / `image/` |
| `standalone/` | スタンドアロン版メディアプロキシ (`./standalone` から公開) | `video/` 以外すべて |

## License

AGPL-3.0-only
