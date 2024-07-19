/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class GDPRMode1703704097603 {
	name = 'GDPRMode1703704097603';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "meta" ADD "enableGDPRMode" boolean NOT NULL DEFAULT false');
	}

	async down(queryRunner) {
		;
		await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "enableGDPRMode"');
	}
}
