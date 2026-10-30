/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DefaultFollowUsers1793374157987 {
	name = 'defaultFollowUsers1793374157987'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "defaultFollowedUsers" character varying(1024) array NOT NULL DEFAULT '{}'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "forciblyFollowedUsers" character varying(1024) array NOT NULL DEFAULT '{}'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "forciblyFollowedUsers"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultFollowedUsers"`);
	}
}
