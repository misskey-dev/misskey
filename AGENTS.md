# Misskey – AI Agent Guide

このファイルは Misskey リポジトリで動く AI コーディングエージェント (Claude Code / OpenAI Codex / GitHub Copilot 等) が共通で参照する **絶対禁止事項と最低限のチェック** を集めた索引。次の 3 経路から参照・読み込みされる:

- **Claude Code**: ルート `CLAUDE.md` から `@AGENTS.md` で取り込まれる。詳細手順・規約は `.claude/skills/` (description で自動索引)
- **OpenAI Codex**: ルート `AGENTS.md` を直接読み込む (skill エントリは `.agents/skills/`、実体は `.claude/skills/` を指す)
- **GitHub Copilot**: `.github/copilot-instructions.md` (本ファイルの規約を Copilot code review 向けに再掲) 経由で参照する

人間 contributor 向けの一般規約 (Issue / PR の出し方、ActivityPub 拡張など) は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。本ファイルは AI が **コードを書く・直す・出す** 際に踏み外してはいけない事項に絞る。

---

## 絶対にやってはいけない事

違反すると CI 失敗 / 本番事故 / 共有環境破壊 になる。順守すること。

### コード・データ関連

1. **SPDX ヘッダー欠落のまま AGPL 管轄ディレクトリへ新規ファイルを追加しない**
   - 対象: 新規 `.ts` / `.js` / `.cjs` / `.mjs` / `.vue` / `.scss` / `.html` ファイル
   - CI の対象判定は [.github/workflows/check-spdx-license-id.yml](.github/workflows/check-spdx-license-id.yml) の `directories` 配列を参照 (`*.config.{ts,js,cjs,mjs}` と `*eslint*` は除外)
   - 欠落すると CI (`spdx` ジョブ) が失敗する
   - `packages/misskey-js` は MIT ライセンスのサブパッケージなので、この AGPL ヘッダーを一律に付けない (サブパッケージ固有の `package.json` / `LICENSE` / 既存ファイルのヘッダーに従う)

   `.ts` / `.js` / `.cjs` / `.mjs` / `.scss`:

   ```text
   /*
    * SPDX-FileCopyrightText: syuilo and misskey-project
    * SPDX-License-Identifier: AGPL-3.0-only
    */
   ```

   `.vue` / `.html` (HTML コメント形式):

   ```text
   <!--
   SPDX-FileCopyrightText: syuilo and misskey-project
   SPDX-License-Identifier: AGPL-3.0-only
   -->
   ```

2. **`locales/ja-JP.yml` 以外の locale YAML を手動編集しない**
   - 他言語ファイル (`en-US.yml` など `ja-JP.yml` 以外すべて) は Crowdin の自動配信先。手動編集すると次の同期で上書き喪失する
   - 根拠: [locales/README.md](locales/README.md) と [crowdin.yml](crowdin.yml) (`ja-JP.yml` → `locales/%locale%.yml` の同期設定)

3. **マージ済 migration ファイルを編集しない**
   - 対象: `packages/backend/migration/{unixMs}-{name}.js` のうち、既に `develop` / `master` にマージされたもの
   - 本番環境で履歴改変が起きると深刻なデータ不整合を引き起こす
   - スキーマ変更が必要な場合は **新しいタイムスタンプで新規ファイル** を作成する (`node -e "console.log(Date.now())"` でタイムスタンプ取得)
   - 新規 migration は `up()` と `down()` の両方を実装し、`pnpm --filter backend check-migrations` を通すこと (TypeORM schema builder で pending DDL を検出)

### Git / リポジトリ操作

4. **`git push --force` / `--force-with-lease` を `main` / `develop` / `master` にしない** (他人の作業を消す可能性)
5. **`git commit --no-verify` で hook をスキップしない** (lint / format / SPDX チェックを潰す)
6. **マージ済 / プッシュ済コミットを `git commit --amend` で書き換えない** (履歴の整合性が壊れる)
7. **他人のブランチを `git reset --hard` / `git branch -D` で破壊しない**
8. **`git config` をユーザーに無断で書き換えない** (特に `user.name` / `user.email` / `commit.gpgsign`)

### Issue / PR / 外部送信

