# TypeORM / migration パターン

Misskey backend は TypeORM 1 + PostgreSQL。エンティティ定義と migration の関係、そして migration で踏みうる難ケースをまとめる。

## モデル / Repository

- エンティティ: `packages/backend/src/models/<Name>.ts` (`@Entity` + `@Column`)
- DI 経由で注入される Repository を経由してアクセス (`@Inject(DI.notesRepository)` 等) → [nestjs-di.md](nestjs-di.md)

エンティティ側の `@Column` / `@Entity` / `@Index` 変更は migration の DDL と整合させる必要がある。`pnpm --filter backend check-migrations` がエンティティと migration の不一致を検出する ([scripts/check_migrations_clean.js](../../../../../packages/backend/scripts/check_migrations_clean.js))。

## migration ファイルの構造

各ファイル `packages/backend/migration/{unixMs}-{descriptive-name}.js` は ESM JS。最小形:

```js
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PascalCaseName1234567890123 {
    name = 'PascalCaseName1234567890123'

    async up(queryRunner) {
        await queryRunner.query(`...`);
    }

    async down(queryRunner) {
        await queryRunner.query(`...`);  // up の完全な巻き戻し
    }
}
```

詳細手順は [tasks/creating-migration.md](../tasks/creating-migration.md) を参照。**マージ済 migration の編集は絶対禁止**。

## CONCURRENTLY (CREATE INDEX CONCURRENTLY) の扱い

大規模テーブルへの `CREATE INDEX` は本番で長時間ロックする恐れがある。`CONCURRENTLY` で発行するときは migration class に **「この migration は transaction を張らない」と指示する** 必要がある。PostgreSQL は `CREATE INDEX CONCURRENTLY` を transaction 内で実行できないため。

参照実装: [migration/1745378064470-composite-note-index.js](../../../../../packages/backend/migration/1745378064470-composite-note-index.js)

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

- **`transaction = isConcurrentIndexMigrationEnabled ? false : undefined;`** が必須。これがないと `CREATE INDEX CONCURRENTLY` が transaction 内で実行されて `ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block` で失敗
- 環境変数 `MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` がデフォルト OFF。OFF のときは普通の `CREATE INDEX` (transaction 内) で動く必要がある。`up`/`down` 双方を環境変数で分岐させる
- `ormconfig.js` の `migrationsTransactionMode` は **環境変数で切り替わる**: `MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY=1` のときだけ `'each'`、未設定時は `'all'` (全 migration を 1 つの transaction でラップ) ([ormconfig.js](../../../../../packages/backend/ormconfig.js) の `migrationsTransactionMode`)。普段は `'all'` 前提

## migration 難ケース集

`migration:generate` / 手書きどちらでも踏み外しやすいパターンを「**なぜ危険か → up の形 → down 戦略 → 参照実装**」でまとめる。

共通の鉄則: `down()` は `up()` の **完全な巻き戻し**。下記ケースは「単純な逆 SQL では戻らない」ものが多い。

### 1. NOT NULL 列の追加

**なぜ危険か**: 既存行があるテーブルに `NOT NULL` 列を `DEFAULT` 無しで足すと、既存行を埋められず `ALTER TABLE` が失敗する。

- **既定値で良い場合** — `DEFAULT` を付ければ 1 文で済む。これが最も多い

  ```js
  // up
  await queryRunner.query(`ALTER TABLE "note_draft" ADD "isActuallyScheduled" boolean NOT NULL DEFAULT false`);
  // down
  await queryRunner.query(`ALTER TABLE "note_draft" DROP COLUMN "isActuallyScheduled"`);
  ```

  参照: [migration/1758677617888-scheduled-post.js](../../../../../packages/backend/migration/1758677617888-scheduled-post.js)

- **行ごとに計算した値で埋めたい / 既定値を後で外したい場合** — 3 段に分ける: ①nullable で追加 → ②`UPDATE` でバックフィル (ケース 3 参照) → ③`ALTER COLUMN ... SET NOT NULL`。`down` は `DROP COLUMN` で良い。巨大テーブルでは ② の `UPDATE` と ③ の `SET NOT NULL` (全行スキャン) が長時間ロックし得る点に注意

> エンティティ側で `@Column({ default: ... })` を付けると `migration:generate` が `DEFAULT` 付き DDL を出す。アプリ実行時に常に値を入れるので DB 既定値が不要なら、生成後に `DEFAULT` 句だけ手で外す判断もある (既存 migration には両スタイルある)。

### 2. enum 型の値の追加・変更

**なぜ危険か**: PostgreSQL の enum は **値を削除できない** (`ALTER TYPE ... DROP VALUE` は存在しない) ため、`ADD VALUE` した変更を素直に巻き戻せない。さらに Misskey はデフォルトで migration 全体を 1 トランザクションにまとめる (`migrationsTransactionMode: 'all'`) ので、`ADD VALUE` で足した値を同一トランザクション内で使う処理もエラーになる。そこで TypeORM `migration:generate` は **「旧型を rename → 新型を CREATE → 列を新型へ ALTER (USING キャスト) → 旧型を DROP」** という巻き戻し可能な手順を出す。手書きでもこの形に従うこと。

