# 新規 REST API endpoint を追加する

`packages/backend/src/server/api/endpoints/<category>/<name>.ts` に新規エンドポイントを追加するための手順。**配線フェーズの `endpoint-list.ts` 登録を忘れると 404** になるので、まずそこを念頭に置く。

## 最重要事実 (見落とすと CI / 本番が壊れる)

1. **エンドポイントは glob 自動収集されない**。[endpoint-list.ts](../../../../../packages/backend/src/server/api/endpoint-list.ts) への 1 行追加が必須 → [knowledge/endpoint-list.md](../knowledge/endpoint-list.md)
2. **`meta` / `paramDef` / `res` を変えたら misskey-js 再生成が必須**。`pnpm build-misskey-js-with-types` を忘れると CI の `check-misskey-js-autogen` で必ず落ちる
3. **`meta.errors` の各 `id` は UUID v4 で、リポジトリ内で一意**。`crypto.randomUUID()` で生成し、`grep -r "id: '<UUID>'" packages/backend/src/server/api/endpoints/` で衝突確認

## ワークフロー全体図

```
1. 設計    : エンドポイントの種類を決める (read/write × 認証要否 × 権限)
2. 実装    : meta / paramDef / クラス本体を書く (SPDX ヘッダー付き)
3. 配線    : endpoint-list.ts に登録 (★ 忘れると 404)
4. 検証    : e2e テスト + lint + misskey-js 再生成
5. 仕上げ  : CHANGELOG エントリ (shipping-misskey-change で確認)
```

---

## 1. 設計フェーズ — どのテンプレートをベースにするか

まず作るエンドポイントの性質を確定させる。**既存実装をテンプレートとしてコピペ起点にするのが最短路**。

| 性質 | ベースにする既存実装 |
|---|---|
| 認証不要・パラメータなし・小さなレスポンス | [endpoints/ping.ts](../../../../../packages/backend/src/server/api/endpoints/ping.ts) |
| 認証必須・DI で Repository / Service を注入・errors あり | [endpoints/notes/create.ts](../../../../../packages/backend/src/server/api/endpoints/notes/create.ts) |
| ページネーション (sinceId/untilId/limit) | [endpoints/notes/timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/timeline.ts) |
| ロールポリシー (動的) ベースのアクセス制御 | [endpoints/notes/global-timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts) — `RoleService.getUserPolicies()` を使う |
| ファイル添付 (`requireFile: true`) | [endpoints/drive/files/create.ts](../../../../../packages/backend/src/server/api/endpoints/drive/files/create.ts) |
| moderator / admin 専用 | [endpoints/admin/suspend-user.ts](../../../../../packages/backend/src/server/api/endpoints/admin/suspend-user.ts) (moderator), [endpoints/admin/roles/create.ts](../../../../../packages/backend/src/server/api/endpoints/admin/roles/create.ts) (admin) |

`<category>` は機能領域 (例: `notes`, `users`, `admin/announcements`)。ディレクトリは既存に倣う。

---

## 2. 実装フェーズ

### 2.1 SPDX ヘッダー (必須)

新規 `.ts` ファイル冒頭に必ず付ける (欠落すると CI の `spdx` ジョブで失敗):

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

> 注: `packages/misskey-js/src/autogen/` 配下にも diff が出るが、**misskey-js は MIT ライセンス** で別管理 (`packages/misskey-js/package.json:license` = MIT) なので SPDX ヘッダーは付けない / 不要。

### 2.2 最小テンプレート (認証不要 read 系)

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
			// 実装。me は MiLocalUser | null (requireCredential: false のため null チェック必須)
		});
	}
}
```

### 2.3 DI / errors / limit を含むテンプレート

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],
	requireCredential: true,         // 認証必須 → kind 必須 (例外: secure: true な内部 API は kind 不要)
	kind: 'write:notes',             // OAuth scope (一覧は packages/misskey-js/src/consts.ts の `permissions`)
	prohibitMoved: false,            // 移行済アカウントを拒否するか
	limit: {
		duration: 1000 * 60 * 60,    // 1 時間
		max: 300,
	},
	errors: {
		noSuchNote: {                            // ← キーは camelCase
			message: 'No such note.',            // ← 英語ハードコード (バックエンドに i18n 機構なし)
			code: 'NO_SUCH_NOTE',                // ← code は SCREAMING_SNAKE_CASE
			id: '17a0e0fa-3f3e-4f3e-9f3e-3f3e3f3e3f3e', // ← crypto.randomUUID() で生成し衝突確認
		},
	},
	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Note',                 // packed entity を参照する場合
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
			// requireCredential: true なので me は MiLocalUser (null になり得ない)
			const note = await this.notesRepository.findOneBy({ id: ps.noteId });
			if (note == null) throw new ApiError(meta.errors.noSuchNote);
			// 実装
		});
	}
}
```

