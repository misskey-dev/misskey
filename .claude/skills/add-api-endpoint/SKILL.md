---
name: add-api-endpoint
description: Misskey の REST API エンドポイント (/api/<category>/<name>) を NestJS DI + meta/paramDef 規約で追加する。バックエンドに新しい API ルートを足す時に必ず使う。endpoint-list.ts への手動登録、e2e テスト、misskey-js 再生成、CHANGELOG までの一連の手順を含む。
---

# Misskey API エンドポイント追加スキル

`packages/backend/src/server/api/endpoints/<category>/<name>.ts` に新規エンドポイントを追加するためのワークフロー。**手順 4 (endpoint-list.ts 登録) を忘れると 404 になる** 点に最大の注意を払う。

## 最重要事実 (見落とすと壊れる)

1. エンドポイントは **glob 自動収集されない**。[packages/backend/src/server/api/endpoint-list.ts](../../../packages/backend/src/server/api/endpoint-list.ts) への 1 行追加が必須。
2. `meta` / `paramDef` を変えたら **misskey-js の再生成が必須**。`pnpm build-misskey-js-with-types` を忘れると CI の `check-misskey-js-autogen` で必ず落ちる。
3. `meta.errors` の各 `id` は **UUID**。重複させない (既存全 UUID と衝突確認)。

## ステップ 1: ファイル配置と SPDX

`packages/backend/src/server/api/endpoints/<category>/<name>.ts` に新規作成する。`<category>` は機能領域 (例: `notes`, `users`, `admin/announcements`)。

冒頭に SPDX ヘッダーを必ず付ける:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

## ステップ 2: 最小テンプレート (シンプル read 系)

[endpoints/ping.ts](../../../packages/backend/src/server/api/endpoints/ping.ts) をベースに書く。認証不要・パラメータなし・小さなレスポンスの例:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['<tag>'],
	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			// ...
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			// 実装
		});
	}
}
```

## ステップ 3: 認証付き / DI / errors を含むテンプレート

[endpoints/notes/create.ts](../../../packages/backend/src/server/api/endpoints/notes/create.ts) を参照する。要点:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
// import ms from 'ms'; // limit.duration に ms('1hour') 等を渡すとき (default import)

export const meta = {
	tags: ['notes'],
	requireCredential: true,        // 認証必須なら true
	prohibitMoved: false,            // moved user を拒否するか
	kind: 'write:notes',             // OAuth scope (requireCredential 時に必須)
	limit: {
		duration: 3600000,           // ms('1hour')
		max: 300,
	},
	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', // ★ UUID v4 を必ず生成 (`x`=hex, `y`=8/9/a/b)。下の「UUID 生成」を参照
		},
	},
	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Note',                 // packed entity に揃える場合
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.notesRepository.findOneBy({ id: ps.noteId });
			if (note == null) throw new ApiError(meta.errors.noSuchNote);
			// 実装
		});
	}
}
```

### meta フィールド早見表

| フィールド | 用途 |
|---|---|
| `tags` | OpenAPI タグ (機能領域) |
| `requireCredential` | 認証必須か |
| `requireModerator` / `requireAdmin` | 権限制限 |
| `prohibitMoved` | アカウント移行済ユーザーを拒否 |
| `kind` | OAuth scope (`read:notes` / `write:notes` 等)。`requireCredential: true` 時必須 |
| `limit` | レート制限 (`{ duration, max, key?, minInterval? }`) |
| `errors` | エラー定義。各要素に `message` / `code` / `id` (UUID v4) 必須 |
| `res` | JSON Schema or `ref: '<EntityName>'` (packed entity 参照) |
| `requireFile` | ファイルアップロード必須 |
| `secure` | secure cookie 必要 |
| `allowGet` | GET メソッド許可 |
| `cacheSec` | レスポンスキャッシュ秒数 |
| `description` | OpenAPI 説明 |

詳細は [endpoints.ts](../../../packages/backend/src/server/api/endpoints.ts) の型定義 (lines 11-125) を参照。

### paramDef の特殊フォーマット

JSON Schema (AJV) ベースだが、Misskey 拡張を使える:

- `format: 'misskey:id'` — ID 文字列バリデーション
- `allOf` / `anyOf` / `oneOf` — 複合条件
- `default` — デフォルト値

詳細は [endpoint-base.ts](../../../packages/backend/src/server/api/endpoint-base.ts) を参照。

### エラー throw

