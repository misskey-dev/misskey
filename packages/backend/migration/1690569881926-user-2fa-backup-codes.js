/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class User2faBackupCodes1690569881926 {
	name = 'User2faBackupCodes1690569881926'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "twoFactorBackupSecret" character varying array`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twoFactorBackupSecret"`);
	}
}
