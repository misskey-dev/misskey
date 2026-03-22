/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: FR-030 ドロップアイテムの絵文字表現と拾得システム
// NoctownItemにemojiカラム追加
// NoctownDroppedItemにdroppedByPlayerId、quantityカラム追加
export class AddDroppedItemColumns1766300000000 {
	name = 'AddDroppedItemColumns1766300000000';

	async up(queryRunner) {
		// Add emoji column to noctown_item
		await queryRunner.query(`
			ALTER TABLE "noctown_item"
			ADD COLUMN IF NOT EXISTS "emoji" varchar(8) DEFAULT NULL
		`);

		// Add droppedByPlayerId column to noctown_dropped_item
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			ADD COLUMN IF NOT EXISTS "droppedByPlayerId" varchar(32) DEFAULT NULL
		`);

		// Add quantity column to noctown_dropped_item
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			ADD COLUMN IF NOT EXISTS "quantity" integer NOT NULL DEFAULT 1
		`);

		// Add index for droppedByPlayerId
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_noctown_dropped_item_droppedByPlayerId"
			ON "noctown_dropped_item" ("droppedByPlayerId")
		`);

		// Add foreign key constraint for droppedByPlayerId
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			ADD CONSTRAINT "FK_noctown_dropped_item_droppedByPlayerId"
			FOREIGN KEY ("droppedByPlayerId") REFERENCES "noctown_player"("id")
			ON DELETE SET NULL
		`);
	}

	async down(queryRunner) {
		// Remove foreign key constraint
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			DROP CONSTRAINT IF EXISTS "FK_noctown_dropped_item_droppedByPlayerId"
		`);

		// Remove index
		await queryRunner.query(`
			DROP INDEX IF EXISTS "IDX_noctown_dropped_item_droppedByPlayerId"
		`);

		// Remove columns
		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			DROP COLUMN IF EXISTS "quantity"
		`);

		await queryRunner.query(`
			ALTER TABLE "noctown_dropped_item"
			DROP COLUMN IF EXISTS "droppedByPlayerId"
		`);

		await queryRunner.query(`
			ALTER TABLE "noctown_item"
			DROP COLUMN IF EXISTS "emoji"
		`);
	}
}
