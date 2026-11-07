/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class WithReplies1696222183852 {
    name = 'WithReplies1696222183852'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "following" ADD "withReplies" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_list_joining" ADD "withReplies" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_d74d8ab5efa7e3bb82825c0fa2" ON "following" ("followeeId", "followerHost") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_d74d8ab5efa7e3bb82825c0fa2"`);
        await queryRunner.query(`ALTER TABLE "user_list_joining" DROP COLUMN "withReplies"`);
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "withReplies"`);
    }
}
