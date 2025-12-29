/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: 神社ワールド機能のマイグレーション
// - NoctownPlayerにcurrentWorldIdカラムを追加
// - NoctownWorldにworldTypeとdisplayNameカラムを追加
// - SAISEN_OFFERトランザクション用のインデックスを追加

export class NoctownShrineWorld1766600000000 {
	name = 'NoctownShrineWorld1766600000000';

	async up(queryRunner) {
		// NoctownPlayer に currentWorldId カラムを追加
		await queryRunner.query(`
			ALTER TABLE "noctown_player"
			ADD COLUMN "currentWorldId" character varying(32)
		`);

		// currentWorldId の外部キー制約を追加
		await queryRunner.query(`
			ALTER TABLE "noctown_player"
			ADD CONSTRAINT "FK_noctown_player_currentWorldId"
			FOREIGN KEY ("currentWorldId")
			REFERENCES "noctown_world"("id")
			ON DELETE SET NULL
		`);

		// NoctownWorld に worldType カラムを追加
		await queryRunner.query(`
			ALTER TABLE "noctown_world"
			ADD COLUMN "worldType" character varying(32) DEFAULT 'default'
		`);

		// NoctownWorld に displayName カラムを追加
		await queryRunner.query(`
			ALTER TABLE "noctown_world"
			ADD COLUMN "displayName" character varying(128)
		`);

		// SAISEN_OFFER トランザクション用のインデックスを追加
		await queryRunner.query(`
			CREATE INDEX "IDX_noctown_transaction_log_saisen"
			ON "noctown_transaction_log" ("playerId", "type")
			WHERE "type" = 'SAISEN_OFFER'
		`);

		// currentWorldId のインデックスを追加（ワールド内プレイヤー検索用）
		await queryRunner.query(`
			CREATE INDEX "IDX_noctown_player_currentWorldId"
			ON "noctown_player" ("currentWorldId")
		`);
	}

	async down(queryRunner) {
		// インデックスを削除
		await queryRunner.query(`
			DROP INDEX IF EXISTS "IDX_noctown_player_currentWorldId"
		`);

		await queryRunner.query(`
			DROP INDEX IF EXISTS "IDX_noctown_transaction_log_saisen"
		`);

		// NoctownWorld の displayName カラムを削除
		await queryRunner.query(`
			ALTER TABLE "noctown_world"
			DROP COLUMN IF EXISTS "displayName"
		`);

		// NoctownWorld の worldType カラムを削除
		await queryRunner.query(`
			ALTER TABLE "noctown_world"
			DROP COLUMN IF EXISTS "worldType"
		`);

		// NoctownPlayer の外部キー制約を削除
		await queryRunner.query(`
			ALTER TABLE "noctown_player"
			DROP CONSTRAINT IF EXISTS "FK_noctown_player_currentWorldId"
		`);

		// NoctownPlayer の currentWorldId カラムを削除
		await queryRunner.query(`
			ALTER TABLE "noctown_player"
			DROP COLUMN IF EXISTS "currentWorldId"
		`);
	}
}