DI / module 登録の詳細は [knowledge/nestjs-di.md](../knowledge/nestjs-di.md) を参照。

### 2.4 `exec` 関数のフルシグネチャ

`super(meta, paramDef, cb)` の `cb` が受け取る引数は 7 つある ([endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) の `Executor` 型):

```ts
async (ps, me, token, file, cleanup, ip, headers) => { ... }
```

| 引数 | 型 | 用途 |
|---|---|---|
| `ps` | `SchemaType<typeof paramDef>` | AJV 検証済の入力 |
| `me` | `MiLocalUser` (requireCredential: true) / `MiLocalUser \| null` (false) | ローカルユーザー。`requireCredential: false` のとき必ず null チェック |
| `token` | `MiAccessToken \| null` | OAuth トークン (アプリ識別が要るとき) |
| `file` | `{ name, path } \| undefined` | `requireFile: true` のときのみ確実に渡る。エンドポイント基底クラスが既に null チェック済 |
| `cleanup` | `() => any \| undefined` | アップロードされた一時ファイルを削除するコールバック。**基底クラスが自動で呼ぶのは AJV バリデーション失敗時だけ**。正常終了や endpoint 内例外時は **呼ばれない** ので、`try { ... } finally { cleanup!(); }` で必ず呼ぶ責務がある ([drive/files/create.ts](../../../../../packages/backend/src/server/api/endpoints/drive/files/create.ts) の `finally { cleanup!(); }` が手本) |
| `ip` | `string \| null \| undefined` | クライアント IP |
| `headers` | `Record<string, string> \| null \| undefined` | リクエストヘッダ |

ほとんどのエンドポイントは `(ps, me)` だけで十分。`token` / `ip` / `headers` まで使うのは admin / debug / auth 系のごく一部。

### 2.5 meta / paramDef の規約

頻出 5 件 (`tags` / `requireCredential` / `kind` / `limit` / `errors`) の使い方や全フィールド一覧、`requiredRolePolicy` / `secure` / `cacheSec` / `allowGet` 等、それと `paramDef` の AJV 実用パターンは → [knowledge/api-meta-paramdef.md](../knowledge/api-meta-paramdef.md)。

### 2.6 エラー throw のバランス

**クライアントに返すべき業務エラー** は必ず `meta.errors` に列挙して `throw new ApiError(meta.errors.<key>)` する。これを守らないと misskey-js 側の型に出ず、レスポンスも 500 になる。第 2 引数で追加情報を渡せる:

```ts
throw new ApiError(meta.errors.invalidParam, { reason: 'too short' });
```

一方で **想定外の例外 (DB 不整合 / 下層 service の bug / 防御的アサーション)** は `throw new Error('...')` のままで構わない。すべての例外を `ApiError` で包むと、未知のバグが client error として隠蔽されてしまう。`endpoints/notes/create.ts` の `catch` 節末尾の `throw err;` がこの二段構えの典型。

---

## 3. 配線フェーズ — endpoint-list.ts に登録 ★必須

[endpoint-list.ts](../../../../../packages/backend/src/server/api/endpoint-list.ts) の **同カテゴリ内** に 1 行追加する:

```ts
export * as '<category>/<name>' from './endpoints/<category>/<name>.js';
```

詳細・落とし穴は [knowledge/endpoint-list.md](../knowledge/endpoint-list.md) を参照。**ここへの登録漏れ = 404**。

---

## 4. 検証フェーズ

### 4.1 e2e テスト

[packages/backend/test/e2e/](../../../../../packages/backend/test/e2e/) の構造は **機能カテゴリごとのファイル分け** (`note.ts` / `users.ts` / `timelines.ts` / `drive.ts` / `clips.ts` / `oauth.ts` 等)。

