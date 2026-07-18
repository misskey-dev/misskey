# DB migration を作成する

`packages/backend/migration/` に新規 TypeORM マイグレーションを追加するための手順。

## 大前提 (絶対 NG)

- **既にマージ済み (develop / master) のマイグレーションファイルを編集しない** ([AGENTS.md](../../../../../AGENTS.md))。本番履歴の改変は深刻なデータ不整合を引き起こす。スキーマ変更は **常に新しいタイムスタンプで新規ファイル** を作る
- ファイル名のタイムスタンプ部分を後から書き換えない (順序が壊れる)
- マージ済 migration の `up()` / `down()` 本文も触らない (たとえ "明らかなバグ" であっても、新しい migration で打ち消すこと)

---

## どの方式を使うか決める

| 状況 | 方式 |
|---|---|
| エンティティ (`packages/backend/src/models/*.ts`) を `@Column` / `@Index` / `@Entity` 等で先に変更し、差分から自動生成したい | `typeorm migration:generate` (本ファイルの "A. 差分から自動生成") |
| 手書き SQL / データ移行 / `CREATE INDEX CONCURRENTLY` など、エンティティ差分では表現できない変更 | `typeorm migration:create` で空雛形を作る (本ファイルの "B. 空雛形を作る") |

迷ったら **まずエンティティを変更 → `migration:generate`** が原則。既存 migration (`packages/backend/migration/*.js`) のほぼすべてが `queryRunner.query(\`SQL...\`)` の raw SQL なので、CLI 出力でも手書きでもスタイルは揃う。

---

## 共通: クラス命名規則

- ファイル名: `packages/backend/migration/{unixMs}-{descriptive-name}.js` (拡張子 `.js`)
- ファイル名の `descriptive-name` 部分は既存履歴で混在 (PascalCase / camelCase / kebab-case)、変更を表す単一英語名なら良い
- **クラス名は PascalCase + 13 桁タイムスタンプ** (例: `class BirthdayIndex1767169026317`)
- **`name` プロパティもクラス名と同一文字列** にする (`name = 'BirthdayIndex1767169026317'`)

```js
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PascalCaseName1234567890123 {
    name = 'PascalCaseName1234567890123'

    async up(queryRunner) {
        // 前進マイグレーション
    }

    async down(queryRunner) {
        // up を完全に巻き戻す
    }
}
```

---

## A. エンティティ差分から自動生成

```bash
# リポジトリルートから実行してよい。--filter backend exec が cwd を packages/backend に移すので、
# 出力パス migration/<PascalName> と -d ormconfig.js は packages/backend/ 基準で解決される
pnpm --filter backend exec typeorm migration:generate -d ormconfig.js -o --esm migration/<PascalName>
```

**CONTRIBUTING.md との違い**: CONTRIBUTING.md は `pnpm dlx typeorm ...` を案内しているが、`dlx` はパッケージを一時ダウンロードするため、バージョンが backend の依存関係と揃わない可能性がある。`pnpm --filter backend exec typeorm` はワークスペースにインストール済みの typeorm を使うため **こちらを推奨**。

**`-o --esm` について**: `-o` (`--outputJs`) は「TS ではなく JS を出力する」オプション、`--esm` は「ESM 形式 (`export class ...`) で出力する」オプション。Misskey の既存 migration はすべて ESM JS であるため **両方が必須**。`--esm` を省略すると CommonJS 形式の JS が生成されスタイルが揃わない。

### 事前準備 (一括スクリプト)

`migration:generate` には backend ビルド + ローカル DB が必要。一括で揃えるスクリプトを同梱している (node 製。pure Windows でも動く)。リポジトリルートから:

```bash
node .claude/skills/working-on-backend/scripts/prepare-generate.mjs
```

スクリプトがやること:

- `pnpm build-pre` → `built/meta.json` を生成 (`loadConfig()` が要求)
- `pnpm --filter backend compile-config` → `built/.config.json` を生成 (`ormconfig.js` の `loadConfig()` が要求するのはこれ。ソースの `.config/default.yml` はその入力なので、無ければ `.config/example.yml` から作っておく)
- `pnpm --filter backend build` → エンティティを `built/` に反映 (CLI は `built/` を読む)
- `docker compose -f compose.local-db.yml up -d --wait db` → ローカル DB (postgres) を起動。`--wait` は Docker Compose v2.1.1 (2021-11) 以降が必要 (v2 の `docker compose` 前提。EOL の `docker-compose` v1 は対象外)

`migration:create` (空雛形) しか使わないなら DB もビルドも不要なので、このスクリプトは不要。

---

## B. 空雛形を作る (手書き SQL / データ移行用)

```bash
pnpm --filter backend exec typeorm migration:create -o --esm migration/<PascalName>
```

ローカル DB の起動とビルドは不要。空の `up` / `down` だけが生成される。

**注意:** `-o --esm` を **必ず付ける**。これが無いと `<UnixMs>-<PascalName>.ts` (CommonJS / TS 出力) が生成されるが、Misskey の `ormconfig.js` は `migration/*.js` だけを読み、既存の他 migration も全て `export class ... { async up(queryRunner) {...} }` の ESM JS 形式なので、後で手作業で変換が必要になる。`-o --esm` を付ければそのまま `.js` ESM で出る。

