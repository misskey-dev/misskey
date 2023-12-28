/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AbuseUserReportCategoryCamelCase1703749589203 {
    name = 'AbuseUserReportCategoryCamelCase1703749589203'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'personalInfoLeak' WHERE "category" = 'personalinfoleak'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'selfHarm' WHERE "category" = 'selfharm'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'criticalBreach' WHERE "category" = 'criticalbreach'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'otherBreach' WHERE "category" = 'otherbreach'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'violationRights' WHERE "category" = 'violationrights'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'violationRightsOther' WHERE "category" = 'violationrightsother'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'notLike' WHERE "category" = 'notlike'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'personalinfoleak' WHERE "category" = 'personalInfoLeak'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'selfharm' WHERE "category" = 'selfHarm'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'criticalbreach' WHERE "category" = 'criticalBreach'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'otherbreach' WHERE "category" = 'otherBreach'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'violationrights' WHERE "category" = 'violationRights'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'violationrightsother' WHERE "category" = 'violationRightsOther'`);
        await queryRunner.query(`UPDATE "abuse_user_report" SET "category" = 'notlike' WHERE "category" = 'notLike'`);
    }
}
