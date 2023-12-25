/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ad1677054292210 {
	name = 'ad1677054292210';
	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "ad" ADD "dayOfWeek" integer NOT NULL Default 0`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "ad" DROP COLUMN "dayOfWeek"`);
	}
}
