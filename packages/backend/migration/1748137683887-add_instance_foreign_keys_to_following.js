/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class AddInstanceForeignKeysToFollowing1748137683887 {
	name = 'AddInstanceForeignKeysToFollowing1748137683887'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "following" ADD CONSTRAINT "FK_following_followerHost" FOREIGN KEY ("followerHost") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "following" ADD CONSTRAINT "FK_following_followeeHost" FOREIGN KEY ("followeeHost") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "following" DROP CONSTRAINT "FK_following_followeeHost"`);
		await queryRunner.query(`ALTER TABLE "following" DROP CONSTRAINT "FK_following_followerHost"`);
	}
}
