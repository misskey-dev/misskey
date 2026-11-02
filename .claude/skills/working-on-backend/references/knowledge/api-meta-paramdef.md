# API endpoint の meta / paramDef / res 完全早見表

[`IEndpointMeta`](../../../../../packages/backend/src/server/api/endpoints.ts) の全フィールドと AJV `paramDef` の実用パターン、それと PR レビューで頻発する落とし穴を 1 つにまとめたページ。新規 / 既存 endpoint 編集時に開く。

## 目次

- [全フィールド一覧](#全フィールド一覧)
- [権限制限フィールドの使い分け](#権限制限フィールドの使い分け)
- [`kind` の値](#kind-の値)
- [`errors` の書き方](#errors-の書き方)
- [`res` の書き方](#res-の書き方)
- [`paramDef` (AJV) 実用パターン](#paramdef-ajv-実用パターン)
- [OpenAPI への反映マップ](#openapi-への反映マップ)
- [落とし穴](#落とし穴)

## 全フィールド一覧

[endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の `IEndpointMetaBase` 型より。

| フィールド | 型 | デフォルト | 用途 |
|---|---|---|---|
| `stability` | `'deprecated' \| 'experimental' \| 'stable'` | (未指定) | 安定度のヒント。`'deprecated'` を付けた API は新規利用を避ける |
| `tags` | `ReadonlyArray<string>` | — | OpenAPI タグ。実質 `tags[0]` のみが反映される |
| `errors` | `Record<key, { message, code, id }>` | — | クライアントに返す業務エラー定義。各 `id` は UUID v4 で一意 |
| `res` | `Schema` (`@/misc/json-schema.js`) | — | レスポンス JSON Schema。`ref: 'Note'` のような packed entity 参照も可 |
| `requireCredential` | `boolean` | `false` | 認証必須か。`true` のとき `kind` を必ず設定する |
| `requireModerator` | `boolean` | `false` | isModerator ロール必須。`true` のとき `kind` 必須 |
| `requireAdmin` | `boolean` | `false` | isAdministrator ロール必須。`true` のとき `kind` 必須 |
| `requiredRolePolicy` | `KeyOf<'RolePolicies'>` | (未指定) | 特定のロールポリシー (例: `'canCreateChannel'`) を満たすロールを要求 |
| `prohibitMoved` | `boolean` | `false` | アカウント移行済ユーザーを拒否 (主に write 系で検討) |
| `limit` | `{ key?, duration?, max?, minInterval? }` | なし | レート制限。`duration` と `max` はセットで設定する |
| `requireFile` | `boolean` | `false` | multipart/form-data でファイル添付必須。`true` だと `exec` の `file` 引数が確実に渡る |
| `secure` | `boolean` | `false` | サードパーティアプリからは利用不可。OpenAPI に "Internal Endpoint" 表記が出る |
| `kind` | `(typeof permissions)[number]` | — | OAuth スコープ。`'read:account'` / `'write:notes'` 等。型は require* 系と相互排他制約あり ([endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の型ユニオン定義) |
| `description` | `string` | — | OpenAPI の operation description に入る |
| `allowGet` | `boolean` | `false` | GET メソッドを許可するか (デフォルトは POST のみ)。冪等な read 系で有用 |
| `cacheSec` | `number` | — | 正常応答に `Cache-Control: public, max-age=<秒>` を付与 |

## 権限制限フィールドの使い分け

[endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) で型ユニオンとして表現されており、組み合わせに制約がある:

| ケース | `requireCredential` | `requireModerator` | `requireAdmin` | `kind` |
|---|---|---|---|---|
| 認証不要 | `false` または省略 | (省略) | (省略) | 不要 |
| 一般ユーザー認証必須 | `true` | (省略) | (省略) | **必須** (`'read:account'` 等) |
| モデレーター以上必須 | (省略) | `true` | (省略) | **必須** (例: `'read:admin:show-user'`) |
| 管理者必須 | (省略) | (省略) | `true` | **必須** (例: `'write:admin:emoji'`) |
| Misskey 本体専用 (`secure: true`) | 任意 | 任意 | 任意 | **不要** (型 union で除外) |

**`secure: true` の例外**: [endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の `secure: true` union variant は他の require* と独立しており、`kind` を要求しない。実例: [auth/accept.ts](../../../../../packages/backend/src/server/api/endpoints/auth/accept.ts) (`secure: true + requireCredential: true` で `kind` なし)、[i/export-user-lists.ts](../../../../../packages/backend/src/server/api/endpoints/i/export-user-lists.ts) も同様。サードパーティアプリから叩けないので OAuth scope の必要がない。

加えて以下も使える:

- **`requiredRolePolicy: 'canCreateChannel'`** — 特定のロールポリシーが許可されているユーザーだけに絞る。**`requireCredential: true` 必須**: [ApiCallService.ts](../../../../../packages/backend/src/server/api/ApiCallService.ts) が `requiredRolePolicy` 分岐で `user!.id` を非null前提アクセスするため、匿名許可と組み合わせると TypeError で 500 になる。匿名も許したいなら、`meta` ではなく実行時に `RoleService.getUserPolicies(me ? me.id : null)` で判定する ([endpoints/notes/global-timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts) のパターン)。ポリシーの一覧は [`RolePolicies`](../../../../../packages/backend/src/core/RoleService.ts) を参照
- **`secure: true`** — Misskey 本体フロントエンドからしか叩けないようにする (OAuth トークンで叩けなくなる)。上記の通り `kind` は不要

## `kind` の値

完全な一覧は [`packages/misskey-js/src/consts.ts`](../../../../../packages/misskey-js/src/consts.ts) の `permissions` 配列。代表例:

| パターン | 例 |
|---|---|
| 一般 read | `'read:account'`, `'read:notifications'`, `'read:drive'`, `'read:reactions'` |
| 一般 write | `'write:account'`, `'write:notes'`, `'write:reactions'`, `'write:drive'` |
| Admin read | `'read:admin:meta'`, `'read:admin:server-info'`, `'read:admin:show-user'`, `'read:admin:user-ips'` |
| Admin write | `'write:admin:reset-password'`, `'write:admin:suspend-user'`, `'write:admin:emoji'`, `'write:admin:roles'` |

新しい操作領域を追加する場合は `consts.ts` の `permissions` 配列にも追加する必要がある。

## `errors` の書き方

```ts
errors: {
	noSuchNote: {                                            // ← キーは camelCase
		message: 'No such note.',                            // ← 英語ハードコード (バックエンドに i18n 機構なし)
		code: 'NO_SUCH_NOTE',                                // ← code は SCREAMING_SNAKE_CASE
		id: '17a0e0fa-3f3e-4f3e-9f3e-3f3e3f3e3f3e',          // ← UUID v4。リポジトリ内で一意
		httpStatusCode: 404,                                 // ← オプション。HTTP ステータスを上書き
		kind: 'client',                                      // ← オプション。'client' (デフォルト) / 'server' / 'permission'
	},
},
```

`httpStatusCode` と `kind` は [error.ts](../../../../../packages/backend/src/server/api/error.ts) の型 `E` 経由で受け付けられる。指定しないとデフォルト挙動 (クライアントエラーは 400 系) になる。

命名規則 (既存実装で一貫):

- キー: `camelCase` (`noSuchNote`, `cannotReRenote`, `alreadyBlocking`, `youHaveBeenBlocked`)
- `code`: `SCREAMING_SNAKE_CASE` (`'NO_SUCH_NOTE'`, `'CANNOT_RENOTE_TO_A_PURE_RENOTE'`)
- 接頭辞パターン: `NO_SUCH_*` / `CANNOT_*` / `ALREADY_*` / `TOO_MANY_*` / `INVALID_*` / `*_REQUIRED`

`throw new ApiError(meta.errors.noSuchNote, { reason: '詳細情報' })` の第 2 引数は `info` に入り、レスポンス JSON の `error.info` として返却される。

## `res` の書き方

JSON Schema または packed entity への参照:

```ts
// 単純なオブジェクト
res: {
	type: 'object',
	optional: false, nullable: false,
	properties: {
		count: { type: 'integer' },
	},
},

// packed entity 参照
res: {
	type: 'object',
	optional: false, nullable: false,
	ref: 'Note',                  // ← packages/backend/src/models/json-schema/*.ts の定義名
},

// 配列
res: {
	type: 'array',
	optional: false, nullable: false,
	items: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Note',
	},
},
```

各プロパティに `optional: false, nullable: false` を **必ず明示する**。省略すると schema が緩くなり、生成される misskey-js 型も曖昧になる。

## `paramDef` (AJV) 実用パターン

`paramDef` は AJV (`new Ajv({ useDefaults: true })`) でコンパイルされた JSON Schema 7 互換のスキーマ。詳細は [endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) の AJV 初期化を参照。

### カスタム format

**`format: 'misskey:id'`** だけが Misskey 独自 ([endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) の `addFormat`):

```ts
ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
```

その他 (`'date-time'`, `'email'`, `'url'` 等) は JSON Schema 標準。AJV はデフォルトでは format 検証を行わないが、Misskey の AJV 設定ではフォーマット名はバリデーションエラーを出さず通過する程度の動作になっている (ID パターンのみ実際に正規表現検証される)。

### 基本パターン

```ts
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },         // 必須 ID
		text: { type: 'string', minLength: 1, maxLength: 500 },   // 文字長制約
		count: { type: 'integer', minimum: 0, maximum: 100, default: 10 },
		isPublic: { type: 'boolean', default: false },
		visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'] },
	},
	required: ['noteId'],
} as const;
```

`as const` を必ず付ける。これで `SchemaType<typeof paramDef>` が型推論される。

### ページネーション (sinceId / untilId / limit)

[notes/timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/timeline.ts):

```ts
properties: {
	limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	sinceId: { type: 'string', format: 'misskey:id' },
	untilId: { type: 'string', format: 'misskey:id' },
	sinceDate: { type: 'integer' },
	untilDate: { type: 'integer' },
},
```

`QueryService.makePaginationQuery(qb, ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)` で TypeORM クエリビルダに反映する。

### 配列とアイテム制約

```ts
properties: {
	// 一意・最小1・最大100 個のID リスト
	noteIds: {
		type: 'array',
		uniqueItems: true,
		minItems: 1,
		maxItems: 100,
		items: { type: 'string', format: 'misskey:id' },
	},
},
```

実例: [notes/show-partial-bulk.ts](../../../../../packages/backend/src/server/api/endpoints/notes/show-partial-bulk.ts) (`noteIds`), [notes/drafts/create.ts](../../../../../packages/backend/src/server/api/endpoints/notes/drafts/create.ts) (`fileIds` / `visibleUserIds` は `uniqueItems` 付き)

### `oneOf` / `anyOf` (排他的選択)

複数のリクエストパラメータ形態を許す場合:

```ts
properties: {
	userId: { type: 'string', format: 'misskey:id' },
	username: { type: 'string' },
	host: { type: 'string', nullable: true },
},
anyOf: [
	{ required: ['userId'] },
	{ required: ['username'] },
],
```

`res` 側でも `oneOf` を使ってバリアントレスポンスを表現できる ([ap/show.ts](../../../../../packages/backend/src/server/api/endpoints/ap/show.ts) の `res`):

```ts
res: {
	optional: false, nullable: false,
	oneOf: [
		{ type: 'object', properties: { type: { enum: ['User'] }, object: { ref: 'UserDetailedNotMe' } } },
		{ type: 'object', properties: { type: { enum: ['Note'] }, object: { ref: 'Note' } } },
	],
},
```

### `additionalProperties` (動的キー)

固定の `properties` ではなく「任意のキー → 値の型」を表すとき:

```ts
data: {
	type: 'object',
	additionalProperties: {
		anyOf: [{ type: 'number' }],
	},
},
```

実例: [retention.ts](../../../../../packages/backend/src/server/api/endpoints/retention.ts), [admin/get-table-stats.ts](../../../../../packages/backend/src/server/api/endpoints/admin/get-table-stats.ts)

`type: 'object', additionalProperties: true` だと「任意の中身を受け入れる」(検証なし) になる。

### `default` (値補完)

AJV を `useDefaults: true` で構築しているため、`default` を書くとリクエストに値が無い場合に自動で埋まる:

```ts
properties: {
	includeMyRenotes: { type: 'boolean', default: true },
},
```

クライアントの省略を吸収できるため、後方互換変更で重宝する。

### nullable プロパティ

```ts
properties: {
	parentId: { type: 'string', format: 'misskey:id', nullable: true },
},
```

`nullable: true` を付けると `null` を明示的に受け付ける。

## OpenAPI への反映マップ

[gen-spec.ts](../../../../../packages/backend/src/server/api/openapi/gen-spec.ts) より:

| meta フィールド | OpenAPI への反映 |
|---|---|
| `description` | operation description (先頭) |
| `secure: true` | description に "**Internal Endpoint**: ..." の警告 |
| `requireCredential: true` | description に "**Credential required**: *Yes*" + `security: [bearerAuth]` |
| `kind` | description に "**Permission**: *<kind>*" |
| `tags[0]` | operation tag (実質 1 個目のみ) |
| `requireFile: true` | requestBody が `multipart/form-data` になり `file: { type: 'string', format: 'binary' }` が追加される |
| `errors` | examples (operation の `responses` 配下) |
| `res` | response body schema |
| `limit` | `429 Too many requests` レスポンスが `responses` に追加される |
| `allowGet` | 同一 path に `get` operation が追加される (POST と両方が生える) |

**OpenAPI に反映されない (内部のみ)**: `requireModerator` / `requireAdmin` / `requiredRolePolicy` / `prohibitMoved` / `cacheSec` / `stability`。

## 落とし穴

PR レビューで頻発するミスを「**症状 → 原因 → 修正**」で集めた。

### 1. エンドポイントが 404 になる

- **症状**: 開発サーバーで叩くと `{"error": {"code": "UNKNOWN_API_ENDPOINT", ...}}` (GET の catch-all 経由)、または素の 404 (POST など)
- **原因**: [endpoint-list.ts](../../../../../packages/backend/src/server/api/endpoint-list.ts) への登録漏れ。エンドポイントは glob 自動収集されない
- **修正**: → [knowledge/endpoint-list.md](endpoint-list.md)

### 2. CI `check-misskey-js-autogen` で落ちる

- **症状**: PR に `Please regenerate misskey-js` のコメント
- **原因**: `meta` / `paramDef` / `res` を変えたのに misskey-js の自動生成物を再生成していない
- **修正**: → [shipping-misskey-change/references/tasks/regenerate-misskey-js.md](../../../shipping-misskey-change/references/tasks/regenerate-misskey-js.md)

### 3. CI `spdx` ジョブで落ちる

- **症状**: `SPDX header missing` のメッセージ
- **原因**: 新規 `.ts` ファイルに SPDX ヘッダーが無い
- **修正**: ファイル冒頭に SPDX を貼る。注: `packages/misskey-js/` 配下は MIT 別ライセンスなので SPDX 不要

### 4. クライアントが 500 + error 型不在 を受け取る

- **症状**: フロントエンド側で `result.error.code` を分岐したいが、misskey-js の型に出てこない。レスポンスは 500
- **原因**: `meta.errors` に列挙していないエラーを `throw new ApiError({...})` または `throw new Error(...)` した
- **修正**: 業務エラーは必ず `meta.errors` に登録してから `throw new ApiError(meta.errors.<key>)`
- **逆方向の罠**: 「想定外バグまで全部 `ApiError` で包む」のもダメ。`endpoints/notes/create.ts` の `catch` 節末尾の `throw err;` が手本

### 5. `me.id` で `Cannot read properties of null`

- **症状**: 認証なしリクエストで TypeError
- **原因**: `requireCredential: false` のとき `me` は `MiLocalUser | null` なのに null チェックなしで `me.id` を使った
- **修正**: null チェックを入れるか、認証必須なら `requireCredential: true` に変更

### 6. UUID が他エンドポイントと衝突

- **症状**: `errors.id` を再利用してしまうと misskey-js 側で型が混線
- **原因**: UUID をハードコードして再利用
- **修正**: 衝突確認

  ```bash
  grep -r "id: '<生成した UUID>'" packages/backend/src/server/api/endpoints/
  ```

  新規生成は `node -e "console.log(crypto.randomUUID())"`

### 7. `paramDef` に `policies` を書く

- **症状**: 「`gtlAvailable: true` を payload で渡してください」のような不自然な API になっている / クライアントが指定したらバイパスできる
- **原因**: ロールポリシーは **動的に取得するもの**
- **修正**: paramDef からは外し、`exec` 内で `RoleService.getUserPolicies(me?.id)` を呼んで判定する

### 8. エラーメッセージを日本語で書く

- **症状**: `message: 'ノートが見つかりません'` のような日本語が i18n されずクライアントに渡る
- **原因**: バックエンドに i18n 機構が無い
- **修正**: `message` は英語ハードコードに統一。フロントエンドは `error.id` (UUID) または `error.code` をキーに自前で localize する

### 9. `as const` を忘れる

- **症状**: `Endpoint<typeof meta, typeof paramDef>` の型推論が壊れて `ps` の型が `any` になる
- **修正**: `export const meta = { ... } as const;` と `export const paramDef = { ... } as const;` を必ず付ける

### 10. `requireCredential: true` なのに `kind` を書き忘れる

- **症状**: TypeScript の型エラー (`Property 'kind' is missing`)
- **原因**: [endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) のユニオン制約で `kind` が型レベルで必須
- **修正**: 適切な OAuth スコープを `kind` に設定する
- **例外**: `secure: true` (Misskey 本体専用) のエンドポイントは [endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の別 union variant 扱いで `kind` 不要

### 11. `requireFile: true` の cleanup を呼び忘れて一時ファイルが残る

- **症状**: アップロード後にエンドポイントが正常終了/例外終了しても OS の一時ディレクトリにファイルが残り続け、ディスクが埋まる
- **原因**: [endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) が `cleanup` を自動で呼ぶのは **AJV バリデーション失敗時のみ**
- **修正**: `try { ... } finally { cleanup!(); }` で囲む ([drive/files/create.ts](../../../../../packages/backend/src/server/api/endpoints/drive/files/create.ts) の `finally { cleanup!(); }` が手本)

### 12. `requiredRolePolicy` だけで匿名許可してしまう

- **症状**: API を匿名で叩くと 500 + `TypeError: Cannot read properties of null (reading 'id')`
- **原因**: [ApiCallService.ts](../../../../../packages/backend/src/server/api/ApiCallService.ts) が `requiredRolePolicy` ありのエンドポイントで `user!.id` を非null前提でアクセス
- **修正**: 静的に必須ポリシーを宣言するなら `requireCredential: true` と必ず併用する。匿名ユーザーにも違うポリシーセットを適用したいなら、実行時に `RoleService.getUserPolicies(me ? me.id : null)` で判定 ([notes/global-timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts) パターン)

### 13. e2e テストが起動しない

- **症状**: `pnpm --filter backend test:e2e` 実行直後にこける / DB 接続エラー
- **原因**: `.config/test.yml` が無い
- **修正**: → [knowledge/backend-testing.md §前提](backend-testing.md)
