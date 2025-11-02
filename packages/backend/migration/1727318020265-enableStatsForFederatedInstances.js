/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EnableStatsForFederatedInstances1727318020265 {
    name = 'EnableStatsForFederatedInstances1727318020265'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableStatsForFederatedInstances" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableStatsForFederatedInstances"`);
    }
}
