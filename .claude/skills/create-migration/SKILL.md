---
name: create-migration
description: Misskey の TypeORM マイグレーションを公式 CLI (migration:generate / migration:create) で正しく生成し、SPDX ヘッダー付与・up/down 整合・check-migrations 確認まで誘導する。エンティティのスキーマ変更を含むあらゆる DB 変更、または手書き SQL によるデータ移行が必要な時に使用する。
---

# Misskey マイグレーション作成スキル

`packages/backend/migration/` に新規 TypeORM マイグレーションを追加するためのワークフロー。

## 大前提 (絶対 NG)

- **既にマージ済み (develop / master) のマイグレーションファイルを編集しない** ([AGENTS.md §3](../../../AGENTS.md#3-マージ済み-migration-を絶対に編集しない))。本番履歴の改変は深刻なデータ不整合を引き起こす。スキーマ変更は **常に新しいタイムスタンプで新規ファイル** を作る。
- ファイル名のタイムスタンプ部分を後から書き換えない (順序が壊れる)。

> 作り方は AGENTS.md §3 の「`Date.now()` で UNIX ms を取得 → `{ms}-{PascalName}.js` を手書き」が最低ライン。エンティティ差分から自動生成したい (= TypeORM の `migration:generate` を使う) 場合は本 skill の手順に従う。**どちらでも構わない**が、エンティティ変更を伴う時は CLI 経由のほうが取り漏れが減るので推奨。

## ステップ 1: どちらの方式を使うか決める

| 状況 | 方式 |
|---|---|
| エンティティ (`packages/backend/src/models/*.ts`) を `@Column` / `@Index` / `@Entity` 等で先に変更し、差分から自動生成したい | `typeorm migration:generate` (本 skill の手順) |
| 手書き SQL / データ移行 / `CREATE INDEX CONCURRENTLY` など、エンティティ差分では表現できない変更 | `typeorm migration:create` で空雛形を作るか、`migrate-new` command で手書き雛形を作る |
| 列追加 1 本のような小規模変更で、既存ファイルをコピーした方が速い | AGENTS.md §3 の手順 (`Date.now()` + 手書き) でよい |

迷ったら **まずエンティティを変更 → `migration:generate`** が原則。既存 342 ファイルのほぼすべてが `queryRunner.query(\`SQL...\`)` の raw SQL なので、CLI 出力でも手書きでもスタイルは揃う。

## ステップ 2: CLI 実行

ルートディレクトリから以下を実行する。`<PascalName>` は変更内容を表す PascalCase (例: `AddBirthdayIndex`, `AddCategoryToAvatarDecorations`)。

### 2-A. エンティティ差分から生成

[CONTRIBUTING.md §Migration作成方法](../../../CONTRIBUTING.md#migration作成方法) に記載の基本形:

```bash
# packages/backend ディレクトリで実行する場合 (CONTRIBUTING.md 記載形式)
pnpm dlx typeorm migration:generate -d ormconfig.js -o --esm <PascalName>
```

**リポジトリルートから実行する場合** (AI が使う推奨形式。`pnpm --filter backend exec` を使うと backend の TypeORM バージョンと一致するため確実):

```bash
pnpm --filter backend exec typeorm migration:generate -d ormconfig.js -o --esm migration/<PascalName>
```

> **`--esm` について**: `-o` / `--outputJs` は「TS ではなく JS を出力する」オプション、`--esm` は「ESM 形式 (`export class ...`) で出力する」オプション。Misskey の既存 migration はすべて ESM JS であるため **両方が必須**。`--esm` を省略すると CommonJS 形式の JS が生成されスタイルが揃わない。

事前準備:

- `pnpm build-pre` を実行して `built/meta.json` を生成する (`loadConfig()` が `built/meta.json` を必須とするため。`pnpm build` 済みであれば不要)。
- `.config/default.yml` が存在すること (なければ `.config/example.yml` を参考に作成する)。
- `pnpm --filter backend compile-config` を実行して `built/.config.json` を生成する (`ormconfig.js` が `loadConfig()` 経由で必須とする。未実行だと "Compiled configuration file not found." エラーになる)。
- `pnpm --filter backend build` でエンティティを最新ビルド (CLI は `built/` を読む)。
- ローカル DB を起動する (`docker compose -f compose.local-db.yml up -d`)。

### 2-B. 空の手書きマイグレーション

```bash
pnpm --filter backend exec typeorm migration:create -o --esm migration/<PascalName>
```

ローカル DB の起動とビルドは不要。空の `up` / `down` だけが生成される。

> `-o --esm` を **必ず付ける**。これが無いと `<UnixMs>-<PascalName>.ts` (CommonJS / TS 出力) が生成されるが、Misskey の `ormconfig.js` は `migration/*.js` だけを読み、既存の他 migration も全て `export class ... { async up(queryRunner) {...} }` の ESM JS 形式なので、後で手作業で `.ts → .js` リネーム + `import { MigrationInterface }` 削除 + `class ... implements MigrationInterface` 削除をしないと走らない。`-o --esm` を付ければそのまま `.js` ESM で出るので、後処理は SPDX ヘッダー付与 (ステップ 3) だけで済む。

## ステップ 3: SPDX ヘッダー付与

CLI 出力には SPDX ヘッダーが含まれない。**必ず冒頭に追加する** (CI の `spdx` ジョブが失敗するため)。

```js
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

## ステップ 4: up / down の整合確認

- `up()` の各ステートメントに対し、`down()` で完全に巻き戻せること。
- 列追加 (`ADD COLUMN`) ↔ 列削除 (`DROP COLUMN`)、テーブル作成 ↔ テーブル削除、
  FK 追加 ↔ FK 削除、インデックス作成 ↔ インデックス削除 を必ずペアで書く。
- `down()` を空のまま残さない。本番ロールバック時に詰む。

### インデックス追加時の注意 (CREATE INDEX CONCURRENTLY)

大規模テーブルへの `CREATE INDEX` は本番で長時間ロックする恐れがある。`CONCURRENTLY` で発行するときは **migration 側にも対応が必要**: PostgreSQL は `CREATE INDEX CONCURRENTLY` を transaction 内で実行できないため、migration class に以下を仕込んで TypeORM に「この migration は transaction を張らない」と指示する。

参照実装: [packages/backend/migration/1745378064470-composite-note-index.js](../../../packages/backend/migration/1745378064470-composite-note-index.js)。

```js
const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class CompositeNoteIndex1745378064470 {
    name = 'CompositeNoteIndex1745378064470';
    transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

    async up(queryRunner) {
        const concurrently = isConcurrentIndexMigrationEnabled;
        if (concurrently) {
            // CREATE INDEX CONCURRENTLY ...
        } else {
            // CREATE INDEX ...
        }
    }

    async down(queryRunner) {
        // 同様に環境変数で分岐
    }
}
```

要点:

- **`transaction = isConcurrentIndexMigrationEnabled ? false : undefined;`** が必須。これがないと `CREATE INDEX CONCURRENTLY` が transaction 内で実行されて `ERROR:  CREATE INDEX CONCURRENTLY cannot run inside a transaction block` で失敗する。
- 環境変数 `MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` がデフォルト OFF。OFF のときは普通の `CREATE INDEX` (transaction 内) で動く必要がある。`up`/`down` 双方を環境変数で分岐させる。
- `ormconfig.js` の `migrationsTransactionMode` は **環境変数で切り替わる**: `MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` のときだけ `'each'` (各 migration が個別 transaction)、未設定時は `'all'` (全 migration を 1 つの transaction でラップ) ([ormconfig.js:19](../../../packages/backend/ormconfig.js#L19))。普段は `'all'` 前提なので、CONCURRENTLY を使う migration を書く時だけこのフラグの存在を意識すれば良い。

### 関連エンティティとの一致

`migration:generate` を使った場合、エンティティ側の `@Column` / `@Entity` 修正と DB スキーマが食い違うとビルド全体がズレる。生成後に該当エンティティと SQL の対応を目視確認すること。

## ステップ 5: 検証

ルートから実行:

```bash
# 未反映の差分が無いか (新規 migration が生成すべき DDL を取り逃していないか)
pnpm --filter backend check-migrations

# ローカル DB に適用
pnpm migrate

# ロールバック (down が壊れていないか)
pnpm revert

# 再適用 (順方向にもう一度通す)
pnpm migrate
```

`check-migrations` の実体は [scripts/check_migrations_clean.js](../../../packages/backend/scripts/check_migrations_clean.js)。TypeORM の `dataSource.driver.createSchemaBuilder().log()` で pending DDL を取得し、`upQueries` / `downQueries` のいずれかが残っていれば非ゼロ終了する。**順序検査ではなく**「エンティティと migration が同期しているか」の検査。

## ステップ 6: 既存ファイル参照テンプレ

新規ファイルを書くときは、変更パターンが近い既存ファイルを **必ずひとつ開いて並べて書く**。スタイルが激しくズレた PR は差し戻されやすい。

| パターン | 参照ファイル |
|---|---|
| インデックス追加 + 関数定義 | [packages/backend/migration/1767169026317-birthday-index.js](../../../packages/backend/migration/1767169026317-birthday-index.js) |
| 列追加のみ | [packages/backend/migration/1766652173085-add-category-to-avatar-decorations.js](../../../packages/backend/migration/1766652173085-add-category-to-avatar-decorations.js) |
| テーブル新規作成 + FK | [packages/backend/migration/1761569941833-add-channel-muting.js](../../../packages/backend/migration/1761569941833-add-channel-muting.js) |

クラス命名規則は **PascalCase 名 + 13 桁タイムスタンプ** (例: `class BirthdayIndex1767169026317`)。`name` プロパティもクラス名と同一文字列にする。

## ステップ 7: CHANGELOG (ユーザー影響がある場合)

スキーマ変更がユーザーに見える挙動を生む場合のみ、`CHANGELOG.md` の `## Unreleased` → `### Server` または `### General` に 1 行追加する ([AGENTS.md §CHANGELOG](../../../AGENTS.md#changelog) 参照)。内部リファクタや純粋なインデックス追加は不要。
