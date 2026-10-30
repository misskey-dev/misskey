# `endpoint-list.ts` への登録

新規 API endpoint を追加する際の **最大の落とし穴**。エンドポイントは glob 自動収集されないため、ここへの 1 行追加を忘れると 404 になる。

## なぜ必要か

[`packages/backend/src/server/api/EndpointsModule.ts`](../../../../../packages/backend/src/server/api/EndpointsModule.ts) が [`endpoint-list.ts`](../../../../../packages/backend/src/server/api/endpoint-list.ts) の全エクスポートを `Object.entries()` で反復し、NestJS provider (`provide: 'ep:<path>'`) を生成している。**このリストが API ルーティングの単一の真実** で、ここに無いものは存在しないものとして扱われる。

## 登録方法

[endpoint-list.ts](../../../../../packages/backend/src/server/api/endpoint-list.ts) の **同カテゴリ内** に 1 行追加する:

```ts
export * as '<category>/<name>' from './endpoints/<category>/<name>.js';
```

`<category>` は機能領域 (`notes`, `users`, `admin/announcements` 等)、`<name>` はエンドポイント名 (`create`, `show`, `delete` 等)。両方ともケバブケース / スラッシュ区切りで、ファイルシステムのパス構造と一致する。

例: `endpoints/notes/create.ts` を追加するなら:

```ts
export * as 'notes/create' from './endpoints/notes/create.js';
```

## 並び順

**並び順は厳密ではない**。同じディレクトリ (例: `admin/queue/*`) の中でも、アルファベット順ではなく追加された経緯どおりの順になっている箇所が多い。

- **新規追加**: 同カテゴリ内の末尾に追加すれば OK
- **既存近傍**: 同カテゴリ内の関連エンドポイントの近くに置く判断もあり
- **過度に整理しない**: 既存の並びを全部 sort し直すような PR は不要 (review コストだけ増える)

## 登録確認

ファイルを追加した後、grep で 1 行存在することを確認する:

```bash
grep -F "'<category>/<name>'" packages/backend/src/server/api/endpoint-list.ts
```

ヒットしなければ登録漏れ。

## 既存例 (登録漏れに気づくための grep 例)

`endpoint-list.ts` の冒頭コメントに「このリストが API ルーティングの単一の真実」という旨が記載されている。新規開発時はこのファイルを開いてカテゴリ単位の構造を把握してから新規 endpoint ファイルを書くのが効率的。

## 関連

- 新規 endpoint 追加の全手順 → [tasks/adding-api-endpoint.md](../tasks/adding-api-endpoint.md)
- NestJS DI / module 構造 → [nestjs-di.md](nestjs-di.md)
