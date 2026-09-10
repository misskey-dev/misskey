# Valibot スキーマ規約 (旧: AJV/json-schema → Valibot 変換 Cookbook)

> **移行は完了している。** `packages/backend/` の `paramDef` / entity (`packed*Schema`) はすべて [Valibot](https://valibot.dev/) 化され、AJV と独自 json-schema 基盤 (`Schema` / `SchemaType` / `refs` / `Packed<>` / `KeyOf<>` / `entityRef()`、および `ajv` パッケージ依存) は撤去済み。
>
> **本文書は今後の新規エンドポイント / entity 作成の規約集として参照する。** 「before (json-schema)」の記述は、旧コードを読むときの対応表と「なぜこの書き方が正なのか」の根拠として残している。新規に書くときは各規則の "after" 側だけを見ればよい。
>
> - 新規 endpoint を書くときの早見表 → [api-meta-paramdef.md](api-meta-paramdef.md)
> - ヘルパーの網羅表 → [ヘルパー一覧](#ヘルパー一覧-miscschemaindexjs-の公開-api)

この文書の規則番号 (R1〜R16) は、スキーマの書き方についてレビュー・議論するときの共通の参照点として使う。

## 目的と前提

- スキーマには 2 つの世界がある: **paramDef 世界** (`server/api/endpoints/**/*.ts` の `export const paramDef`。リクエストの検証とハンドラ引数 `ps` の型付け) と **entity 世界** (`models/schema/*.ts` の `packed*Schema`。レスポンスの型定義と OpenAPI 生成)。旧 json-schema 時代は前者が `required` 配列、後者がプロパティ単位の `optional` / `nullable` フラグとオプショナルの表現方法が違ったが、**Valibot ではどちらも同じ 4 象限 (R3) に帰着する**。
- 旧構成では両者が `Schema` 型 (`@/misc/json-schema.js`) を共有し AJV で検証していた。この基盤は撤去済みで、現在は `Endpoint` 基底クラス / `gen-spec.ts` とも Valibot スキーマのみを受け付ける。
- ヘルパーは `@/misc/schema/index.js` から `import * as mi from '@/misc/schema/index.js';` で使う。**このヘルパー層は実装中**であり、関数名・シグネチャは本文書が正 (source of truth)。実装時に本文書と食い違うヘルパーを見つけたら、本文書に合わせて実装を直すか、本文書側の更新を提案すること (どちらを直すかは PR で明示する)。
- 生の `v.*` (valibot 本体) は `import * as v from 'valibot';` で使う。
- **大原則**: この文書がカバーしていない構造・パターンに出くわしたら、**無理にひねり出した書き方をしない**。既存スキーマの書き換えなら「検証の意味を変える」リスクの方が大きいので手を止めて相談する。新規スキーマなら、既存の類似 endpoint がどう書いているかを先に確認する。

---

## R1. プリミティブ型

| json-schema | valibot |
|---|---|
| `{ type: 'string' }` | `v.string()` |
| `{ type: 'number' }` | `v.number()` |
| `{ type: 'integer' }` | `mi.integer()` |
| `{ type: 'boolean' }` | `v.boolean()` |
| `{ type: 'null' }` | `v.null()` |
| `type` 無し、または `type: 'any'` | `v.any()` (**理由コメント必須**、下記参照) |
| `properties` 無しの `object` | `mi.anyObject()` |
| `items` 無しの `array` | `mi.anyArray()` |

`v.any()` を使う箇所には、なぜ検証を諦めているかを 1 行コメントで残す:

```ts
// json-schema 側も type 未指定で無検証だったため、意味を変えないよう v.any() を維持
value: v.any(),
```

`mi.integer()` は `v.pipe(v.number(), v.integer())`相当 (AJV の `integer` は「数値かつ整数」であって文字列ではない点に注意)。

**例外: 生成元が `any` に依存している `properties` 無し object** — legacy の `{ type: 'object' }` (properties 無し) の TS 型は `SchemaType` 上 **`any` に潰れていた**ため、`mi.anyObject()` (= `Record<string, any>`) に置き換えると生成元 (entity service など) の代入がコンパイルエラーになることがある (例: `models/schema/queue.ts` の `packedQueueJobSchema.progress` に `QueueService` が bullmq の `JobProgress` = `string | boolean | number | object` を代入している)。この場合だけ **型は `any` のまま api.json 出力だけ合わせる**:

```ts
// 型は legacy と同じ any、api.json 上は { type: 'object' }
progress: v.pipe(v.any(), mi.openApi({ type: 'object' })),
```

`v.any()` を使う以上、**なぜ `mi.anyObject()` ではないのか (どの生成元がどの型を代入するのか) をコメントで必ず残す**。

`mi.anyObject()` (= `v.record(v.string(), v.any())`) / `mi.anyArray()` (= `v.array(v.any())`) は、素の `v.record(v.string(), v.any())` / `v.array(v.any())` と**ランタイム的には同一**で、必ず使わなければ壊れるわけではない (`openapi.ts` の変換は値/要素が `v.any()`/`v.unknown()` であることを直接検出して `additionalProperties`/`items` の出力を自動的に省く。マーカーで出力を止めているのではなく、型そのもので判定している)。それでも cookbook としては**必ず `mi.anyObject()`/`mi.anyArray()` を使う** — 「`properties`/`items` 無し」という同じイディオムを機械的に検索・監査できるようにするため、および `v.record(v.string(), v.any())` を見た次のレビュアが「意図的に無検証にした」のか「書き漏らし」なのか判断に迷わないようにするため。

---

## R2. `format: 'misskey:id'`

```ts
// before
{ type: 'string', format: 'misskey:id' }

// after
mi.misskeyId()
```

`mi.misskeyId()` は内部で `v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/))` 相当を一元管理する ([`ajv.addFormat('misskey:id', ...)`](../../../../../packages/backend/src/server/api/endpoint-base.ts) と同一の正規表現)。ID フォーマットの正規表現をここ以外で再実装しないこと。

`paramDef` 内で `misskey:id` 以外の `format` (例: 独自の `email` 相当など、標準外の format) が出てきたら**エスカレーション**して次へ進む — 未対応 format を無検証の `v.string()` に落とすと検証の意味が変わる。

---

## R3. optional / nullable の 4 象限

`Schema` は `optional` / `nullable` の 2 フラグの組み合わせで 4 パターンある:

| optional | nullable | valibot |
|---|---|---|
| `false` (または `required` 配列に含まれる) | `false` | 素の `x` (ラップしない) |
| `true` | `false` | `v.optional(x)` |
| `false` | `true` | `v.nullable(x)` |
| `true` | `true` | `v.nullish(x)` |

**paramDef 世界**では `required: [...]` 配列でオプショナルを表現する (プロパティ自体には `optional` フラグを書かない)。**entity 世界**ではプロパティごとに `optional: boolean, nullable: boolean` フラグを直接書く。入口の書き方は違うが、着地する valibot 表現は同じ 4 パターンに帰着する。

```ts
// entity 世界 (models/json-schema/user.ts 相当)
// before
name: { type: 'string', nullable: true, optional: false, example: '藍' },
// after
name: v.nullable(v.string()),

// paramDef 世界 (required 配列でoptional判定)
// before
{ properties: { cw: { type: 'string', nullable: true, minLength: 1, maxLength: 100 } } }
// (cw は required に含まれない = optional: true)
// after
cw: v.optional(v.nullable(v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100)))),
```

**`v.exactOptional` は使わない** (valibot 1.x の `exactOptional` は「キー自体が存在しない」ことを要求する厳密版で、AJV 側にそこまで厳密な区別が無いため意味が変わる)。

**optional + nullable の表記揺れについて**: `v.nullish(x)` と `v.optional(v.nullable(x))` は検証・型・OpenAPI 出力すべて等価。**default 無しなら `v.nullish(x)` を正とする** (簡潔なため)。default 付きは R4 のとおり必ず `v.optional(v.nullable(x), d)` (nullish に default を渡すのは禁止)。既に nested 形で書かれている箇所をわざわざ直す必要はない。

**トップレベル `res` の `optional: true`** (レスポンスが 204 になり得るエンドポイント、例: `notes/translate.ts`): res スキーマ全体を `v.optional(...)` で包む。`resAllowsEmpty()` がこれを見て OpenAPI に 200+204 の両方を出す (`nullable: true` なら `v.nullable(...)`)。

**インライン res オブジェクトの required 導出**: res 側は「`optional` フラグが無い/false のプロパティ = required」として api.json に出る (legacy コンバータの `!optional` 導出)。valibot 側も同じで「`v.optional`/`v.nullish` で包まれていない entries = required」。entity 世界の `optional: false, nullable: false` 明記に慣れていると、インライン res の**フラグ無しプロパティを optional と誤読しやすい**ので注意 (フラグ無し = required)。

**res ブロック内の手書き `required` 配列は罠**: たまに res のインライン object に paramDef 流の `required: [...]` 配列が書かれているが (実例: `admin/roles/users.ts`)、legacy コンバータは **res モードでは手書き `required` を無視して `optional` フラグから導出し直す**。したがって変換の正は「api.json (baseline) の required」= フラグ導出の結果であり、手書き配列ではない。手書き `required` に無いプロパティでも `optional: true` が付いていなければ **required として変換する** (迷ったら baseline の該当パスを `jq` で確認)。

---

## R4. `default`

```ts
// before
{ type: 'boolean', default: false }
// after
v.optional(v.boolean(), false)

// nullable併用 (null を含む enum は R5 の mi.nullableEnum() を使う)
// before
{ type: 'string', nullable: true, enum: [null, 'a', 'b'], default: null }
// after
v.optional(mi.nullableEnum([null, 'a', 'b']), null)
```

**`v.nullish(x, d)` は不可。** `v.nullish` は「キー欠落」と「値が `null`」の両方を `d` に丸めるが、AJV の `useDefaults: true` は**キー欠落時のみ**デフォルト値を補完し、送信された `null` はそのまま `null` として素通しする (`nullable: true` があるので validation は通る)。`v.nullish(x, d)` を使うと明示的に送られた `null` まで `d` に上書きしてしまい、検証の意味が変わる。nullable と default を両方満たすには必ず `v.optional(v.nullable(x), d)` の順で組む。

default 値は一字一句コピーする (丸めたり型を変えない)。オブジェクト/配列 literal の default も同様にそのままコピーする。

**entity 世界の `optional: false` + `default` は `v.optional()` で包まない。** entity 世界では `required` を `optional` フラグから導出する (`convertSchemaToOpenApiSchema` の `!v.optional`) ので、`optional: false, default: X` は「**required のまま `default` も出す**」という意味になる。これを `v.optional(x, X)` に変換すると `allowsAbsent()` が true になって required から落ち、api.json が差分になる。`mi.openApi({ default: X })` で `default` キーワードだけを足すこと:

```ts
// before (models/json-schema/meta.ts / user.ts の MeDetailedOnly 等)
{ type: 'string', optional: false, nullable: true, default: 'https://github.com/misskey-dev/misskey' }
// after
v.pipe(v.nullable(v.string()), mi.openApi({ default: 'https://github.com/misskey-dev/misskey' }))
```

`optional: true` + `default` (例: `meta.ts` の `features.miauth`) は通常どおり `v.optional(x, d)` でよい (legacy 側も required に載らない)。

**paramDef 世界で `required` 配列と `default` が同居しているプロパティ** (実例: `i/registry/*.ts` の `scope`): legacy の実挙動は「AJV useDefaults が required チェック前に default を埋めるため、クライアントは省略できる」— つまり api.json の `required` 表記は実態と乖離した嘘。該当の 7 ファイルは `v.optional(x, d)` に変換済みで、`required` から落ちる api.json 差分は「spec を実態に合わせる意図的改善」として allowlist 化済み。**新規に `required` かつ `default` を両立させようとしない** (Valibot では `v.optional(x, d)` = 省略可 + default が唯一の正しい表現)。

**paramDef 世界の any 潰れ顕在化** (実例: `i/2fa/key-done.ts` の `credential: { type: 'object' }`): スキーマは `mi.anyObject()` が正 (api.json 一致) だが、結果の `Record<string, any>` 型は legacy の `any` より狭く、厳密型を要求する下流 API (`WebAuthnService` 等) に渡す箇所でハンドラ側のキャスト (`ps.credential as RegistrationResponseJSON` + 理由コメント) が必要になることがある。スキーマ側を `v.any()` に緩めるのではなくハンドラ側キャストで対処する (ランタイム不変)。

---

## R5. enum

```ts
// before
{ type: 'string', enum: ['public', 'home', 'followers', 'specified'] }
// after
v.picklist(['public', 'home', 'followers', 'specified'])
```

既存の `as const` 配列 (例: `notificationTypes`, `permissions` 等の定数配列) を import 済みなら spread で流用してよい:

```ts
v.picklist([...notificationTypes])
```

**null を含む enum**: `v.nullable(v.picklist(null を除いた配列))` に直訳しては**いけない**。api.json の `enum` 配列はソートされずに等価比較されるため (diff ハーネスは enum 配列を正規化しない)、`null` を配列から取り除くと `enum` の要素・順序が現行 api.json と食い違って diff になる。必ず **`mi.nullableEnum()`** を使い、`null` を含む元の配列を渡した順序のまま渡す:

```ts
// before (server/api/endpoints/notes/create.ts の reactionAcceptance 相当)
{ type: 'string', nullable: true, enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'], default: null }
// after
v.optional(mi.nullableEnum([null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote']), null)
```

`mi.nullableEnum(options)` はランタイムでは `v.nullable(v.picklist(options から null を除いた配列))` と等価に検証しつつ、OpenAPI 上は **`options` を渡した順序のまま** (`null` を含めて) `enum` として出力するメタデータを付ける。**戻り値そのものが `nullable` を含んでいる** ので、`v.nullable()` で二重に包まない (default を付けたいときだけ `v.optional(mi.nullableEnum([...]), d)` で外側を包む — R3/R4 の 4 象限のうち `nullable: true` はこの関数自体が満たしている)。

既存の `note.ts` (entity 側) の `enum: ['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote', null]` のように **`null` が末尾に来ている** ファイルもある。配列の並びはファイルごとに違うことがあるので、`mi.nullableEnum()` に渡す配列は必ず**変換元の `enum` 配列をそのままコピー**すること (先頭に揃えたり並べ替えたりしない)。

**1 要素の enum** (variant の判別キーなど) は `v.picklist` ではなく `v.literal` にする:

```ts
// before
{ type: 'string', enum: ['list'] }
// after
v.literal('list')
```

---

## R6. 文字列・数値制約

| json-schema | valibot |
|---|---|
| `pattern: '...'` | `v.regex(/.../)` (文字列 → 正規表現リテラル化するときのエスケープに注意。特に `\\s` のような二重エスケープ済み文字列は `RegExp` リテラルにすると `\s` 1 段になる点を確認する) |

**pattern 文字列は `regex.source` がそのまま api.json に出る。** 検証上冗長なエスケープ (文字クラス内の `\/` 等) も legacy の pattern 文字列と一致させるため**削らずそのまま写す** (実例: `admin/drive/files.ts` の `/^[a-zA-Z0-9\/\-*]+$/` — `\/` を外すと semantically 同一でも api.json 差分になる)。
| `minimum` / `maximum` | `v.minValue(n)` / `v.maxValue(n)` |
| 文字列の `minLength` / `maxLength` | **`mi.minCodePoints(n)` / `mi.maxCodePoints(n)` 必須** |

文字列の長さ制約は **`v.minLength` / `v.maxLength` を素で使ってはいけない**。AJV は JSON Schema 仕様どおり `minLength`/`maxLength` を**Unicode コードポイント数**でカウントする一方、valibot の `v.minLength`/`v.maxLength` は文字列に対して **UTF-16 コードユニット数**でカウントする。サロゲートペア文字 (絵文字や一部の漢字など、コードポイントが U+10000 以上の文字) を含む入力で挙動が食い違う (例: 絵文字 1 文字 = コードポイント換算 1、UTF-16 換算 2)。これは境界値検証の意味を変えるバグなので、文字列長には必ず `mi.minCodePoints` / `mi.maxCodePoints` を使う。

```ts
// before
{ type: 'string', minLength: 1, maxLength: 100 }
// after
v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100))
```

`v.minLength` / `v.maxLength` を素の文字列に使っているのを見つけたら cookbook 違反として差し戻す (配列の要素数制約 R7 とは別物なので混同しない)。

---

## R7. 配列制約

| json-schema | valibot |
|---|---|
| `minItems` / `maxItems` | `v.minLength(n)` / `v.maxLength(n)` (**配列の要素数**なので `v.minLength`/`v.maxLength` をそのまま使ってよい。R6 の文字列コードポイント問題は配列には関係ない) |
| `uniqueItems: true` | `mi.uniqueArray()` 系 check |

```ts
// before
{ type: 'array', uniqueItems: true, minItems: 1, maxItems: 16, items: { type: 'string', format: 'misskey:id' } }
// after
v.pipe(v.array(mi.misskeyId()), mi.uniqueArray(), v.minLength(1), v.maxLength(16))
```

`items` が**プリミティブでない** (`object` や `array`) 配列に `uniqueItems: true` が付いている場合は**エスカレーション**する。AJV の `uniqueItems` はオブジェクト同士も深い等価比較 (deep equality) で見るが、`mi.uniqueArray()` を軽率にオブジェクト配列へ適用すると参照同一性/浅い比較などで意味がずれるリスクがある。実例が出たら都度、深い等価比較の実装を確認してから個別対応する。

---

## R8. object

`required` 配列に無いキーは R3/R4 で optional/nullable/default を包んでから `v.object({...})` に渡す。

```ts
// before (paramDef)
{
  type: 'object',
  properties: {
    text: { type: 'string', minLength: 1, maxLength: 3000, nullable: true },
    localOnly: { type: 'boolean', default: false },
  },
}
// (text, localOnly ともに required に含まれない)
// after
v.object({
  text: v.optional(v.nullable(v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(3000)))),
  localOnly: v.optional(v.boolean(), false),
})
```

- **空 paramDef** (`{ type: 'object', properties: {} }` や `properties` 自体が無い最小 paramDef) → `v.object({})`
- **`additionalProperties: false`** → `v.strictObject({...})`
- **`additionalProperties: <Schema>` かつ `properties` が空/無し** → `v.record(v.string(), <値のスキーマ>)`

  ```ts
  // before
  { type: 'object', additionalProperties: { type: 'string' } }
  // after
  v.record(v.string(), v.string())
  ```

- **`additionalProperties: { anyOf: [...] }`** → `v.record(v.string(), v.union([...]))`
- **`properties` と `additionalProperties: <Schema>` の併用** → `v.objectWithRest({...}, <値のスキーマ>)`
- **明示的な `additionalProperties: true`** (`fetch-rss.ts` / `pages/create.ts` / `pages/update.ts` / `models/json-schema/meta.ts` 等) → **`mi.anyRecord()`**

  ```ts
  // before
  { type: 'object', additionalProperties: true }
  // after
  mi.anyRecord()
  ```

  `mi.anyRecord()` はランタイムでは `mi.anyObject()` (`v.record(v.string(), v.any())`) と同じだが、OpenAPI 出力に `additionalProperties: true` を明示的に付ける (`openApi({ additionalProperties: true })` を pipe している) 点が違う。逆に `mi.anyObject()`/`mi.anyArray()` は `additionalProperties`/`items` を**まったく出力しない** (R1 参照)。json-schema 側に `additionalProperties: true` が**書かれているか否か**で `mi.anyRecord()` と `mi.anyObject()` を使い分けること (両方とも「無検証」という点では同じでも、api.json 上のキー有無が違う)。

- **`properties` と `additionalProperties: true` の併用** (`models/schema/meta.ts` の `sentryForFrontend.options` 等) → `v.object({...})` に `mi.openApi({ additionalProperties: true })` を pipe する (`mi.anyRecord()` は properties を持てないので使えない。`v.objectWithRest({...}, v.any())` だと値が `v.any()` のため `additionalProperties` が出力されない)

  ```ts
  // before
  { type: 'object', properties: { dsn: { type: 'string' } }, additionalProperties: true }
  // after
  v.pipe(v.object({ dsn: v.string() }), mi.openApi({ additionalProperties: true }))
  ```

**注意 (重要)**: `v.object(...)` は valibot の既定動作として、スキーマに定義されていない未知キーを**出力 (parse 結果) から除去する**。

1. 移行対象のハンドラ内で `ps.<properties に無いキー>` のような静的アクセスが無いか確認する (無ければ実害はない)。
2. `Object.keys(ps)` やスプレッド `{ ...ps }` 経由で動的にキーを扱っている箇所、または `ps` をそのまま外部 (DB 挿入、他サービス呼び出し等) に渡している箇所がないか確認する。
3. 該当箇所があれば、未知キー除去が問題になる可能性があるため**エスカレーション**する (`v.objectWithRest({...}, v.any())` で素通しに寄せる、または個別に判断)。

---

## R9. allOf

**entity 合成 (entity 世界)**: `packedUserDetailedNotMeSchema` のように、複数の entity (`ref`) を `allOf` で束ねるパターンは `mi.composeEntity(name, parts)` 経由で合成する。シグネチャは `composeEntity<N extends EntityName>(name: N, parts: [AnyValibotSchema, ...AnyValibotSchema[]])` — **第 1 引数が登録名の文字列、第 2 引数が合成元スキーマの配列** (スキーマを直接 2 個以上の引数として渡す形ではない) であることに注意する。`parts` の各要素は **object スキーマ** でなければならない (object 以外を渡すと `composeEntity` が throw する):

```ts
// before (models/schema/user.ts packedUserDetailedNotMeSchema 相当)
export const packedUserDetailedNotMeSchema = {
  type: 'object',
  allOf: [
    { type: 'object', ref: 'UserLite' },
    { type: 'object', ref: 'UserDetailedNotMeOnly' },
  ],
} as const;

// after: UserLite・UserDetailedNotMeOnly は両方とも mi.defineEntity() 済みの named entity
export const packedUserDetailedNotMeSchema = mi.composeEntity('UserDetailedNotMe', [
  packedUserLiteSchema,
  packedUserDetailedNotMeOnlySchema,
]);
```

**合成 entity の公開型 (`export type PackedX`) は `v.InferOutput<typeof packedXSchema>` で書かない。** `composeEntity` の戻り型 (`Flatten<MergeTuple<...>>`) を展開してしまい、ジェネリクス越しに `Packed<S>` を使う箇所 (`UserEntityService.pack` / `packMany` など) で TS2589 (型のインスタンス化が深すぎる) になる。legacy の `allOf` 型 (`ArrayToIntersection`) と同じく**パートの公開型の交差型**で書くこと (判別子なし `oneOf` の合成なら union):

```ts
export const packedMeDetailedSchema = mi.composeEntity('MeDetailed', [/* ... */]);
// NG: export type PackedMeDetailed = v.InferOutput<typeof packedMeDetailedSchema>;
// OK:
export type PackedMeDetailed = PackedUserLite & PackedUserDetailedNotMeOnly & PackedMeDetailedOnly;
```

`mi.composeEntity()` は各パートの entries を flatten して 1 つの `v.object` 相当にまとめつつ、`allOfParts` メタデータ (各パートの登録名 or スキーマ本体) を保持する。OpenAPI 変換 (`openapi.ts` の `object` ケース) はこのメタデータを見つけると **properties を出力せず `allOf: [...]` だけを出力する** ので、手で `{ ...a.entries, ...b.entries }` のように展開しない — メタデータが失われて properties がそのまま出力されてしまう。

**`ref` と inline properties が混在する `allOf`** (`Role` = `allOf: [{ ref: 'RoleLite' }, { inline properties }]`) もそのまま `composeEntity()` に渡してよい。パートは登録済み / 未登録のどちらでもよく、`allOf` の出力が次のように切り替わる:

| パート | `allOf` の出力 |
|---|---|
| `mi.defineEntity()` 済み | `{ $ref: '#/components/schemas/<name>' }` |
| 未登録のプレーンな `v.object` | そのパートを再帰変換した object (`{ type: 'object', properties, required }`) |

```ts
// before (models/json-schema/role.ts packedRoleSchema 相当)
// allOf: [{ type: 'object', ref: 'RoleLite' }, { type: 'object', properties: { createdAt: ..., ... } }]

// after: inline パートはレジストリに登録せずそのまま渡す
const packedRoleDetailedOnlySchema = v.object({
  createdAt: mi.dateTimeString(),
  // ...
});

export const packedRoleSchema = mi.composeEntity('Role', [
  packedRoleLiteSchema,        // 登録済み → $ref
  packedRoleDetailedOnlySchema, // 未登録 → インライン展開
]);

// 公開型は交差型で書く (未登録パートは v.InferOutput でよい)
export type PackedRole = PackedRoleLite & v.InferOutput<typeof packedRoleDetailedOnlySchema>;
```

inline パート側の各プロパティの optional 判定は通常どおり (`v.optional()` の有無 = `required` への載り方) なので、**legacy の inline パートに `optional` フラグが無いからといって全部 required にしない** — 変換元がどう出力されていたか (`api.json` の `required`) を必ず確認する。

**`anyOf` 混在の `allOf`** (paramDef 世界。`users/show.ts` の `paramDef` のような、`allOf` の 1 要素が `anyOf` になっているパターン) は valibot に直訳先が無いので**分配して `v.union` 化**する:

```ts
// before (server/api/endpoints/users/show.ts paramDef 相当)
{
  allOf: [
    {
      anyOf: [
        { type: 'object', properties: { userId: { type: 'string', format: 'misskey:id' } }, required: ['userId'] },
        { type: 'object', properties: { userIds: { type: 'array', items: { type: 'string', format: 'misskey:id' } } }, required: ['userIds'] },
        { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] },
      ],
    },
    { /* 共通プロパティ (host 等) */ },
  ],
}

// after: 各 anyOf 分岐に共通プロパティを分配してから union にする
v.union([
  v.object({ userId: mi.misskeyId(), /* 共通プロパティ */ }),
  v.object({ userIds: v.array(mi.misskeyId()), /* 共通プロパティ */ }),
  v.object({ username: v.string(), /* 共通プロパティ */ }),
])
```

これは AJV の `anyOf` (「どれか 1 つ満たせばよい」= 部分的にゆるい) より valibot の `v.union` (各ブランチを順に試し、最初に成功したものの出力を採用) の方が**厳密**になる意図的な改善であり、**PR 説明に明記する** (挙動が変わり得るため黙って混ぜない)。

**`v.intersect` は使用禁止。** valibot の `v.intersect` は各スキーマの出力を単純にマージするだけで、`allOf` が本来意図する「両方の制約を同時に満たす」検証にならないケースが多い (特に `additionalProperties: false` 同士の allOf 等)。R9 の `mi.composeEntity()` / union 分配のいずれかで代替できないケースは**エスカレーション**する。

---

## R10. oneOf

- 全ブランチが `object` で、共通のキー (判別子) に `literal` / `picklist` が載っている → `v.variant('<判別子キー>', [...])`
- それ以外 (判別子が無い、ブランチの型が揃っていない等) → `v.union([...])` に **`mi.asOneOf()`** を併用する (**素の `v.union` だけでは不可**。理由は下記)

```ts
// before (models/schema/user.ts notificationRecieveConfig 相当)
{
  oneOf: [
    { type: 'object', properties: { type: { type: 'string', enum: ['all', 'following', ...] } }, required: ['type'] },
    { type: 'object', properties: { type: { type: 'string', enum: ['list'] }, userListId: { type: 'string', format: 'misskey:id' } }, required: ['type', 'userListId'] },
  ],
}

// after: 判別子 "type" が両ブランチにあるので variant 化
v.variant('type', [
  v.object({ type: v.picklist(['all', 'following', 'follower', 'mutualFollow', 'followingOrFollower', 'never']) }),
  v.object({ type: v.literal('list'), userListId: mi.misskeyId() }),
])
```

```ts
// before (models/schema/user.ts packedUserSchema 相当: 判別子が無い oneOf)
export const packedUserSchema = {
  oneOf: [
    { type: 'object', ref: 'UserLite' },
    { type: 'object', ref: 'UserDetailed' },
  ],
} as const;

// after: 判別子が無いので v.union() で分岐するが、そのままだと OpenAPI 上 `anyOf` になってしまう
// (openapi.ts の union 変換は既定で `unionKeyword: 'anyOf'`) ので mi.asOneOf() で `oneOf` を強制する
export const packedUserSchema = v.pipe(
  v.union([packedUserLiteSchema, packedUserDetailedSchema]),
  mi.asOneOf(),
);
```

**`mi.asOneOf()` を忘れて素の `v.union([...])` を使うと api.json 上は `oneOf` ではなく `anyOf` として出力され、現行 api.json との差分になる** (`metadata.ts` の `asOneOf()` は `unionKeyword: 'oneOf'` というメタデータを付けるだけで、`openapi.ts` の `union` ケースが `meta.unionKeyword ?? 'anyOf'` を出力キーワードとして読む)。判別子付き `variant` には `asOneOf()` は不要 (`variant` は常に `oneOf` を出力する)。

---

## R11. prefixItems / items 併用 (tuple)

| json-schema | valibot |
|---|---|
| `prefixItems: [...]` + `unevaluatedItems: false` (追加要素禁止) | `v.strictTuple([...])` |
| `prefixItems: [...]` + `items: <Schema>` (残り要素の型指定) | `v.tupleWithRest([...], <Schema>)` |

```ts
// before
{ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false }
// after
v.strictTuple([v.string(), v.number()])
```

---

## R12. description / example / res 側 format

```ts
// description
{ type: 'string', description: 'The unique identifier for this Note.' }
// after
v.pipe(v.string(), v.description('The unique identifier for this Note.'))

// example
{ type: 'string', example: 'xxxxxxxxxx' }
// after (ラップ形式: 第 1 引数にスキーマ、第 2 引数に値。既存スキーマにそのまま適用できる)
mi.example(v.string(), 'xxxxxxxxxx')
```

`mi.example()` はオーバーロードされていて、上記の**ラップ形式** (`mi.example(schema, value)`、戻り値はそのスキーマ自身の型を保つ) の他に、**pipe アクション形式** (`mi.example(value)` を `v.pipe(...)` の途中に置く) にも対応する。既に `v.pipe(...)` で他のアクション (`v.description()` 等) と組み合わせている箇所では pipe アクション形式の方が読みやすい:

```ts
// pipe アクション形式: 他のメタデータ/検証アクションと同じ pipe に連ねる
v.pipe(
  v.string(),
  v.description('The unique identifier for this Note.'),
  mi.example('xxxxxxxxxx'),
)
```

どちらの形式でも `format`/`example`/`deprecated` 等の内部表現 (`v.metadata()` の `SchemaMeta`) は同じで、OpenAPI 変換結果も変わらない。

レスポンス (entity 世界) 側でよく使う `format` はメタデータ用ヘルパーに落とす (**ランタイム検証は追加しない** — 現行の `format` も AJV 単体では基本的に注釈用途で、検証を強制していないものが多いため、現行と同等の「注釈のみ」を維持する):

| json-schema (`res` 側) | valibot |
|---|---|
| `format: 'id'` | `mi.idString()` |
| `format: 'date-time'` | `mi.dateTimeString()` |
| `format: 'url'` | `mi.urlString()` |
| 上記以外の res 側 `format` (`'uri'` / `'md5'` 等) | `v.pipe(v.string(), mi.format('uri'))` (専用ヘルパーは作らない) |
| res 側なのに `format: 'misskey:id'` (リテラルが `'id'` でない箇所がある) | `v.pipe(v.string(), mi.format('misskey:id'))` — **`mi.idString()` にすると `format: 'id'` が出て api.json 差分になる。`mi.misskeyId()` にするとランタイム検証が付いて意味が変わる。必ず元のリテラルを確認する** (実例: `users/lists/get-memberships.ts`) |

```ts
createdAt: mi.dateTimeString(),
```

---

## R13. ref (entity 参照)

- **移行済み entity への参照** → スキーマを直接 import して埋め込む:

  ```ts
  // before
  { properties: { user: { type: 'object', ref: 'UserLite' } } }
  // after
  v.object({ user: packedUserLiteSchema })
  ```

- **循環参照** (Note がリプライ先の Note を含む、等) → `v.lazy(() => packedNoteSchema)` を使い、export 側の型注釈を明示する:

  ```ts
  export const packedNoteSchema: v.GenericSchema<PackedNote> = v.object({
    // ...
    reply: v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
  });
  ```

  (`v.GenericSchema<PackedNote>` の明示注釈が無いと TypeScript が循環型を解決できず無限再帰型エラーになることがある。)

  手書きする出力型は **`interface` ではなく `type` エイリアス**で書く。`interface` には implicit index signature が付かないため、`Cloneable` / `JsonValue` のような index signature 前提の型 (stream 配信系が使う) へ代入できず、legacy (`SchemaType` = 型エイリアス由来) との互換が崩れる。

- **モジュール間の循環 import (ESM の TDZ)**: 型の循環だけでなく **モジュールの循環 import** にも `v.lazy()` が要る。`user.ts` ↔ `note.ts` ↔ `page.ts` ↔ `drive-file.ts` のように import が循環している (= import グラフの同一 SCC に属する) モジュール同士の参照は、**どちらの向きも** `v.lazy(() => packedXSchema)` にすること。片側だけ lazy にしても、評価の起点が変われば先に評価されたモジュールの `const` が未初期化のまま参照され `ReferenceError` (TDZ) になる。SCC の外への参照 (`channel.ts` → `note.ts`、`drive-file.ts` → `drive-folder.ts` など逆向きの import が無いもの) は直接参照でよい。

- **legacy `selfRef: true` 付きの自己参照** (`models/schema/page.ts` の `PageBlock` が子ブロックとして自分自身を含むケース。`ref: 'PageBlock', selfRef: true` が付いている) は、上の「循環参照」と同じ `v.lazy()` に加えて **`mi.selfRef()`** を pipe で併せて付ける:

  ```ts
  // before (models/schema/page.ts sectionBlockSchema.properties.children.items 相当)
  { type: 'object', ref: 'PageBlock', selfRef: true }

  // after
  v.pipe(v.lazy(() => packedPageBlockSchema), mi.selfRef())
  ```

  legacy の `selfRef: true` は「レスポンス生成用の `#/components/schemas/*` 一覧 (`getSchemas(includeSelfRef)`) を作るときは自己参照を展開しない (`{ type: 'object' }` に退化させる) が、エンドポイント個別の `res` を出すときは `$ref` のまま出す」という **2 種類の出し分け** ([`server/api/openapi/schemas.ts`](../../../../../packages/backend/src/server/api/openapi/schemas.ts) の `includeSelfRef` 引数) のための注釈で、`mi.selfRef()` はこの区別をコンバータ (`valibotToOpenApi` の `ctx.includeSelfRef`) に伝えるためだけに存在する (ランタイム検証には影響しない)。**ただの循環参照 (Note の reply など、legacy 側に `selfRef: true` が無いもの) には `mi.selfRef()` を付けない** — legacy に無い注釈を新規に足すことになり検証意味は変えないが余計な差分の元になる。

- **`mi.entityRef()` は撤去済み** — 移行期間中に「まだ legacy のままの entity」を参照するための橋渡しヘルパーだったが、全 entity の Valibot 化完了に伴い削除した。entity 参照は常にスキーマの直接 import (循環していれば `v.lazy()`) で書く。

---

## R14. if/then (`notes/create.ts` のみ)

現状 `if`/`then` を使っているのは [`notes/create.ts`](../../../../../packages/backend/src/server/api/endpoints/notes/create.ts) の 1 箇所のみ (renote/file/media/poll が無ければ text 必須、という条件付き required)。valibot に `if`/`then` の直訳は無いため `v.pipe(obj, v.rawCheck(...))` で相互作用チェックとして表現し、issue に dot-path を付与する:

```ts
// before (抜粋)
if: { properties: { renoteId: { type: 'null' }, fileIds: { type: 'null' }, mediaIds: { type: 'null' }, poll: { type: 'null' } } },
then: { properties: { text: { type: 'string', minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH, pattern: '[^\\s]+' } }, required: ['text'] },

// after
v.pipe(
  v.object({ /* ...各プロパティ... */ }),
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return;
    const value = dataset.value;
    const isRenoteOnly = value.renoteId == null && value.fileIds == null && value.mediaIds == null && value.poll == null;
    if (isRenoteOnly && (typeof value.text !== 'string' || value.text.trim().length === 0)) {
      addIssue({
        message: 'text is required unless renoteId, fileIds, mediaIds or poll is present.',
        path: [{ type: 'object', origin: 'value', input: value, key: 'text', value: value.text }],
      });
    }
  }),
)
```

この 1 ファイル以外に `if`/`then` が出現したら、本規則をそのまま流用せず**エスカレーション**する (条件の形が違えば `rawCheck` の中身も個別設計が必要なため)。

---

## R15. 共有断片・頻出イディオム

- `models/User.ts` の `localUsernameSchema` のような**複数ファイルから import される共有断片**は、valibot 版を**併設**する (同名 + サフィックスや別 export 名で追加し、旧定数は消費者側の移行が完了するまで残す)。断片を差し替えるだけで一括移行しようとすると未移行の消費者側で型エラーが連鎖するため、既存の legacy 定数は**消さない**。
- ページネーション頻出トリオ (`sinceId` / `untilId` / `limit` のような組) は `mi.paginationEntries()` (`v.object` の entries を返すヘルパー) で共通化する:

  ```ts
  // before
  {
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      sinceId: { type: 'string', format: 'misskey:id' },
      untilId: { type: 'string', format: 'misskey:id' },
    },
  }
  // after
  v.object({
    ...mi.paginationEntries({ max: 100, default: 10 }),
  })
  ```

  **spread する前に元のプロパティ宣言順を必ず確認する。** ヘルパーは `limit → sinceId → untilId` 固定順で展開するが、既存ファイルには `limit` が末尾に来るもの (実例: `channels/{followed,owned,search}.ts`) や間に別フィールドが挟まるものがある。順序が一致しない場合はヘルパーを使わず個別に書いて**元の順序を保存**する (api.json のプロパティ順は等価性の一部)。`mi.limit({max, def})` は単独でも使える (トリオが無い lone limit フィールドに)。

---

## R16. Valibot らしく書く (禁止イディオム / スタイル)

- `v.union([v.literal(a), v.literal(b), ...])` と**書かない** → `v.picklist([a, b, ...])` にする (R5)。
- アクション無しの `v.pipe(x)` (1 引数だけの pipe) を**書かない** → 素の `x` を使う。
- `as const` / `satisfies` は valibot スキーマに**不要** (型は valibot が推論する)。
- **完全に空の `paramDef = {}`** (type キーすら無い、`{ type: 'object', properties: {} }` とは別物) も `v.object({})` に変換してよい — どちらも requestBody 無しの api.json 出力になることを確認済み (実例: `reversi/invitations.ts`)。エスカレーション不要。
- ハンドラが legacy の `paramDef.properties` を実行時に参照している場合 (実例: `flash/update.ts` の `Object.hasOwn(paramDef.properties, key)`) は、valibot ObjectSchema の **`.entries`** に読み替える (キー集合は不変。`misc/schema/param-introspect.ts` と同じアクセスパターン)。
- 型エイリアスは `v.InferOutput<typeof paramDef>` を使う (旧来の `SchemaType<typeof paramDef>` 相当)。
- **`SchemaType` (legacy 型ヘルパー) の新規使用は禁止** — valibot 化した箇所は `v.InferOutput` に統一する。
- `meta` オブジェクト、ハンドラ本体 (`super(meta, paramDef, async (ps, me) => {...})` の中身)、SPDX ヘッダー、既存コメントには**触れない** (`paramDef` / entity schema 定義の書き換えに専念する)。

---

## ヘルパー一覧 (`@/misc/schema/index.js` の公開 API)

`import * as mi from '@/misc/schema/index.js';` で使えるヘルパーの早見表。シグネチャは [`helpers.ts`](../../../../../packages/backend/src/misc/schema/helpers.ts) / [`metadata.ts`](../../../../../packages/backend/src/misc/schema/metadata.ts) / [`registry.ts`](../../../../../packages/backend/src/misc/schema/registry.ts) を正典として簡略化して載せている (型引数の詳細は実装参照)。ここに無い `mi.*` 名を使わない — 実装に存在しないヘルパーを書かない。

### helpers.ts

| API | シグネチャ (簡略) | 説明 | 対応する旧イディオム |
|---|---|---|---|
| `mi.misskeyId()` | `() => GenericSchema<string>` | `format: 'misskey:id'` 相当。ランタイムは `MISSKEY_ID_REGEX` で検証、OpenAPI 上は `format: 'misskey:id'` のみ出力 (`pattern` は出さない) | `{ type: 'string', format: 'misskey:id' }` (R2) |
| `mi.integer(opts?: { min?, max? })` | `(opts?) => GenericSchema<number>` | `{ type: 'integer' }` 相当。`min`/`max` を渡すと `minimum`/`maximum` も付く | `{ type: 'integer' }` (R1) |
| `mi.limit(opts: { max, def?, min? })` | `def` 指定時は `OptionalSchema<GenericSchema<number>, number>`、未指定時は `GenericSchema<number>` を返す (オーバーロード) | ページネーションの `limit` (`minimum` 既定 1、`maximum: max`、`default: def`) | `{ type: 'integer', minimum: 1, maximum, default }` |
| `mi.idString()` | `() => GenericSchema<string>` | res 側 `format: 'id'` (注釈のみ、ランタイム検証なし) | `{ type: 'string', format: 'id' }` (R12) |
| `mi.dateTimeString()` | `() => GenericSchema<string>` | res 側 `format: 'date-time'` (注釈のみ) | `{ type: 'string', format: 'date-time' }` (R12) |
| `mi.urlString()` | `() => GenericSchema<string>` | res 側 `format: 'url'` (注釈のみ) | `{ type: 'string', format: 'url' }` (R12) |
| `mi.minCodePoints(requirement: number)` | `(n) => check action` | 文字列長の下限を**コードポイント数**で検証 (`v.minLength` は使わない) | `minLength` (R6) |
| `mi.maxCodePoints(requirement: number)` | `(n) => check action` | 文字列長の上限を**コードポイント数**で検証 | `maxLength` (R6) |
| `mi.uniqueArray()` | `() => check action` | 配列要素の一意性を `Set` 同一性比較で検証 (プリミティブ要素専用) | `uniqueItems: true` (R7) |
| `mi.nullableEnum(options: readonly (string \| null)[])` | `(options) => GenericSchema<string \| null>` | `null` を含む enum。ランタイムは `v.nullable(v.picklist(null除く))` と等価、OpenAPI は `options` を**渡した順序のまま** `enum` に出力 (戻り値は既に nullable なので `v.nullable()` で二重に包まない) | `{ nullable: true, enum: [null, ...] }` (R5) |
| `mi.anyObject()` | `() => GenericSchema<Record<string, any>>` | `v.record(v.string(), v.any())`。`additionalProperties`/`properties` を出力しない | `properties` 無しの `object` (R1) |
| `mi.anyRecord()` | `() => GenericSchema<Record<string, any>>` | `anyObject()` + OpenAPI に `additionalProperties: true` を明示出力 | `{ type: 'object', additionalProperties: true }` (R8) |
| `mi.anyArray()` | `() => GenericSchema<any[]>` | `v.array(v.any())`。`items` を出力しない | `items` 無しの `array` (R1) |
| `mi.paginationEntries(opts: { max, default, min? })` | `(opts) => { limit, sinceId, untilId }` (entries 断片) | `limit`/`sinceId`/`untilId` の 3 点セット。`v.object({ ...mi.paginationEntries(...) })` で展開する | ページネーション頻出トリオ (R15) |
| `mi.paginationDateEntries()` | `() => { sinceDate, untilDate }` (entries 断片) | `sinceDate`/`untilDate` の断片。`paginationEntries()` の直後に spread する (プロパティ順維持) | `sinceDate`/`untilDate` |
| `mi.MISSKEY_ID_REGEX` | `RegExp` (定数、関数ではない) | Misskey ID 形式の正規表現の唯一の正典。他所で正規表現を書き写さない | `ajv.addFormat('misskey:id', ...)` |

### metadata.ts

| API | シグネチャ (簡略) | 説明 | 対応する旧イディオム |
|---|---|---|---|
| `mi.format(value: string)` | `(value) => MetadataAction` | OpenAPI `format` を付ける (ランタイム検証なし) | `format: '...'` |
| `mi.example(schema, value)` / `mi.example(value)` | ラップ形式: `(schema, value) => schema`。pipe アクション形式: `(value) => MetadataAction` (R12 参照) | OpenAPI `example` を付ける。両形式とも同じ内部表現になる | `example: ...` (R12) |
| `mi.deprecated()` | `() => MetadataAction` | OpenAPI `deprecated: true` を付ける | `deprecated: true` |
| `mi.selfRef()` | `() => MetadataAction` | legacy `selfRef: true` 相当。`ctx.includeSelfRef === false` のとき `$ref` を `{ type: 'object' }` に退化させる (R13) | `selfRef: true` |
| `mi.asOneOf()` | `() => MetadataAction` | `v.union` の OpenAPI 出力キーワードを既定の `anyOf` から `oneOf` に変える (R10) | 判別子の無い `oneOf` |
| `mi.openApi(raw: Record<string, unknown>)` | `(raw) => MetadataAction` | 生の OpenAPI キーワードを注入するエスケープハッチ | (個別対応) |
| `mi.omitKeywords(...keys: string[])` | `(...keys) => MetadataAction` | 指定した OpenAPI キーワードを出力から削除するエスケープハッチ | (個別対応) |
| `mi.skipInOpenApi(action)` | `(action) => action` | 検証アクションを OpenAPI 変換の対象外にする (例: `misskeyId()` の内部 regex) | (内部実装向け。通常の移行作業では使わない) |
| `mi.schemaMeta(meta: SchemaMeta)` | `(meta) => MetadataAction` | 上記メタデータ系ヘルパーが内部で使う低レベル API。通常は個別のヘルパー (`format`/`example`/...) を使い、直接呼ぶのは複数メタデータを同時に付けたい特殊ケースのみ | - |

### registry.ts

| API | シグネチャ (簡略) | 説明 | 対応する旧イディオム |
|---|---|---|---|
| `mi.defineEntity(name: EntityName, schema)` | `(name, schema) => schema` (同じ schema をそのまま返す) | Valibot 版 packed スキーマを `#/components/schemas/<name>` として登録する | `refs['X'] = packedXSchema` |
| `mi.composeEntity(name: EntityName, parts: [schema, ...schema[]])` | `(name, parts) => GenericSchema<...>` | 複数の object スキーマを `allOf` で合成する。第 1 引数は登録名の文字列、第 2 引数はスキーマの配列。パートは `defineEntity` 済み (→ `$ref`) でも未登録 (→ インライン展開) でもよい (R9) | `{ allOf: [{ ref: 'A' }, { properties: ... }, ...] }` |

---

## 禁止事項

以下を行わない (レビューで見つけたら差し戻す):

- **既存スキーマの書き換えで** 検証の意味を **1 ビットでも**変える (境界値、`default` の適用条件、`required`/optional 判定、enum 許容値、のいずれか)
- `v.intersect` の使用 (R9)
- 文字列に対する素の `v.minLength` / `v.maxLength` (R6 — 必ず `mi.minCodePoints`/`mi.maxCodePoints`)
- 規則に無い箇所への `v.any()` の新規追加 (既存の無検証箇所を `v.any()` に落とすのは R1 の対象内だが、**検証されていた箇所を新たに `v.any()` に緩める**のは禁止)
- `transform` / `coerce` 系アクションの追加 (paramDef では OpenAPI コンバータが throw する。値の変形はスキーマではなくハンドラ内で行う)
- `v.pipe()` の 2 番目以降にスキーマを置くこと (`v.pipe(v.string(), v.transform(Number), v.number())` のような形)。OpenAPI コンバータは pipe の先頭のみをスキーマとして扱い、中間スキーマは黙って無視されるため誤った spec が出る。pipe は「先頭スキーマ + アクションのみ」で構成する
- `packages/backend/built/api.json` / `packages/misskey-js/src/autogen/` の手編集 (再生成コマンドで生成する。手編集した差分をそのままコミットしない)
- `Schema` / `SchemaType` / `Packed<>` / `KeyOf<>` / `refs` / `mi.entityRef()` の新規使用 (すべて撤去済み。packed entity の型は `import type { PackedX } from '@/models/schema/<file>.js'` で直接 import する)

---

## 既知の制約・非対応の注記

「検証は書いたのに api.json に出てこない」「コンバータが throw した」で混乱しないための注記。いずれも規則の適用ミスではない。

- **`if`/`then` (`notes/create.ts` のみ、R14)**: legacy の `if`/`then` を `v.pipe(obj, v.rawCheck(...))` に変換すると、**OpenAPI 出力から `if`/`then` 相当の記述が消える**。`openapi.ts` の `object` ケースは `entries`/`allOfRefs` しか見ておらず、pipe 上の `rawCheck` アクションは (kind が `'validation'` であって `'metadata'` ではないため) `mergeMetadata()` にも `applyActions()` にも一切拾われない (`object` 型は `applyActions` 自体を呼ばない)。つまり **ランタイム検証は保持されるが api.json 上の `if`/`then` は消える**。移行時に観測された差分で、`diff-api-json.mjs` の allowlist に登録して吸収済み。
- **`v.check` / `v.rawCheck` 等のカスタム検証全般**: 上と同じ理由で、OpenAPI に対応するキーワードが無いカスタム検証アクションは**すべて出力されない** (`applyActions()` の `switch` に無い `type` は黙って無視される)。`mi.minCodePoints`/`mi.maxCodePoints`/`mi.uniqueArray()` のようにマーカー付きで特別扱いされているものだけが `minLength`/`maxLength`/`uniqueItems` として出力される。ランタイムの検証意味は保たれるので問題ないが、「spec 上その制約が見えなくなる」こと自体は許容された既知差分。
- **オブジェクトキーの出力順序**: 気にしなくてよい。[`diff-api-json.mjs`](../../../../../packages/backend/scripts/diff-api-json.mjs) の `normalize()` は比較前にオブジェクトキーを再帰的にソートし、`required` 配列の要素もソートする (両者とも順序は意味を持たない)。
- **それ以外の配列 (`enum` / `oneOf` / `anyOf` / `allOf` / `prefixItems` / `properties` 相当) の順序は保存される** — `diff-api-json.mjs` は `required` 以外の配列を並べ替えないので、**元の json-schema の配列順序を必ず維持する** (R5 の `mi.nullableEnum()` が null を含めた配列をそのままの順序で渡す理由もこれ)。`v.object({...})` の entries 挿入順もプロパティ出力順としてそのまま保存される (`openapi.ts` の object ケースのコメント参照)。
- **未対応の valibot スキーマ種はコンバータが throw する**: `openapi.ts` の `convert()` は既知の `base.type` (`optional` / `nullable` / `string` / `number` / `object` / `array` / `union` / `variant` / `lazy` / `custom` 等 R1〜R13 で扱っているもの) だけを分岐しており、`default` 節で `throw new Error(`valibotToOpenApi: unsupported schema type '${base.type}'`)` する。**`v.date()` / `v.bigint()` / `v.file()` / `v.blob()` / `v.map()` / `v.set()` などこの文書のどの規則にも登場しないスキーマ型は使わない** (そもそも変換元の json-schema 側にこれらに対応する型が無いはずなので、通常は発生しない。もし変換対象に相当するものが見つかったらエスカレーションする)。

---

## 検証手順

スキーマ (paramDef / res / entity) を書き換えたら以下を順に実行する。**リファクタリング目的なら api.json 差分ゼロが受け入れ条件**:

1. **`pnpm lint`** — typecheck + eslint。valibot への書き換えで型が壊れていないか確認する。
2. **API 契約差分確認**:
   ```sh
   pnpm --filter backend generate-api-json --no-build
   node packages/backend/scripts/diff-api-json.mjs --baseline <移行前に取得したベースライン>
   ```
   空 diff (`no unexpected differences`, exit 0) を確認する。ベースラインは移行前に `node packages/backend/scripts/diff-api-json.mjs --snapshot --out <path>` で事前に取得しておく。
3. **非空 diff の場合**: 意図した変更 (R9 の anyOf→union 厳密化など、意図的に挙動を変えた箇所) であればアローリストに追加して再実行し、**空 diff にした上で** `pnpm build-misskey-js-with-types` を実行し `packages/misskey-js/src/autogen/` の差分を同じコミットに含める。意図しない diff が残る場合は変換を見直す (どの規則の適用ミスかを特定する)。
4. **複雑ファイルのスポット照合** (allOf/oneOf/if-then など R9〜R14 に該当するファイルは特に): 以下 5 点を移行前後で目視突合する。
   - キー全数 (プロパティの過不足)
   - `required` 集合 (メンバー一致。順序は無視してよい)
   - `default` 値 (一字一句)
   - 境界値 (`minimum`/`maximum`/`minLength`/`maxLength`/`minItems`/`maxItems`)
   - `enum` 値 (全メンバー一致)
5. **backend テストはローカルで実行せず CI に任せる** (`pnpm --filter backend test` 等を対話環境で実行して DB を汚さないこと)。

意図的に API を変えた場合は allowlist 化して空 diff にしたうえで、その理由を PR 説明に明記する。
