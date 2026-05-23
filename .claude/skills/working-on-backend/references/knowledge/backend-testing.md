# Backend テストの前提と書き方

Misskey backend のテスト構成、`.config/test.yml` の前提、e2e テストのヘルパー関数集を 1 つにまとめたページ。

## 目次

- [前提: `.config/test.yml`](#前提-configtestyml)
- [テスト種別と実行コマンド](#テスト種別と実行コマンド)
- [e2e テストの配置](#e2e-テストの配置)
- [共通 setup](#共通-setup)
- [`api()` ヘルパー](#api-ヘルパー)
- [`signup()` / `post()` / `uploadFile()` 等](#signup--post--uploadfile-等)
- [ローカル DB / Redis](#ローカル-db--redis)

## 前提: `.config/test.yml`

backend のテストスクリプト (`test` / `test:e2e` / `test:fed`) はすべて内部で `cross-env NODE_ENV=test pnpm compile-config` を実行し、`.config/test.yml` を読み込む ([packages/backend/package.json](../../../../../packages/backend/package.json), [packages/backend/scripts/compile_config.js](../../../../../packages/backend/scripts/compile_config.js))。**未作成だとテスト自体が起動しない**。

未作成なら以下を 1 回だけ手動コピーする (どちらでも可):

```bash
ncp .github/misskey/test.yml .config/test.yml
# または
cp .github/misskey/test.yml .config/test.yml
```

補足:

- ルートの `pnpm start:test` (Cypress 用にテストサーバーを起動するコマンド) を使う経路では実行時に `ncp` で自動コピーされる ([package.json](../../../../../package.json))。それ以外で backend テストを直接走らせる時は上記の手動コピーが必要
- すでに `.config/test.yml` があれば各テストスクリプトの内部 `compile-config` で十分なので、追加で `pnpm --filter backend compile-config` を叩く必要はない
- `pnpm start:test` は backend e2e テスト (`pnpm --filter backend test:e2e`) の前提ではない (ポート競合の元になるため使わないこと)

## テスト種別と実行コマンド

| 種別 | 設定ファイル | 実行コマンド |
| --- | --- | --- |
| Unit | `packages/backend/vitest.config.unit.ts` | `pnpm --filter backend test` |
| E2E (HTTP / DB) | `packages/backend/vitest.config.e2e.ts` | `pnpm --filter backend test:e2e` |
| Federation | `packages/backend/vitest.config.fed.ts` | `pnpm --filter backend test:fed` |

- 配置: `packages/backend/test/` 配下
- カバレッジ: `pnpm --filter backend test-and-coverage`

## e2e テストの配置

`packages/backend/test/e2e/` の現状ファイル例:

```
note.ts            ノート関連 (作成・renote・visibility・添付ファイル等)
users.ts           ユーザー関連
timelines.ts       タイムライン
drive.ts           ドライブ (アップロード/ダウンロード)
clips.ts           クリップ
oauth.ts           OAuth フロー
streaming.ts       WebSocket
api.ts             API レイヤ全般 (認証・レート制限など)
api-visibility.ts  公開範囲チェック
endpoints.ts       上記カテゴリに収まらない雑多なもの
2fa.ts             2FA
block.ts / mute.ts / antennas.ts / clips.ts / move.ts / nodeinfo.ts / ...
```

> **`admin.ts` は存在しない**。admin 系エンドポイントの e2e は `api.ts` (API レイヤ挙動として) または `endpoints.ts` (雑多枠) に置くのが現実的。

### 判断ルール

1. 自分の追加するエンドポイントが既存カテゴリファイル (`note.ts`, `users.ts` 等) に所属するなら、そこに `describe('...', () => { test(...) })` を追加
2. どのカテゴリにも収まらないなら `endpoints.ts` に追加
3. テストケースが多くなり (>200 行)、独立性が高い場合のみ新ファイル化

`describe` のラベル名は **人間可読** で OK (`describe('Note', ...)`, `describe('管理者操作', ...)` のような形式)。`<category>/<name>` 形式である必要はない。

## 共通 setup

`packages/backend/test/setup.e2e.ts` が自動で `beforeAll` / `afterAll` を設定する。各テストファイルでは:

```ts
import { describe, test, beforeAll, afterAll } from 'vitest';
import * as assert from 'node:assert';
import { api, signup, post, role, uploadFile } from '../utils.js';
import type { UserToken } from '../utils.js';

describe('機能名', () => {
	let alice: UserToken;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
	});

	test('正常系', async () => {
		const res = await api('<category>/<name>', { /* params */ }, alice);
		assert.strictEqual(res.status, 200);
	});
});
```

## `api()` ヘルパー

[test/utils.ts](../../../../../packages/backend/test/utils.ts) の `api()`:

```ts
const res = await api('<category>/<name>', params, me?);
// res.status   : HTTP ステータス (200 / 400 / 401 / 403 / 500 等)
// res.headers  : Headers
// res.body     : レスポンス JSON (型は misskey.Endpoints から自動推論)
```

`me?` を省略すると未認証リクエスト。`me` を渡すとそのユーザーの token で叩く。

### エラーレスポンスの検証

```ts
test('存在しないノートで怒られる', async () => {
	const res = await api('notes/show', { noteId: '0000000000000000' }, alice);
	assert.strictEqual(res.status, 400);
	assert.strictEqual(castAsError(res.body as any).error.code, 'NO_SUCH_NOTE');
});
```

`castAsError(...).error.code` で `meta.errors.<key>.code` を検証できる ([test/utils.ts](../../../../../packages/backend/test/utils.ts) の `castAsError`)。

## `signup()` / `post()` / `uploadFile()` 等

### `signup()` — テストユーザー作成

```ts
const alice = await signup({ username: 'alice' });        // 既定パスワード 'test'
const bob = await signup({ username: 'bob', password: 'secret123' });
```

戻り値はサインアップレスポンス (token を含む) で、`api()` の第 3 引数にそのまま渡せる。

### `post()` — ノート投稿

```ts
const note = await post(alice, { text: 'hello' });
// 戻り値は misskey.entities.Note
```

複雑な公開範囲・添付ファイル付きでも `post(alice, { text: ..., visibility: 'specified', visibleUserIds: [...], fileIds: [...] })` のように渡せる。

### `uploadFile()` — ドライブにファイルアップロード

```ts
const file = await uploadFile(alice);                                       // resources/192.jpg をアップロード
const file2 = await uploadFile(alice, { path: 'sample.png' });              // resources/sample.png
const file3 = await uploadFile(alice, { blob: new Blob([...]) });           // 任意 Blob
// file.body.id を fileIds に渡せる
```

### `role()` — ロール作成 + アサイン

[test/utils.ts](../../../../../packages/backend/test/utils.ts) の `role()`:

```ts
const myRole = await role(adminUser, { name: 'tester' }, { canCreateChannel: { useDefault: false, priority: 0, value: true } });
// admin/roles/create を叩く。policies 引数で個別ポリシーを上書き可能
```

モデレーター・管理者ロールが要るテストは事前に `signup({ ... })` + `role(...)` で作る。

### `createAppToken()` — アプリ scope 付きトークン

```ts
const token = await createAppToken(alice, ['write:notes', 'read:account']);
// token は文字列。api() の me.token として使うか、{ token, bearer: true } で渡せば Bearer Auth で叩く
```

OAuth scope (`kind`) のテストに使う。

### その他のヘルパー

[test/utils.ts](../../../../../packages/backend/test/utils.ts) には以下も用意されている:

- `userList()` — ユーザーリスト作成
- `page()` / `play()` — Page / Flash 作成
- `clip()` / `galleryPost()` / `channel()` — 各種リソース作成
- `react()` — リアクション
- `simpleGet()` — fetch ラッパ (raw HTTP)
- `testPaginationConsistency()` — ページネーション挙動の網羅検証
- `sendEnvUpdateRequest()` / `sendEnvResetRequest()` — テスト用環境変数の更新
- `connectStream()` / `waitFire()` — WebSocket (Streaming API)

詳細はソースを直接参照。

### 既存テスト例

- [test/e2e/note.ts](../../../../../packages/backend/test/e2e/note.ts) — `describe('Note', ...)` で多数の `test(...)` を並べる伝統的なスタイル
- [test/e2e/endpoints.ts](../../../../../packages/backend/test/e2e/endpoints.ts) — カテゴリ不問の雑多なエンドポイント
- [test/e2e/api.ts](../../../../../packages/backend/test/e2e/api.ts) — API レイヤ (認証・レート制限) の挙動

## ローカル DB / Redis

```bash
docker compose -f compose.local-db.yml up -d
```

backend テスト・開発の前提として、ローカルに PostgreSQL + Redis が立っている必要がある。CI もこれを起動してから走る。
