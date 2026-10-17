# @misskey-dev/media-proxy-core

Misskey のメディアプロキシのコア実装です。本体バックエンドとスタンドアロン版の両方で使用します。

## Peer dependencies

`sharp`、`@misskey-dev/sharp-read-bmp`、`fastify` はピア依存関係です。利用側でインストールしてください。

```bash
npm install @misskey-dev/media-proxy-core sharp @misskey-dev/sharp-read-bmp fastify
```

## 提供するもの

### `@misskey-dev/media-proxy-core`

本体メディアプロキシとスタンドアロン版の両方で使用するものです。

- `getProxyTargetUrl` / `validateProxyUserAgent`: リクエストの解釈と検証
- `convertProxyImage`: `emoji` / `avatar` / `static` / `preview` / `badge` クエリに応じた画像変換
- `createProxyResponseHeaders`: 正常レスポンスのヘッダー
- `StatusError`

### `@misskey-dev/media-proxy-core/standalone`

スタンドアロン版でのみ使用するものです。

- `mediaProxyPlugin`: スタンドアロンのメディアプロキシとして動作する Fastify プラグイン
- `createHttpAgents`: HTTP プロキシ経由などのエージェントを作成する

## 接続先の検証について

`mediaProxyPlugin` に `getAgents` を渡した場合、接続先 IP アドレスの検証は渡したエージェント側の責務となります。
省略した場合は既定のエージェントを使用し、レスポンス受信時に接続先が `allowedPrivateNetworks` に含まれないプライベートアドレスであればダウンロードを中断します (リクエスト送信後の判定であることに注意してください)。

## License

AGPL-3.0-only
