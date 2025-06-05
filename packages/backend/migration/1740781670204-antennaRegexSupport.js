/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AntennaRegexSupport1740781670204 {
	name = 'AntennaRegexSupport1740781670204'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "antenna" ADD "useRegex" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "useRegex"`);
	}
}
