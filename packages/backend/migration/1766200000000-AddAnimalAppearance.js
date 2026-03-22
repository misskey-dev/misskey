/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * マイグレーション: 動物のappearance（外見情報）カラム追加
 *
 * 目的: 動物の色がランダムで変わる問題を解決
 * - NoctownChicken: appearance (JSONB) - color, isRooster
 * - NoctownCow: appearance (JSONB) - color
 *
 * 既存データには白/holsteinBWのデフォルト値を設定
 */
export class AddAnimalAppearance1766200000000 {
	name = 'AddAnimalAppearance1766200000000';

	async up(queryRunner) {
		// NoctownChicken: appearance カラム追加
		// color: 'white' | 'brown' | 'black' | 'golden' | 'spotted'
		// isRooster: boolean
		await queryRunner.query(`
			ALTER TABLE "noctown_chicken"
			ADD "appearance" jsonb NOT NULL DEFAULT '{"color": "white", "isRooster": false}'
		`);

		// NoctownCow: appearance カラム追加
		// color: 'holsteinBW' | 'holsteinRW' | 'jersey' | 'angus' | 'highland'
		await queryRunner.query(`
			ALTER TABLE "noctown_cow"
			ADD "appearance" jsonb NOT NULL DEFAULT '{"color": "holsteinBW"}'
		`);
	}

	async down(queryRunner) {
		// NoctownCow ロールバック
		await queryRunner.query(`ALTER TABLE "noctown_cow" DROP COLUMN "appearance"`);

		// NoctownChicken ロールバック
		await queryRunner.query(`ALTER TABLE "noctown_chicken" DROP COLUMN "appearance"`);
	}
}