**「公開 API エラーとして API クライアントに返したいもの」は必ず `throw new ApiError(meta.errors.<key>)` を使う**。`meta.errors` に列挙した上で `ApiError` でラップしないと、misskey-js 側の型情報に出ず、レスポンスも 500 になる。第 2 引数で追加情報を渡せる:

```ts
throw new ApiError(meta.errors.invalidParam, { reason: 'too short' });
```

一方で、**想定外の例外 (DB 不整合 / 下層サービスの bug など) を握り潰すために `try/catch` で `ApiError` に変換するのは避ける**。既存 endpoint も「期待される業務エラーは `ApiError` に変換し、それ以外は `throw err;` で再 throw する」という二段構えになっている。`packages/backend/src/server/api/endpoints/notes/create.ts` の `catch` 節 (末尾の `throw err;`) を参照。生の `throw` を全面禁止すると未知例外も 200 で潰れて debug が困難になるので、このバランスを保つ。

詳細は [error.ts](../../../packages/backend/src/server/api/error.ts) の `ApiError` クラスを参照。

### UUID 生成

```bash
node -e "console.log(crypto.randomUUID())"
```

その UUID が他のエンドポイントの `id` と衝突していないか必ず確認:

```bash
grep -r "id: '<生成した UUID>'" packages/backend/src/server/api/endpoints/
```

## ステップ 4: ★必須 — endpoint-list.ts に登録

[packages/backend/src/server/api/endpoint-list.ts](../../../packages/backend/src/server/api/endpoint-list.ts) の同カテゴリ末尾に 1 行追加する（既存の並びを崩さない）:

```ts
export * as '<category>/<name>' from './endpoints/<category>/<name>.js';
```

ファイル冒頭のコメント (`When you add new endpoint, you should add it to this file.`) の通り、このリストが API ルーティングの単一の真実。**忘れると 404**。

`EndpointsModule.ts` がこのファイルの全エクスポートを `Object.entries()` で反復し、NestJS provider (`provide: 'ep:<path>'`) を生成する。

## ステップ 5: e2e テスト追加

[packages/backend/test/e2e/endpoints.ts](../../../packages/backend/test/e2e/endpoints.ts) に対応する `describe` / `test` を追加する。`api()` ヘルパーで叩く:

```ts
describe('<category>/<name>', () => {
	test('正常系', async () => {
		const res = await api('<category>/<name>', { /* params */ }, alice);
		assert.strictEqual(res.status, 200);
	});
});
```

実行: `pnpm --filter backend test:e2e`

## ステップ 6: misskey-js 再生成 (★必須)

`meta` / `paramDef` / `res` を変えたら必ず実行する:

```bash
pnpm build-misskey-js-with-types
```

これで以下が更新される:

- `packages/backend/built/api.json` (OpenAPI spec)
- `packages/misskey-js/generator/api.json`
- `packages/misskey-js/src/autogen/*.ts` (TypeScript 型)

PR に `packages/misskey-js/src/autogen/` 配下の差分が含まれていないと、CI の `check-misskey-js-autogen` で落ちる。

## ステップ 7: Lint と typecheck

```bash
pnpm --filter backend lint
```

(typecheck = `tsgo --noEmit` / ESLint = `eslint`)

## ステップ 8: CHANGELOG

ユーザー影響がある (新機能 / 既存挙動変更) なら、`CHANGELOG.md` の `## Unreleased` → `### Server` に 1 行追加する ([AGENTS.md §CHANGELOG](../../../AGENTS.md#changelog) 参照):

```
- Feat: /api/<category>/<name> を追加
```

純粋なリファクタや内部用なら不要。

## 参照ファイル

- [endpoints.ts (meta/paramDef 型定義)](../../../packages/backend/src/server/api/endpoints.ts)
- [endpoint-base.ts (Endpoint 基底クラス)](../../../packages/backend/src/server/api/endpoint-base.ts)
- [endpoint-list.ts (★ ここに登録)](../../../packages/backend/src/server/api/endpoint-list.ts)
- [error.ts (ApiError)](../../../packages/backend/src/server/api/error.ts)
- [endpoints/ping.ts (最小例)](../../../packages/backend/src/server/api/endpoints/ping.ts)
- [endpoints/notes/create.ts (DI + errors の典型)](../../../packages/backend/src/server/api/endpoints/notes/create.ts)
- [test/e2e/endpoints.ts (テスト例)](../../../packages/backend/test/e2e/endpoints.ts)
- [scripts/generate_api_json.js (misskey-js 生成元)](../../../packages/backend/scripts/generate_api_json.js)
