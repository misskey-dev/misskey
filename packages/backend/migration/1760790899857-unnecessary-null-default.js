/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UnnecessaryNullDefault1760790899857 {
    name = 'UnnecessaryNullDefault1760790899857'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "userId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "systemWebhookId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "urlPreviewUserAgent" DROP DEFAULT`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "urlPreviewUserAgent" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "systemWebhookId" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "userId" SET DEFAULT NULL`);
    }
}
