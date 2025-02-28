/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class GoogleAnalytics1739006797620 {
    name = 'GoogleAnalytics1739006797620'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "googleAnalyticsMeasurementId" character varying(64)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "googleAnalyticsMeasurementId"`);
    }
}