```js
// up: 値 'app' を追加する例 (新値を含む型へ載せ替える)
await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('follow', 'mention', /* ... */ 'app')`);
await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
```

```js
// down: 新値を含まない旧い値集合へ同じ手順で戻す
await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('follow', 'mention', /* ... 'app' を除く ... */)`);
await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
```

要点: ①列がデフォルトを持つ場合は ALTER 前に `DROP DEFAULT`、ALTER 後に `SET DEFAULT` を挟む。②配列列 (`mutingNotificationTypes` 等) は `TYPE "..."[] USING "col"::"text"::"..."[]` と配列キャストにする。③**`down` の落とし穴**: 削除する値を既存行が使っていると `USING` キャストが「該当 enum に存在しない」で失敗する。新値を追加しただけの直後の巻き戻しは安全だが、運用後に使われた値を消す巻き戻しは本質的に危うい — その場合は down で先に `UPDATE ... SET "type" = '<代替値>' WHERE "type" = '<消す値>'` で退避してからキャストする。

参照: [migration/1674118260469-achievement.js](../../../../../packages/backend/migration/1674118260469-achievement.js) (rename/recreate の完全な up/down)。型の新規作成は [migration/1580276619901-v12-10.js](../../../../../packages/backend/migration/1580276619901-v12-10.js)。

### 3. データ移行 (UPDATE バックフィル)

**なぜ危険か**: migration 内の `UPDATE` は本番の全行を触る可能性がある。大量行では長時間ロック・トランザクション肥大を招く。

- 既定値を入れるだけなら `UPDATE ... WHERE col IS NULL` で冪等に書く。複数回流れても安全な形にする
- 巨大テーブルの全行更新は避けるのが基本。どうしても必要なら CONCURRENTLY 同様にバッチ分割や別運用を検討し、PR で相談する
- `down` で元値に戻せないデータ移行 (情報が失われる変換) は、`down` に戻せない旨をコメントで明示し、最低限スキーマだけは巻き戻す

```js
// up: nullable 追加 → バックフィル → NOT NULL 化
await queryRunner.query(`ALTER TABLE "user_profile" ADD "github" boolean`);
await queryRunner.query(`UPDATE "user_profile" SET "github" = FALSE WHERE "github" IS NULL`);
await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "github" SET NOT NULL`);
```

### 4. JSONB / 配列列のデフォルト

**なぜ危険か**: 既定値リテラルの書式を誤ると `migration:generate` の出力とズレてスタイル不一致になる。実績ある書式に揃える。

```js
await queryRunner.query(`ALTER TABLE "user_profile" ADD "room" jsonb NOT NULL DEFAULT '{}'`);          // オブジェクト
await queryRunner.query(`ALTER TABLE "bubble_game_record" ADD "logs" jsonb NOT NULL DEFAULT '[]'`);     // 配列(JSON)
await queryRunner.query(`ALTER TABLE "user_group" ADD "reads" character varying(32) array NOT NULL DEFAULT '{}'::varchar[]`); // PG 配列型
```

参照: [migration/1565634203341-room.js](../../../../../packages/backend/migration/1565634203341-room.js), [migration/1704959805077-bubble-game-record.js](../../../../../packages/backend/migration/1704959805077-bubble-game-record.js)。`down` はいずれも `DROP COLUMN`。

### 5. 安全な DROP と COMMENT

- **DROP の冪等性**: 状況により対象が無いことがある DROP は `IF EXISTS` を付ける (`DROP INDEX IF EXISTS "..."`)。ただし `migration:generate` は通常 `IF EXISTS` を付けない素の DDL を出すので、手で足すのは「条件付きで存在する」と分かっている時だけにする (無闇に付けると本来検出すべき不整合を隠す)
- **COMMENT ON COLUMN**: Misskey は denormalize した列に `'[Denormalized]'` コメントを付ける慣習がある。エンティティの `@Column({ comment: '[Denormalized]' })` に対応して `migration:generate` が `COMMENT ON COLUMN` を出す。`up` で付与したら `down` でも対称に書く

  ```js
  await queryRunner.query(`COMMENT ON COLUMN "note"."renoteChannelId" IS '[Denormalized]'`);
  ```

  参照: [migration/1761569941833-add-channel-muting.js](../../../../../packages/backend/migration/1761569941833-add-channel-muting.js)

### 6. 列リネーム

`migration:generate` はエンティティのプロパティ名変更を **「DROP 旧列 + ADD 新列」** と解釈しがちで、これだと **データが消える**。意図がリネームなら生成 SQL を捨て、手書きで `ALTER TABLE "t" RENAME COLUMN "old" TO "new"` (down は逆) に直す。生成結果を鵜呑みにしないこと。
