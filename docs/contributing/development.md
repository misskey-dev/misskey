# Development

開発環境を準備・起動する人向け。

[Contribution guide](../../CONTRIBUTING.md)

## Setup
Before developing, you have to set up environment. Misskey requires Redis, PostgreSQL, and FFmpeg.

You would want to install Meilisearch to experiment related features. Technically, meilisearch is not strict requirement, but some features and tests require it.

There are a few ways to proceed.

### Use system-wide software
You could install them in system-wide (such as from package manager).

### Use `docker compose`
You could obtain middleware container by typing `docker compose -f $PROJECT_ROOT/compose.local-db.yml up -d`.

### Use Devcontainer
Devcontainer also has necessary setting. This method can be done by connecting from VSCode.

Instead of running `pnpm` locally, you can use Dev Container to set up your development environment.
To use Dev Container, open the project directory on VSCode with Dev Containers installed.
**Note:** If you are using Windows, please clone the repository with WSL. Using Git for Windows will result in broken files due to the difference in how newlines are handled.

It will run the following command automatically inside the container.
``` bash
git submodule update --init
pnpm install --frozen-lockfile
cp .devcontainer/devcontainer.yml .config/default.yml
pnpm build
pnpm migrate
```

After finishing the migration, you can proceed.

### Cloudflare tunnel
Cloudflare tunnelを使うとローカルのMisskeyサーバーをインターネットに公開できます。
HTTPSでしか動作しない機能を検証したい時や、スマホなど別のデバイスからローカルのMisskeyサーバーを検証したい時に便利です。

#### Cloudflare warpと併用する際のtips

> cloudflared (Cloudflare Tunnel) は region1.v2.argotunnel.com / region2.v2.argotunnel.com に QUIC/HTTP2 でアウトバウンド接続するのですが、WARP を有効化するとこのトラフィックが WARP 経由になってループ/切断します。これら 2 ホストを WARP のトンネル除外（split tunnel）に追加することで、cloudflared だけは WARP をバイパスして直接 Cloudflare エッジへ接続できるようになります。

## Start developing
During development, it is useful to use the
```
pnpm dev
```
command.

- Server-side source files and automatically builds them if they are modified. Automatically start the server process(es).
- Service Worker is watched by esbuild.
- Vite HMR (just the `vite` command) is available. The behavior may be different from production.
- Vite runs behind the backend (the backend will proxy Vite at /vite and /embed_vite except for websocket used for HMR).
- You can see Misskey by accessing `http://localhost:3000` (Replace `3000` with the port configured with `port` in .config/default.yml).

## Environment Variable

- `MISSKEY_CONFIG_YML`: Specify the file path of config.yml instead of default.yml (e.g. `2nd.yml`).
- `MISSKEY_WEBFINGER_USE_HTTP`: If it's set true, WebFinger requests will be http instead of https, useful for testing federation between servers in localhost. NEVER USE IN PRODUCTION.

## How to resolve conflictions occurred at pnpm-lock.yaml?

Just execute `pnpm` to fix it.
