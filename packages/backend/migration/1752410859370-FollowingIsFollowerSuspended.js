/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowingIsFollowerSuspended1752410859370 {
    name = 'FollowingIsFollowerSuspended1752410859370'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_ce62b50d882d4e9dee10ad0d2f"`);
        await queryRunner.query(`ALTER TABLE "following" ADD "isFollowerSuspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_1896254b78a41a50e0396fdabd" ON "following" ("followeeId", "followerHost", "isFollowerSuspended", "isFollowerHibernated") `);
        await queryRunner.query(`CREATE INDEX "IDX_d2b8dbf0b772042f4fe241a29d" ON "following" ("followerId", "followeeId", "isFollowerSuspended") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_d2b8dbf0b772042f4fe241a29d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1896254b78a41a50e0396fdabd"`);
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "isFollowerSuspended"`);
        await queryRunner.query(`CREATE INDEX "IDX_ce62b50d882d4e9dee10ad0d2f" ON "following" ("followeeId", "followerHost", "isFollowerHibernated") `);
    }
}
