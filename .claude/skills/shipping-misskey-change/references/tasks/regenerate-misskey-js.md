# misskey-js の自動生成型を再生成する

backend の API endpoint やスキーマ (`meta` / `paramDef` / `res`) を変更した後、`packages/misskey-js/src/autogen/` の自動生成型を最新化するための手順。

**忘れると CI の `check-misskey-js-autogen` で必ず落ちる**。最頻ミスのひとつ。

## いつ実行するか

以下のいずれかに該当する変更を加えたとき:

- 新規エンドポイント追加 (`packages/backend/src/server/api/endpoints/<category>/<name>.ts`)
- 既存エンドポイントの `meta` (errors / res / kind / requireCredential 等) を変更
- 既存エンドポイントの `paramDef` (入力 schema) を変更
- packed entity (`packages/backend/src/models/json-schema/*.ts`) を変更

実質「`packages/backend/src/server/api/` 配下を触ったら必ず」と考えてよい。

## 実行コマンド

```bash
pnpm build-misskey-js-with-types
```

内部で以下が一括実行される:

1. backend ビルド (`pnpm --filter backend build`)
2. OpenAPI spec 生成 (`packages/backend/built/api.json`)
3. misskey-js 用 schema 生成 (`packages/misskey-js/generator/api.json`)
4. misskey-js の TypeScript 型再生成 (`packages/misskey-js/src/autogen/{types,entities,endpoint,models,apiClientJSDoc}.ts`)
5. misskey-js ビルド + API extractor

実行時間は 1-3 分程度。タイムアウト警告が出る場合は `--timeout=600000` 相当の長めの設定を使う。

## 実行後の確認

```bash
# 何が変わったかを軽く確認
git status --short -- packages/misskey-js/
git diff --stat -- packages/misskey-js/src/autogen/

# 内容を見たい場合
git diff -- packages/misskey-js/src/autogen/
```

## 差分のパターン

- **差分なし** → backend の変更は misskey-js の公開型に影響していない (内部リファクタなど)。追加コミット不要
- **差分あり** → `packages/misskey-js/src/autogen/` 配下のファイルを **必ず commit に含める**

  ```bash
  git add packages/misskey-js/src/autogen/
  ```

  `api.json` の差分が大きい場合は、API endpoint 側の `meta` / `paramDef` / `res` 定義が想定通りか確認する。

## 注意

- このコマンドは **backend 編集後の確認** が目的。backend を変更していないのに走らせるとビルドキャッシュ次第で no-op になる
- 実行中は `packages/backend/built/` や `packages/misskey-js/built/` などの中間生成物が更新されるが、これらは `.gitignore` 対象
- 生成物以外 (`packages/misskey-js/src/` のうち `autogen/` 以外) に予期せぬ差分が出た場合は、ローカルの編集が混入している可能性があるため、一旦中止して原因を調査する
- `packages/misskey-js/` 配下は **MIT ライセンスのサブパッケージ** なので、`autogen/` ファイルには AGPL の SPDX ヘッダーを付けない / 不要

## CI で落ちた場合のメッセージ例

```
CI: check-misskey-js-autogen
> Please regenerate misskey-js by running:
>   pnpm build-misskey-js-with-types
> and commit the changes under packages/misskey-js/src/autogen/.
```

ローカルでもう一度上記コマンドを実行 → 差分を commit → push し直す。

## 関連

- API endpoint 追加の全手順 → [working-on-backend/references/tasks/adding-api-endpoint.md](../../../working-on-backend/references/tasks/adding-api-endpoint.md)
- `meta` / `paramDef` / `res` の規約 → [working-on-backend/references/knowledge/api-meta-paramdef.md](../../../working-on-backend/references/knowledge/api-meta-paramdef.md)
