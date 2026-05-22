---
description: TypeORM migration の空雛形を生成する。スキーマ差分から自動生成したい時は create-migration skill を使うこと
argument-hint: <PascalCaseName>
allowed-tools: Bash(pnpm:*), Bash(ls:*), Bash(test:*), Bash(head:*), Read, Edit
---

## 引数

引数: `$ARGUMENTS`

## タスク

1. **PascalCaseName の検証**
   `$ARGUMENTS` が `^[A-Z][A-Za-z0-9]+$` に一致するか確認する。一致しない場合はエラー終了し、`AddFooBar` / `BirthdayIndex` のような形式を案内する。

2. **既存ファイルの存在確認**

   ```bash
   ls packages/backend/migration/*$ARGUMENTS.{js,ts} 2>/dev/null
   ```

   既に同名 (タイムスタンプ違い) のファイルが存在する場合、上書きせずユーザーに別名を促す。

3. **TypeORM 公式 CLI で空雛形を生成 (`-o --esm` 必須)**
   `create-migration` skill の方針に従い、`Date.now()` を手書きするのではなく TypeORM CLI を使う。`-o --esm` で **最初から JS(ESM) を生成** させ、後続の `.ts → .js` 変換や `import { MigrationInterface }` 削除といった TS 固有構文の除去を不要にする (`-o --esm` を付けないと `.ts` + CommonJS / `implements MigrationInterface` 付きで生成され、Misskey の `ormconfig.js` (`migration/*.js` のみロード) と既存 migration スタイルに合わない):

   ```bash
   pnpm --filter backend exec typeorm migration:create -o --esm migration/$ARGUMENTS
   ```

   出力: `packages/backend/migration/<UnixMs>-<PascalCaseName>.js`

4. **生成ファイルパスの取得**
   後続ステップで使うパスを変数に受ける (`<ms>` を手書きしない):

   ```bash
   dst=$(ls -t packages/backend/migration/*$ARGUMENTS.js | head -1)
   ```

   以降のステップでは `$dst` を編集対象として扱う。完成後の典型的な形は次のようになる (参考: [packages/backend/migration/1767169026317-birthday-index.js](../../packages/backend/migration/1767169026317-birthday-index.js)):

   ```js
   export class <PascalCaseName><ms> {
       name = '<PascalCaseName><ms>'

       async up(queryRunner) {
       }

       async down(queryRunner) {
       }
   }
   ```

5. **SPDX ヘッダーの追加**
   `Edit` ツールで、ファイル冒頭に以下を挿入する。CI の `spdx` ジョブが失敗するため必須:

   ```js
   /*
    * SPDX-FileCopyrightText: syuilo and misskey-project
    * SPDX-License-Identifier: AGPL-3.0-only
    */
   ```

6. **migration の pending DDL 検査**

   ```bash
   pnpm --filter backend check-migrations
   ```

   TypeORM schema builder で pending DDL を検出する検査 ([scripts/check_migrations_clean.js](../../packages/backend/scripts/check_migrations_clean.js))。空雛形を作っただけの段階ではエンティティ差分との不整合が残る場合があるため、`up`/`down` を埋めた後にも再実行して 0 件になるか確認する。

7. **結果報告**
   - 生成ファイルパスを示す。
   - `up()` / `down()` の中身が空であることを伝え、SQL を書く必要があると案内する。
   - `down()` を空のまま放置すると本番ロールバック時に詰むため、必ず `up` の完全な巻き戻しを実装するよう促す。
   - 詳細な手順 (`migration:generate` を使うべきケース、CONCURRENTLY などの注意点) は `create-migration` skill を参照するよう案内する。

## 注意

- このコマンドは **空雛形を素早く出して手書きする** 用途。エンティティ (`packages/backend/src/models/*.ts`) を変更した差分から SQL を自動生成したい場合は、このコマンドではなく `create-migration` skill 経由で `migration:generate` を使うこと。
- マージ済み migration ファイルは絶対に編集しない ([AGENTS.md §3](../../AGENTS.md#3-マージ済み-migration-を絶対に編集しない))。
