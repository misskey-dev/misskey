# NestJS DI / module 登録パターン

Misskey の backend は NestJS 11 + Fastify 5 + TypeORM 1 (PostgreSQL) + Redis の構成。DI コンテナと Repository パターンが軸。

## アーキテクチャ

- **DI コンテナ**: NestJS の `@Injectable()` サービス + Repository (TypeORM) パターン
- **DI トークン**: [`@/di-symbols.js`](../../../../../packages/backend/src/di-symbols.ts) の `DI` から `@Inject(DI.xxx)` で注入
- **ビルド**: `rolldown -c` で `built/` にバンドル。型チェックは `tsgo`

## エンドポイント内での DI

API endpoint は `Endpoint<typeof meta, typeof paramDef>` を extends するクラスとして書く。`@Injectable()` を付けてコンストラクタで Repository / Service を `@Inject(DI.xxx)` で注入する。

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		// 他にも RoleService, UserEntityService, GlobalEventService 等を必要なだけ inject
	) {
		super(meta, paramDef, async (ps, me) => {
			// this.notesRepository.findOneBy(...) のように使う
		});
	}
}
```

`// eslint-disable-line import/no-default-export` は Endpoint のお約束 (NestJS が default export を要求する一方で、ESLint ルールでは制約されているため)。

## 主要 DI トークン

`@/di-symbols.js` から提供される。代表例:

| トークン | 型 | 用途 |
|---|---|---|
| `DI.notesRepository` | `NotesRepository` | notes テーブルの TypeORM Repository |
| `DI.usersRepository` | `UsersRepository` | users テーブル |
| `DI.driveFilesRepository` | `DriveFilesRepository` | drive_file テーブル |
| `DI.config` | `Config` | アプリ設定 |
| `DI.redis` | `Redis` | Redis クライアント |
| `DI.db` | `DataSource` | TypeORM DataSource (raw SQL を打ちたい時) |

Service 系 (例: `NoteCreateService`, `RoleService`, `UserEntityService`) は **トークン経由ではなく型をそのまま inject** する:

```ts
constructor(
	private roleService: RoleService,
	private userEntityService: UserEntityService,
) {}
```

## Service クラスの書き方

Service は `@Injectable()` を付け、必要な依存をコンストラクタで宣言する。NestJS の module (`packages/backend/src/core/CoreModule.ts` 等) に provider として登録される必要がある。

```ts
@Injectable()
export class MyService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private roleService: RoleService,
	) {}

	async doSomething(noteId: string) {
		const note = await this.notesRepository.findOneBy({ id: noteId });
		// ...
	}
}
```

新規 Service を追加する場合は **module 側の `providers` 配列にも追加** する必要がある。既存 Service が `CoreModule` に登録されているか確認するのが手っ取り早い。

## Module 構造

主要 module は以下:

- **CoreModule** (`src/core/CoreModule.ts`) — Service 群を集約
- **EndpointsModule** (`src/server/api/EndpointsModule.ts`) — endpoint-list.ts を `Object.entries()` で反復して NestJS provider (`provide: 'ep:<path>'`) を自動生成
- **GlobalModule** (`src/GlobalModule.ts`) — Repository / Config / Redis / DataSource など低レベル依存
- **QueueModule** (`src/queue/QueueModule.ts`) — BullMQ ジョブキュー

新規 endpoint 追加時に module への明示的な登録は不要 ([knowledge/endpoint-list.md](endpoint-list.md) 参照)。新規 Service 追加時は CoreModule (または該当 module) に provider 登録が必要。

## 既存例 (DI / 例外処理が綺麗な参考実装)

- [endpoints/notes/create.ts](../../../../../packages/backend/src/server/api/endpoints/notes/create.ts) — 多数の DI 注入 + `meta.errors` + `try/catch` で業務エラー変換 + 末尾 `throw err;` の二段構え
- [endpoints/i/pin.ts](../../../../../packages/backend/src/server/api/endpoints/i/pin.ts) — 同様の二段構え
- [endpoints/notes/global-timeline.ts](../../../../../packages/backend/src/server/api/endpoints/notes/global-timeline.ts) — `RoleService.getUserPolicies()` で動的ポリシー判定
