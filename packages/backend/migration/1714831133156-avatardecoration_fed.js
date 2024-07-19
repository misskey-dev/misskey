/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AvatardecorationFed1714831133156 {
	name = 'AvatardecorationFed1714831133156';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "avatar_decoration" DROP COLUMN "host"');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "avatar_decoration" ADD "host" character varying(256)');
	}
}
