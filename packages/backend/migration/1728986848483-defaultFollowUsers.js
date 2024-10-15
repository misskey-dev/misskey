/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DefaultFollowUsers1728986848483 {
	name = 'defaultFollowUsers1728986848483'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "defaultFollowedUsers" character varying(1024) array NOT NULL DEFAULT '{}'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "permanentFollowedUsers" character varying(1024) array NOT NULL DEFAULT '{}'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "permanentFollowedUsers"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultFollowedUsers"`);
	}
}
