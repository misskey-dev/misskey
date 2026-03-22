/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: FR-023〜FR-027 ワールド分離機能
// 設置アイテム・落ちているアイテム・動物をワールド別に管理するためのマイグレーション

export class NoctownWorldSeparation1766700000000 {
	name = 'NoctownWorldSeparation1766700000000';

	async up(queryRunner) {
		// 仕様: FR-023 設置アイテムをワールド別に管理
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			ADD COLUMN IF NOT EXISTS "worldId" varchar(128) NULL
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_noctown_placed_item_worldId"
			ON "noctown_placed_item" ("worldId")
		`);
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_placed_item"."worldId"
			IS 'World ID (null = default world)'
		`);

		// 仕様: FR-025 落ちているアイテムをワールド別に管理
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			ADD COLUMN IF NOT EXISTS "worldId" varchar(128) NULL
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_noctown_dropped_item_worldId"
			ON "noctown_dropped_item" ("worldId")
		`);
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_dropped_item"."worldId"
			IS 'World ID (null = default world)'
		`);

		// 仕様: FR-024 動物（鶏）をワールド別に管理
		await queryRunner.query(`
			ALTER TABLE "noctown_chicken"
			ADD COLUMN IF NOT EXISTS "worldId" varchar(128) NULL
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_noctown_chicken_worldId"
			ON "noctown_chicken" ("worldId")
		`);
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_chicken"."worldId"
			IS 'World ID (null = default world)'
		`);

		// 仕様: FR-024 動物（牛）をワールド別に管理
		await queryRunner.query(`
			ALTER TABLE "noctown_cow"
			ADD COLUMN IF NOT EXISTS "worldId" varchar(128) NULL
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_noctown_cow_worldId"
			ON "noctown_cow" ("worldId")
		`);
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_cow"."worldId"
			IS 'World ID (null = default world)'
		`);
	}

	async down(queryRunner) {
		// 設置アイテム
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_placed_item_worldId"`);
		await queryRunner.query(`ALTER TABLE "noctown_placed_item" DROP COLUMN IF EXISTS "worldId"`);

		// 落ちているアイテム
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_dropped_item_worldId"`);
		await queryRunner.query(`ALTER TABLE "noctown_dropped_item" DROP COLUMN IF EXISTS "worldId"`);

		// 鶏
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_chicken_worldId"`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" DROP COLUMN IF EXISTS "worldId"`);

		// 牛
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_cow_worldId"`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" DROP COLUMN IF EXISTS "worldId"`);
	}
}
