# API endpoint の meta / paramDef / res 完全早見表

[`IEndpointMeta`](../../../../../packages/backend/src/server/api/endpoints.ts) の全フィールドと [Valibot](https://valibot.dev/) `paramDef` / `res` の実用パターン、それと PR レビューで頻発する落とし穴を 1 つにまとめたページ。新規 / 既存 endpoint 編集時に開く。

**スキーマは Valibot に統一されている**。既存スキーマの書き換え規則・ヘルパーの網羅表は [valibot-cookbook.md](valibot-cookbook.md) を参照。本ページは「新しく endpoint を書くとき手元に置く早見表」。

## 目次

- [全フィールド一覧](#全フィールド一覧)
- [権限制限フィールドの使い分け](#権限制限フィールドの使い分け)
- [`kind` の値](#kind-の値)
- [`errors` の書き方](#errors-の書き方)
- [`res` の書き方](#res-の書き方)
- [`paramDef` (Valibot) 実用パターン](#paramdef-valibot-実用パターン)
- [型の導出](#型の導出)
- [OpenAPI への反映マップ](#openapi-への反映マップ)
- [落とし穴](#落とし穴)

## 全フィールド一覧

[endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の `IEndpointMetaBase` 型より。

| フィールド | 型 | デフォルト | 用途 |
|---|---|---|---|
| `stability` | `'deprecated' \| 'experimental' \| 'stable'` | (未指定) | 安定度のヒント。`'deprecated'` を付けた API は新規利用を避ける |
| `tags` | `ReadonlyArray<string>` | — | OpenAPI タグ。実質 `tags[0]` のみが反映される |
| `errors` | `Record<key, { message, code, id }>` | — | クライアントに返す業務エラー定義。各 `id` は UUID v4 で一意 |
| `res` | `AnyValibotSchema` (`@/misc/schema/index.js`) | — | レスポンススキーマ。packed entity のスキーマ (`packedNoteSchema` 等) を直接 import して置ける |
| `requireCredential` | `boolean` | `false` | 認証必須か。`true` のとき `kind` を必ず設定する |
| `requireModerator` | `boolean` | `false` | isModerator ロール必須。`true` のとき `kind` 必須 |
| `requireAdmin` | `boolean` | `false` | isAdministrator ロール必須。`true` のとき `kind` 必須 |
| `requiredRolePolicy` | `keyof PackedRolePolicies & string` | (未指定) | 特定のロールポリシー (例: `'canCreateChannel'`) を満たすロールを要求 |
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

`res` には Valibot スキーマをそのまま書く。packed entity は **スキーマを直接 import** する (定義ジャンプ・補完が効く)。OpenAPI 生成時はスキーマオブジェクトの同一性 (`defineEntity()` 登録の逆引き) で `#/components/schemas/X` の `$ref` に復元されるので、コード上は直接 import・spec 上は `$ref` が両立する。

```ts
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedNoteSchema } from '@/models/schema/note.js';

// 単純なオブジェクト
res: v.object({
	count: mi.integer(),
}),

// packed entity 参照 (packages/backend/src/models/schema/*.ts のスキーマを直接 import)
res: packedNoteSchema,

// 配列
res: v.array(packedNoteSchema),

// 空レスポンス (204) もありうる場合は optional / nullable で包む
res: v.optional(packedNoteSchema),
```

**required の導出**: `v.optional()` / `v.nullish()` で包まれていない entries が `required` に載る。旧 JSON Schema の `optional: false, nullable: false` を毎回書いていた作法は不要で、**包まない = required** が既定。

**`res` はランタイム検証されない** (型付けと OpenAPI 生成のためだけに使う)。ハンドラの戻り値の型が `v.InferOutput<typeof meta.res>` に一致することは TypeScript が保証する。

## `paramDef` (Valibot) 実用パターン

`paramDef` は Valibot スキーマ。[endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) が `v.safeParse()` で検証し、**default 適用済みの新しいオブジェクト**をハンドラに渡す (入力オブジェクトは書き換えない)。検証に失敗すると `INVALID_PARAM` (`info.details` に dot-path 付きの issue 一覧) で reject する。

ヘルパーは `import * as mi from '@/misc/schema/index.js';`、素の Valibot は `import * as v from 'valibot';` で使う。

### 基本パターン

```ts
export const paramDef = v.object({
	noteId: mi.misskeyId(),                                             // 必須 ID
	text: v.optional(v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(500))),
	count: mi.integer({ min: 0, max: 100 }),
	isPublic: v.optional(v.boolean(), false),                           // default 付き
	visibility: v.optional(v.picklist(['public', 'home', 'followers', 'specified'])),
});
```

`as const` は**不要** (型は Valibot が推論する)。パラメータ無しの endpoint は `v.object({})`。

### optional / nullable / default

| 意味 | 書き方 |
|---|---|
| 必須 | 素のスキーマ (`mi.misskeyId()`) |
| 省略可 | `v.optional(x)` |
| `null` 可 | `v.nullable(x)` |
| 省略可 かつ `null` 可 | `v.nullish(x)` |
| 省略時に default | `v.optional(x, d)` |
| `null` 可 + default | `v.optional(v.nullable(x), d)` — **`v.nullish(x, d)` は不可** (明示的に送られた `null` まで `d` に上書きしてしまう) |

### 文字列長は必ず `mi.minCodePoints` / `mi.maxCodePoints`

素の `v.minLength` / `v.maxLength` を**文字列に使ってはいけない**。Valibot の `minLength`/`maxLength` は UTF-16 コードユニット数で数えるため、サロゲートペア (絵文字など) で境界値の意味が変わる。**配列の要素数**には `v.minLength` / `v.maxLength` をそのまま使ってよい。

```ts
text: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(500)),
```

### ページネーション (sinceId / untilId / limit)

```ts
export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),   // limit → sinceId → untilId の順で展開
	...mi.paginationDateEntries(),                        // sinceDate / untilDate が要るときだけ
});
```

`QueryService.makePaginationQuery(qb, ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)` で TypeORM クエリビルダに反映する。

**プロパティの宣言順は api.json の出力順そのもの**なので、既存 endpoint を触るときは順序を保つこと (`limit` が末尾に来ているファイルなどではヘルパーを使わず個別に書く)。

### 配列とアイテム制約

```ts
noteIds: v.pipe(
	v.array(mi.misskeyId()),
	mi.uniqueArray(),      // uniqueItems: true 相当 (プリミティブ要素専用)
	v.minLength(1),
	v.maxLength(100),
),
```

実例: [notes/show-partial-bulk.ts](../../../../../packages/backend/src/server/api/endpoints/notes/show-partial-bulk.ts), [notes/drafts/create.ts](../../../../../packages/backend/src/server/api/endpoints/notes/drafts/create.ts)

### 排他的選択 (どれか 1 つのパラメータ形態)

トップレベルを `v.union` にし、**共通プロパティは各分岐へ分配して書く**:

```ts
const commonEntries = { host: v.nullish(v.string()) };

export const paramDef = v.union([
	v.object({ userId: mi.misskeyId(), ...commonEntries }),
	v.object({ username: v.string(), ...commonEntries }),
]);
```

実例: [users/show.ts](../../../../../packages/backend/src/server/api/endpoints/users/show.ts), [users/following.ts](../../../../../packages/backend/src/server/api/endpoints/users/following.ts)

`res` 側でバリアントを表すときは、判別キーがあれば `v.variant('type', [...])`、無ければ `v.pipe(v.union([...]), mi.asOneOf())` ([ap/show.ts](../../../../../packages/backend/src/server/api/endpoints/ap/show.ts))。

### 動的キー (旧 `additionalProperties`)

| 旧 JSON Schema | Valibot |
|---|---|
| `additionalProperties: <Schema>` | `v.record(v.string(), <値のスキーマ>)` |
| `additionalProperties: true` (無検証・spec に明示) | `mi.anyRecord()` |
| `properties` 無しの `object` (無検証・spec に出さない) | `mi.anyObject()` |
| `properties` と `additionalProperties` の併用 | `v.objectWithRest({...}, <値のスキーマ>)` |
| `additionalProperties: false` | `v.strictObject({...})` |

実例: [retention.ts](../../../../../packages/backend/src/server/api/endpoints/retention.ts), [admin/get-table-stats.ts](../../../../../packages/backend/src/server/api/endpoints/admin/get-table-stats.ts)

### 未知キーの扱い (要注意)

`v.object()` は **スキーマに無いキーを parse 結果から取り除く**。`ps` をそのまま DB や他サービスへ渡している / `Object.keys(ps)` やスプレッドで動的に扱っている endpoint では、素通しが要るなら `v.objectWithRest({...}, v.any())` を使う。

### よく使うヘルパー

| ヘルパー | 用途 |
|---|---|
| `mi.misskeyId()` | Misskey ID (`format: 'misskey:id'` + 正規表現検証) |
| `mi.integer({ min?, max? })` | 整数 |
| `mi.limit({ max, def? })` | ページネーションの `limit` 単体 |
| `mi.paginationEntries({ max, default })` / `mi.paginationDateEntries()` | ページネーション断片 |
| `mi.minCodePoints(n)` / `mi.maxCodePoints(n)` | 文字列長 (コードポイント数) |
| `mi.uniqueArray()` | 配列要素の一意性 |
| `mi.nullableEnum([null, 'a', 'b'])` | `null` を含む enum |
| `mi.idString()` / `mi.dateTimeString()` / `mi.urlString()` | res 側の `format` 注釈 (検証なし) |
| `mi.example(schema, value)` / `mi.format(x)` / `mi.deprecated()` / `mi.openApi({...})` | OpenAPI メタデータ |

全一覧とシグネチャは [valibot-cookbook.md のヘルパー一覧](valibot-cookbook.md#ヘルパー一覧-miscschemaindexjs-の公開-api) を参照。

## 型の導出

| 欲しいもの | 書き方 |
|---|---|
| ハンドラが受け取る型 (`ps`) | `v.InferOutput<typeof paramDef>` (自動で付くので通常は書かない) |
| クライアントが送ってよい型 | `v.InferInput<typeof paramDef>` |
| レスポンスの型 | `v.InferOutput<typeof meta.res>` |
| packed entity の型 | `import type { PackedNote } from '@/models/schema/note.js';` (**直接 import**) |

`Packed<'Note'>` / `KeyOf<'RolePolicies'>` / `SchemaType<...>` / `Schema` はすべて撤去済み。新規に書かないこと。

**default 付きキーは入力型では省略可・出力型では必須**になる (`v.optional(x, d)`)。

## 検証コマンド

`paramDef` / `res` / entity スキーマを触ったら以下を通す:

```sh
pnpm --filter backend typecheck

# API 契約が変わっていないことの確認 (リファクタリング時は差分ゼロが必須)
pnpm --filter backend build
pnpm --filter backend generate-api-json --no-build
node packages/backend/scripts/diff-api-json.mjs --baseline <事前に取ったベースライン>

# 意図的に API を変えた場合は misskey-js を再生成して同じコミットに含める
pnpm build-misskey-js-with-types
```

ベースラインは変更前に `node packages/backend/scripts/diff-api-json.mjs --snapshot --out <path>` で取得しておく。

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

### 9. `meta` の `as const` を忘れる

- **症状**: `Endpoint<typeof meta, typeof paramDef>` の型推論が壊れる (`requireCredential: true` の narrowing が効かず `me` が `MiLocalUser | null` になる等)
- **修正**: `export const meta = { ... } as const;` を必ず付ける
- **注**: `paramDef` 側に `as const` は**不要** (Valibot が型を推論する)。付けるとむしろノイズなので書かない

### 10. `requireCredential: true` なのに `kind` を書き忘れる

- **症状**: TypeScript の型エラー (`Property 'kind' is missing`)
- **原因**: [endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) のユニオン制約で `kind` が型レベルで必須
- **修正**: 適切な OAuth スコープを `kind` に設定する
- **例外**: `secure: true` (Misskey 本体専用) のエンドポイントは [endpoints.ts](../../../../../packages/backend/src/server/api/endpoints.ts) の別 union variant 扱いで `kind` 不要

### 11. `requireFile: true` の cleanup を呼び忘れて一時ファイルが残る

- **症状**: アップロード後にエンドポイントが正常終了/例外終了しても OS の一時ディレクトリにファイルが残り続け、ディスクが埋まる
- **原因**: [endpoint-base.ts](../../../../../packages/backend/src/server/api/endpoint-base.ts) が `cleanup` を自動で呼ぶのは **paramDef の検証失敗時のみ**
- **修正**: `try { ... } finally { cleanup!(); }` で囲む ([drive/files/create.ts](../../../../../packages/backend/src/server/api/endpoints/drive/files/create.ts) の `finally { cleanup!(); }` が手本)

### 12. `requiredRolePolicy` だけで匿名許可してしまう

- **症状**: API を匿名で叩くと 500 + `TypeError: Cannot read properties of null (reading 'id')`
- **原因**: [ApiCallService.ts](../../../../../packages/backend/src/server/api/ApiCallService.ts) が `requiredRolePolicy` ありのエンドポイントで `user!.id` を非null前提でアクセス
- **修正**: 静的に必須ポリシーを宣言するなら `requireCredential: true` と必ず併用する。匿名ユーザーにも違うポリシーセットを適用したいなら、実行時に `RoleService.getUserPolicies(me ? me.id : null)` で判定 ([notes/global-timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts) パターン)

### 13. e2e テストが起動しない

- **症状**: `pnpm --filter backend test:e2e` 実行直後にこける / DB 接続エラー
- **原因**: `.config/test.yml` が無い
- **修正**: → [knowledge/backend-testing.md §前提](backend-testing.md)