9. **ユーザーの明示指示なしに PR を merge / close / force-push しない**
10. **ユーザーの明示指示なしに external service (GitHub comments / Slack / メール 等) へ送信しない**
11. **secrets / 認証情報をリポジトリにコミットしない** (`.config/*.yml` の本番値、`.env` ファイル、API token、private key 等)

---

## 変更を出す前の最低チェック

Claude Code は [.claude/skills/shipping-misskey-change/SKILL.md](.claude/skills/shipping-misskey-change/SKILL.md) を invoke することで自動展開される。Skills を読めない Codex / Copilot も以下を手で確認すること:

1. **lint**: `pnpm lint` が通る (typecheck + eslint, 全パッケージ)
2. **backend API 変更時**: `pnpm build-misskey-js-with-types` を実行し `packages/misskey-js/src/autogen/` の差分も commit に含めた
3. **entity / migration 変更時**: `pnpm --filter backend check-migrations` が pending DDL 0 件で通る / 新規 migration は `up()` と `down()` 両方実装済
4. **新規ファイル**: SPDX ヘッダーを付けた (`.vue` / `.html` は HTML コメント形式、それ以外は TS コメント形式)
5. **ユーザー影響のある変更**: `CHANGELOG.md` の `## Unreleased` 配下の該当サブセクション (`### General` / `### Client` / `### Server`) に `- <Feat|Enhance|Fix>: <概要>` を 1 行追記
6. **locale safety**: `locales/` を編集した場合、`git diff --name-only develop -- 'locales/*.yml' | grep -v '^locales/ja-JP\.yml$'` が空 (ja-JP.yml 以外に差分が無い) ことを確認

### Validation commands

各チェックで使う pnpm コマンド一覧。状況に応じて最も近いコマンドから検証する。

| 用途 | コマンド |
| --- | --- |
| 全体 lint (typecheck + eslint) | `pnpm lint` |
| Backend unit test | `pnpm --filter backend test` |
| Backend e2e test | `pnpm --filter backend test:e2e` |
| Backend federation test | `pnpm --filter backend test:fed` |
| Frontend unit test | `pnpm --filter frontend test` |
| Migration 差分検査 (pending DDL) | `pnpm --filter backend check-migrations` |
| `misskey-js` 再生成 (API 変更後必須) | `pnpm build-misskey-js-with-types` |
| 全体ビルド | `pnpm build` |
| 開発サーバー (backend + frontend watch) | `pnpm dev` |

> backend テスト (`test` / `test:e2e` / `test:fed`) 実行前に `.config/test.yml` が必要 (`cp .github/misskey/test.yml .config/test.yml` で作成)。

---

## Claude Code 固有の補助ファイル

`.claude/` 配下は Claude Code 固有の skill / agent を集約している (Codex / Copilot は読み飛ばしてよい)。Skills は description で自動索引されるため、トリガー条件に該当する作業時に Claude が自発的に呼び出す。

- `.claude/skills/working-on-backend/` — `packages/backend/` 編集時に呼ばれる索引スキル
- `.claude/skills/working-on-frontend/` — `packages/frontend/` 編集時に呼ばれる索引スキル
- `.claude/skills/shipping-misskey-change/` — commit / PR 直前の最終チェックリスト
- `.claude/agents/{misskey-api-reviewer,vue-component-reviewer}.md` — 専門レビューエージェント
- `.claude/commands/{harness-audit,quality-gate}.md` — ECC (everything-claude-code) 由来 MIT コマンド
- `.claude/settings.json` — Claude Code の有効プラグイン共有設定 (hook は意図的に登録しない)

### スキル呼び出しの必須タイミング

以下の 3 スキルは **他スキルの実行・事前知識・memory の内容に関わらず免除されない**。該当フェーズに入ったら必ず Skill ツールで呼び出すこと。

| タイミング | 呼び出すスキル |
| --- | --- |
| `packages/backend/` 配下のファイルを編集・追加する実装フェーズに入る前 | `working-on-backend` |
| `packages/frontend/` 配下のファイルを編集・追加する実装フェーズに入る前 | `working-on-frontend` |
| commit / PR 作成 / 作業をユーザーに返す直前 | `shipping-misskey-change` |

サードパーティ由来の出典は [.claude/THIRD_PARTY_LICENSES.md](.claude/THIRD_PARTY_LICENSES.md) を参照。
