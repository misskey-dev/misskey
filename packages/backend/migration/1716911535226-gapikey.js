/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Gapikey1716911535226 {
	name = 'Gapikey1716911535226';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "meta" ADD "googleAnalyticsId" character varying(1024)');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "googleAnalyticsId"');
	}
}
