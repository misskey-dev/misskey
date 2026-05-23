---
name: working-on-backend
description: Use whenever editing or adding code under `packages/backend/` — including REST API endpoints, NestJS services/modules, TypeORM entities, migrations, and backend tests. Covers NestJS DI patterns, TypeORM entity conventions, endpoint-list registration, meta/paramDef/res, misskey-js regeneration, migration up/down rules, and the `.config/test.yml` prerequisite. Must be consulted before any backend change to avoid CI failures and production incidents. This is NOT waived by having already invoked brainstorming, writing-plans, or any other upstream skill — invoke this at implementation time regardless of what preceded it.
---

# working-on-backend

`packages/backend/` (Misskey サーバー本体) を編集するとき、最初に参照するスキル。NestJS / TypeORM / API endpoint / migration / backend テストの **手順** と **背景知識** をまとめている。

SKILL.md 本体は references への索引だけ。具体的な手順や規約は該当ファイルを Read すること (progressive disclosure)。

> **他スキル実行後も免除されない。** `brainstorming` / `writing-plans` / その他アップストリームスキルを先に呼んでいても、`packages/backend/` に触れる実装フェーズに入る時点でこのスキルを呼ぶこと。

## 作業別ワークフロー (tasks)

タスク単位の完結したチェックリスト + チェックポイント。新しい何かを足すときに開く。

- 新規 REST API endpoint を追加する → [references/tasks/adding-api-endpoint.md](references/tasks/adding-api-endpoint.md)
- DB migration を作成する (TypeORM CLI / 手書きどちらも) → [references/tasks/creating-migration.md](references/tasks/creating-migration.md)

## 共通知識 (knowledge)

タスクに紐付かない参照リファレンス。複数のタスクから引かれる規約・背景説明。

- NestJS DI / module 登録 / `@Injectable` パターン → [references/knowledge/nestjs-di.md](references/knowledge/nestjs-di.md)
- TypeORM entity / `@Column` / `@Index` パターン (難ケース込み) → [references/knowledge/typeorm-patterns.md](references/knowledge/typeorm-patterns.md)
- API endpoint の `meta` / `paramDef` / `res` 完全早見表 + 落とし穴集 → [references/knowledge/api-meta-paramdef.md](references/knowledge/api-meta-paramdef.md)
- `endpoint-list.ts` への登録方法 (★ 漏れると 404) → [references/knowledge/endpoint-list.md](references/knowledge/endpoint-list.md)
- backend テストの前提 (`.config/test.yml`) と書き方 / e2e ヘルパー一覧 → [references/knowledge/backend-testing.md](references/knowledge/backend-testing.md)

## 必ず最後に通る場所

backend の変更を commit / PR にする前に、必ず [shipping-misskey-change](../shipping-misskey-change/SKILL.md) の最終チェックリストに従う。`pnpm lint` / misskey-js 再生成 / `check-migrations` / SPDX / CHANGELOG をまとめて確認する。

API endpoint を追加・変更したなら、その出口で [misskey-api-reviewer](../../agents/misskey-api-reviewer.md) agent (この skill の規約を review-mode から機械チェックする専門 reviewer) を Task で起動すると、endpoint-list 登録漏れや misskey-js 再生成漏れを取りこぼしにくい。
