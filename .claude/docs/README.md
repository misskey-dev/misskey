# Misskey – Claude Code 補助ドキュメント

ルート `CLAUDE.md` には書かれていないが、開発時に参照すると便利な情報を分野別にまとめている。**Claude は必要になったタイミングで該当ファイルを Read すれば良い** (auto-load しない)。

## 索引

| ファイル | いつ読むか |
|---|---|
| [architecture.md](./architecture.md) | パッケージ構成・ビルド構造を把握したい時 / 新パッケージを跨ぐ変更を計画する時 |
| [backend.md](./backend.md) | `packages/backend` を編集する時 (NestJS / TypeORM / API endpoint / migration) |
| [frontend.md](./frontend.md) | `packages/frontend` を編集する時 (Vue 3 / Mk* / i18n / SCSS Modules / `os.ts`) |
| [testing.md](./testing.md) | テストを書く・走らせる時 (Vitest 構成、Cypress、Storybook) |
| [plugins.md](./plugins.md) | 有効化済の Claude Code プラグインの用途を確認したい時 |

## 補足: ルール vs ドキュメント

- 事故直結ルール (SPDX / locales / migration) と必須コマンド・CHANGELOG 書式は、リポジトリルートの [AGENTS.md](../../AGENTS.md) に集約されている。Claude Code は CLAUDE.md からの `@AGENTS.md` で常時コンテキストに乗せる。Codex / Copilot も同じファイルを読む。
- `.claude/docs/*.md` (このディレクトリ) は **オンデマンド参照**。Claude が「知っておいた方が良いが常に持つ必要はない」内容をここに置く。