ただし `migration:create` の雛形は **`name = '...'` プロパティを出力しない**ので、後段の SPDX 付与に加えて `name = '<PascalName><ms>'` を手で足し、`up`/`down` を埋める必要がある。雛形冒頭の `@typedef` / `@implements MigrationInterface` JSDoc は既存ファイルに無いので消して house style に揃える。

### B の補助: 引数だけで全部を済ませたい場合

引数で `<PascalCaseName>` を渡すだけで「空雛形生成 + SPDX 付与 + check-migrations 実行」までやる薄いラッパー (旧 `.claude/commands/migrate-new.md` 由来) は廃止された。同等の流れを手で踏みたい場合、上記の `typeorm migration:create` + SPDX 付与 + `name` プロパティ追加 + `check-migrations` の順で実行する。

---

## SPDX ヘッダー付与

CLI 出力には SPDX ヘッダーが含まれない。**必ず冒頭に追加する** (CI の `spdx` ジョブが失敗するため)。

```js
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

---

## up / down の整合確認

- `up()` の各ステートメントに対し、`down()` で完全に巻き戻せること
- 列追加 (`ADD COLUMN`) ↔ 列削除 (`DROP COLUMN`)、テーブル作成 ↔ テーブル削除、FK 追加 ↔ FK 削除、インデックス作成 ↔ インデックス削除 を必ずペアで書く
- `down()` を空のまま残さない。本番ロールバック時に詰む

**単純な逆 SQL では戻らない難ケース** (enum 値の追加・変更 / NOT NULL 列追加 / データ移行 UPDATE / JSONB・配列デフォルト / 列リネーム / 安全な DROP・COMMENT) は [knowledge/typeorm-patterns.md §migration 難ケース](../knowledge/typeorm-patterns.md) を必ず参照。特に **enum 変更** と **列リネーム** は `migration:generate` の出力をそのまま使うと巻き戻せない / データが消えるので要注意。

### インデックス追加時 (CREATE INDEX CONCURRENTLY)

大規模テーブルへの `CREATE INDEX` は本番で長時間ロックする恐れがある。`CONCURRENTLY` で発行するときは migration class に `transaction = false` 等の対応が必要。詳細は [knowledge/typeorm-patterns.md §CONCURRENTLY](../knowledge/typeorm-patterns.md) を参照。

参照実装: [packages/backend/migration/1745378064470-composite-note-index.js](../../../../../packages/backend/migration/1745378064470-composite-note-index.js)。

---

## 検証

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

`check-migrations` の実体は [scripts/check_migrations_clean.js](../../../../../packages/backend/scripts/check_migrations_clean.js)。TypeORM の `dataSource.driver.createSchemaBuilder().log()` で pending DDL を取得し、`upQueries` / `downQueries` のいずれかが残っていれば非ゼロ終了する。**順序検査ではなく**「エンティティと migration が同期しているか」の検査。

---

## 既存ファイル参照テンプレ

新規ファイルを書くときは、変更パターンが近い既存ファイルを **必ずひとつ開いて並べて書く**。スタイルが激しくズレた PR は差し戻されやすい。

| パターン | 参照ファイル |
|---|---|
| インデックス追加 + 関数定義 | [migration/1767169026317-birthday-index.js](../../../../../packages/backend/migration/1767169026317-birthday-index.js) |
| 列追加のみ | [migration/1766652173085-add-category-to-avatar-decorations.js](../../../../../packages/backend/migration/1766652173085-add-category-to-avatar-decorations.js) |
| テーブル新規作成 + FK | [migration/1761569941833-add-channel-muting.js](../../../../../packages/backend/migration/1761569941833-add-channel-muting.js) |

---

## CHANGELOG (ユーザー影響がある場合)

スキーマ変更がユーザーに見える挙動を生む場合のみ、`CHANGELOG.md` に追記する。内部リファクタや純粋なインデックス追加は不要。詳細は [shipping-misskey-change スキル](../../../shipping-misskey-change/SKILL.md) で確認。

---

## 提出前セルフレビューチェックリスト

完了前に以下を上から確認する (各項目を TodoWrite 化してよい):

- [ ] **新規タイムスタンプ**で作成し、既にマージ済みの migration ファイルは一切編集していない (大前提)
- [ ] ファイル冒頭に **SPDX ヘッダー**がある
- [ ] `export class <PascalName><ms>` と `name = '<PascalName><ms>'` の **文字列が完全一致** している (PascalCase + 13 桁タイムスタンプ)
- [ ] `up()` の各文に対応する巻き戻しが `down()` にあり、**`down()` が空でない** (難ケースは [knowledge/typeorm-patterns.md](../knowledge/typeorm-patterns.md) を確認済み)
- [ ] `pnpm --filter backend check-migrations` が **0 件 (pending DDL なし)** で通る
- [ ] (可能なら) `pnpm migrate` → `pnpm revert` → `pnpm migrate` が通る
- [ ] ユーザーに見える変更なら CHANGELOG 追記 → [shipping-misskey-change](../../../shipping-misskey-change/SKILL.md)
