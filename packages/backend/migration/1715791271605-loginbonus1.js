/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Loginbonus11715791271605 {
	name = 'Loginbonus11715791271605';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "user" ADD "getPoints" integer NOT NULL DEFAULT \'0\'');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" ADD "getPoints" integer NOT NULL DEFAULT \'0\'');
	}
}
