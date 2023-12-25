/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class webhook21648816172177 {
    name = 'webhook21648816172177'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "webhook" ADD "latestSentAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "webhook" ADD "latestStatus" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "webhook" DROP COLUMN "latestStatus"`);
        await queryRunner.query(`ALTER TABLE "webhook" DROP COLUMN "latestSentAt"`);
    }
}