- 既存のカテゴリファイルがあるなら、そこに `describe('<人間可読ラベル>', () => { test('正常系', ...) })` で追加
- どのファイルにも合わないなら `test/e2e/endpoints.ts` に追加
- `describe` 名は **人間可読 OK**

最小例 (詳細なヘルパー一覧は → [knowledge/backend-testing.md](../knowledge/backend-testing.md)):

```ts
import { describe, test } from 'vitest';
import * as assert from 'node:assert';
import { api, signup } from '../utils.js';

describe('<人間可読ラベル>', () => {
	test('正常系', async () => {
		const alice = await signup({ username: 'alice' });
		const res = await api('<category>/<name>', { /* params */ }, alice);
		assert.strictEqual(res.status, 200);
	});
});
```

実行 (前提: `.config/test.yml` — [knowledge/backend-testing.md](../knowledge/backend-testing.md) §前提 参照):

```bash
pnpm --filter backend test:e2e
```

### 4.2 lint / typecheck

```bash
# 個別ファイルを高速にチェック
pnpm exec eslint --fix packages/backend/src/server/api/endpoints/<category>/<name>.ts
pnpm --filter backend typecheck      # tsgo --noEmit (全パッケージ)

# 一括 (PR 提出前)
pnpm --filter backend lint
```

### 4.3 misskey-js 再生成 (★必須)

`meta` / `paramDef` / `res` を変えたら必ず:

```bash
pnpm build-misskey-js-with-types
```

PR に `packages/misskey-js/src/autogen/` 配下の差分が含まれていないと CI の `check-misskey-js-autogen` で必ず落ちる (最頻ミス)。詳細手順は [shipping-misskey-change/references/tasks/regenerate-misskey-js.md](../../../shipping-misskey-change/references/tasks/regenerate-misskey-js.md)。

---

## 5. 仕上げフェーズ — CHANGELOG

ユーザー影響がある (新機能 / 既存挙動変更) なら `CHANGELOG.md` の `## Unreleased` → `### Server` に 1 行追加する。詳細は [shipping-misskey-change スキル](../../../shipping-misskey-change/SKILL.md) に従う。

---

## 落とし穴サマリ (PR で頻発するミス)

詳細な症状 → 原因 → 修正 のフォーマット → **[knowledge/api-meta-paramdef.md](../knowledge/api-meta-paramdef.md) §落とし穴**

- **404 になる** → `endpoint-list.ts` 登録漏れ
- **CI `check-misskey-js-autogen` で落ちる** → `pnpm build-misskey-js-with-types` 忘れ
- **CI `spdx` で落ちる** → SPDX ヘッダー欠落
- **クライアントが 500 と error 型不在を受け取る** → `meta.errors` 列挙なしに `throw new ApiError(...)` した
- **`me.id` で TypeError** → `requireCredential: false` で null チェックを忘れた
- **UUID 重複** → 衝突確認グレップを忘れた
- **一時ファイルが残る** → `requireFile: true` で `cleanup!()` を `finally` で呼び忘れた
- **`requiredRolePolicy` で匿名アクセスが 500 になる** → `ApiCallService` が `user!.id` を非null前提で参照するため `requireCredential: true` 必須

---

## 参照ファイル

### コードベース

- [endpoints.ts (meta/paramDef 型定義)](../../../../../packages/backend/src/server/api/endpoints.ts)
- [endpoint-base.ts (Endpoint 基底クラス)](../../../../../packages/backend/src/server/api/endpoint-base.ts)
- [endpoint-list.ts (★ ここに登録)](../../../../../packages/backend/src/server/api/endpoint-list.ts)
- [error.ts (ApiError)](../../../../../packages/backend/src/server/api/error.ts)
- [endpoints/ping.ts (最小例)](../../../../../packages/backend/src/server/api/endpoints/ping.ts)
- [endpoints/notes/create.ts (DI + errors の典型)](../../../../../packages/backend/src/server/api/endpoints/notes/create.ts)
- [endpoints/notes/global-timeline.ts (policies 動的チェック)](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts)
- [test/e2e/endpoints.ts (テスト例)](../../../../../packages/backend/test/e2e/endpoints.ts)
- [test/utils.ts (api/signup/post 等のヘルパー)](../../../../../packages/backend/test/utils.ts)
- [scripts/generate_api_json.js (misskey-js 生成元)](../../../../../packages/backend/scripts/generate_api_json.js)
