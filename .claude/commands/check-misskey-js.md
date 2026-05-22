---
description: backend の API 変更後に misskey-js を再生成し、生成物の差分を報告する
allowed-tools: Bash(pnpm build-misskey-js-with-types:*), Bash(git status:*), Bash(git diff:*), Bash(git branch:*)
---

## 概要

backend の API endpoint やスキーマを変更した後、`packages/misskey-js/src/autogen/` の自動生成型を最新化するためのコマンド。内部で `pnpm build-misskey-js-with-types` (backend build → `api.json` 生成 → misskey-js 型生成 → ビルド → API extractor) を一括実行する。

## 現在の状態 (再生成前)

- 現ブランチ: !`git branch --show-current`
- 既存の misskey-js 関連変更: !`git status --short -- packages/misskey-js/`

## タスク

以下の手順を順番に実行してください。

1. **再生成の実行**
   `Bash` ツールで以下のコマンドを `timeout: 600000` (10 分) を指定して実行する。内部で backend ビルドと型再生成を行うため、デフォルトの 2 分タイムアウトでは不足する。

   ```bash
   pnpm build-misskey-js-with-types
   ```

2. **差分の確認**
   完了後、以下を実行して `packages/misskey-js/src/autogen/` の差分を確認する (`built/` は `.gitignore` 対象なので追跡対象外):

   ```bash
   git status --short -- packages/misskey-js/
   git diff --stat -- packages/misskey-js/src/autogen/
   ```

3. **結果報告**
   - **差分なし** → 「backend の変更は misskey-js の公開型に影響していません」と報告する。追加コミットは不要。
   - **差分あり** → 変更ファイル一覧をユーザーに示し、`git add packages/misskey-js/src/autogen/` で再生成物もコミット対象に含めるよう案内する。`api.json` の差分が大きい場合は、API endpoint 側の `meta` / `paramDef` / `res` 定義を確認するよう促す。

## 注意

- このコマンドは **backend 編集後の確認** が目的。backend を変更していないのに走らせると、ビルドキャッシュ次第で no-op になる。
- 実行中は `packages/backend/built/` や `packages/misskey-js/built/` などの中間生成物が更新されるが、これらは `.gitignore` 対象。
- 生成物以外 (`packages/misskey-js/src/` のうち `autogen/` 以外) に予期せぬ差分が出た場合は、ローカルの編集が混入している可能性があるため、一旦中止して原因を調査する。
