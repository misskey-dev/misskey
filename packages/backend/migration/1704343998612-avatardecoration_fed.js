/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AvatardecorationFed1704343998612 {
	name = 'AvatardecorationFed1704343998612';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "avatar_decoration" ADD "host" character varying(256)');
		await queryRunner.query('ALTER TABLE "avatar_decoration" ALTER COLUMN "category" SET DEFAULT \'\'');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "avatar_decoration" ALTER COLUMN "category" DROP DEFAULT');
		await queryRunner.query('ALTER TABLE "avatar_decoration" DROP COLUMN "host"');
	}
}
