# Backend (`packages/backend`) 規約

NestJS 11 + Fastify 5 + TypeORM 0.3 (PostgreSQL) + Redis。

## アーキテクチャ

- **DI コンテナ**: NestJS の `@Injectable()` サービス + Repository (TypeORM) パターン。
- **DI トークン**: `@/di-symbols.js` の `DI` から `@Inject(DI.xxx)` で注入。
- **ビルド**: `rolldown -c` で `built/` にバンドル。型チェックは `tsgo`。

## API エンドポイント

### 配置

`packages/backend/src/server/api/endpoints/<category>/<name>.ts` (一部はトップ直下)。

### 三点セット (`endpoints/ping.ts` 参照)

各エンドポイントファイルは以下の 3 つを export する:

```ts
export const meta = {
    tags: ['<tag>'],
    requireCredential: true,           // または false (必ず明示)
    requireModerator: false,           // 必要なら true
    kind: 'read:account',              // OAuth scope
    res: {
        type: 'object',
        optional: false, nullable: false,
        properties: { /* ... */ },
    },
    errors: {
        sampleError: {
            message: 'Sample error message.',
            code: 'SAMPLE_ERROR',
            id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', // UUID v4 (`x`=hex, `y`=8/9/a/b)。`crypto.randomUUID()` で生成し、他エンドポイントと重複させない
        },
    },
} as const;

export const paramDef = {
    type: 'object',
    properties: { /* JSON Schema */ },
    required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
    constructor(
        // @Inject(DI.xxx) private xxxRepository: XxxRepository,
    ) {
        super(meta, paramDef, async (ps, me) => {
            // 実装。エラーは throw new ApiError(meta.errors.xxx);
        });
    }
}
```

### 注意点

- **公開 API エラーとしてクライアントに返したいものは `throw new ApiError(meta.errors.<key>)` を使う**。`meta.errors` に列挙して `ApiError` でラップしないと misskey-js 側の型に出ず、レスポンスも 500 になる。
- 一方で **想定外の例外 (DB 不整合 / 下層サービスの bug 等) は握り潰さず再 throw する**。既存 endpoint も「期待される業務エラーは `ApiError` に変換し、それ以外は `throw err;` で再 throw」の二段構え (例: [`endpoints/i/pin.ts`](../../packages/backend/src/server/api/endpoints/i/pin.ts) の `catch` 節)。生 `throw` を全面禁止すると未知例外が 200 で潰れて debug 困難になる。
- `meta.errors.<key>.id` は **UUID** 形式。新規追加時は他エンドポイントと重複しないよう確認する。
- `requireCredential` は `true` / `false` を必ず明示する。
- 新規エンドポイント追加後は **`pnpm build-misskey-js-with-types`** を実行する (`misskey-js` の自動生成ファイルを更新)。

### ルート登録

エンドポイントは **glob 自動収集されない**。新規ファイルを `endpoints/<category>/<name>.ts` に置いただけでは API ルーティングに乗らず、404 になる。`packages/backend/src/server/api/endpoint-list.ts` にアルファベット順で 1 行追加するのが必須:

```ts
export * as '<category>/<name>' from './endpoints/<category>/<name>.js';
```

`EndpointsModule.ts` がこのファイルの全エクスポートを `Object.entries()` で反復し、NestJS の provider (`provide: 'ep:<path>'`) を生成する。詳細は [.claude/skills/add-api-endpoint/SKILL.md](../skills/add-api-endpoint/SKILL.md) のステップ 4 を参照。

## モデル / Repository

- エンティティ: `packages/backend/src/models/<Name>.ts` (`@Entity` + `@Column`)。
- DI 経由で注入される Repository を経由してアクセス。

## Migration

詳細手順 (手書き方式 = AGENTS.md §3 と整合):

> エンティティ差分からの自動生成や `CREATE INDEX CONCURRENTLY` 等のオプションを使いたい場合は [.claude/skills/create-migration/SKILL.md](../skills/create-migration/SKILL.md) の TypeORM CLI 手順を使う。手書き / CLI どちらでも `check-migrations` (pending DDL 検出) さえ通せば等価。

1. **タイムスタンプ取得**: `node -e "console.log(Date.now())"`
2. **ファイル名**: `packages/backend/migration/{timestamp}-{PascalCaseName}.js` (拡張子は `.js`)
3. **雛形**:

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

4. **検証**:
   - `pnpm --filter backend check-migrations` (TypeORM schema builder で pending DDL を検出する。エンティティと migration の不一致が残っているとここで非ゼロ終了する。実体は [scripts/check_migrations_clean.js](../../packages/backend/scripts/check_migrations_clean.js))
   - `pnpm migrate` (ローカル DB に適用)
   - `pnpm revert` (ロールバック確認)
5. **エンティティとの整合性**: 関連する `src/models/*.ts` の `@Column` / `@Entity` も同時に更新する。

> マージ済み migration の編集は **絶対禁止** ([AGENTS.md §3](../../AGENTS.md#3-マージ済み-migration-を絶対に編集しない))。

## テスト

- Unit: `pnpm --filter backend test` (`vitest.config.unit.ts`)
- E2E: `pnpm --filter backend test:e2e` (`vitest.config.e2e.ts`)
- Federation: `pnpm --filter backend test:fed` (`vitest.config.fed.ts`)
- 配置: `packages/backend/test/` 配下。
