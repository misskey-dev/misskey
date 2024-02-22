/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class secondsPerSignup1708097104864 {
	name = 'secondsPerSignup1708097104864'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "secondsPerSignup" integer NOT NULL DEFAULT 0`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "secondsPerSignup"`);
	}
}
