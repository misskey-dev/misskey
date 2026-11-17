/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowingRequestId1794917481157 {
    name = 'FollowingRequestId1794917481157';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "following" ADD "requestId" character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "following"."requestId" IS 'id of Follow Activity.'`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "requestId"`);
    }
};
