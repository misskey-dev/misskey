/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SensitiveAd1757823175259 {
    name = 'SensitiveAd1757823175259'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" ADD "isSensitive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" DROP COLUMN "isSensitive"`);
    }
}
