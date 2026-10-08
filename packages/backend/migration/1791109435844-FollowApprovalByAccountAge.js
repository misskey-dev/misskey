/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowApprovalByAccountAge1791109435844 {
    name = 'FollowApprovalByAccountAge1791109435844';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "followApprovalLocalSeconds" integer`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "followApprovalRemoteSeconds" integer`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "followApprovalRemoteSeconds"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "followApprovalLocalSeconds"`);
    }
}
