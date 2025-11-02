/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RefineAbuseUserReport1728085812127 {
    name = 'RefineAbuseUserReport1728085812127'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "moderationNote" character varying(8192) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "resolvedAs" character varying(128)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "resolvedAs"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "moderationNote"`);
    }
}
