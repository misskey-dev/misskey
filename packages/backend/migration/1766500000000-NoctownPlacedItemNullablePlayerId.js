/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-120〜FR-122: 設置アイテムの設置者をnullable化
// 設置者がnullの場合は「不明」として表示する

export class NoctownPlacedItemNullablePlayerId1766500000000 {
	name = 'NoctownPlacedItemNullablePlayerId1766500000000';

	async up(queryRunner) {
		// 外部キー制約を削除
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			DROP CONSTRAINT IF EXISTS "FK_noctown_placed_item_player"
		`);

		// playerId を nullable に変更
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			ALTER COLUMN "playerId" DROP NOT NULL
		`);

		// 外部キー制約を ON DELETE SET NULL で再作成
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			ADD CONSTRAINT "FK_noctown_placed_item_player"
			FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id")
			ON DELETE SET NULL
		`);

		// コメント更新
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_placed_item"."playerId" IS 'Placer player ID (null = unknown placer)'
		`);
	}

	async down(queryRunner) {
		// 外部キー制約を削除
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			DROP CONSTRAINT IF EXISTS "FK_noctown_placed_item_player"
		`);

		// null のレコードを削除（NOT NULL制約を戻すため）
		await queryRunner.query(`
			DELETE FROM "noctown_placed_item"
			WHERE "playerId" IS NULL
		`);

		// playerId を NOT NULL に戻す
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			ALTER COLUMN "playerId" SET NOT NULL
		`);

		// 外部キー制約を ON DELETE CASCADE で再作成
		await queryRunner.query(`
			ALTER TABLE "noctown_placed_item"
			ADD CONSTRAINT "FK_noctown_placed_item_player"
			FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id")
			ON DELETE CASCADE
		`);

		// コメント更新
		await queryRunner.query(`
			COMMENT ON COLUMN "noctown_placed_item"."playerId" IS 'Placer player ID'
		`);
	}
}
