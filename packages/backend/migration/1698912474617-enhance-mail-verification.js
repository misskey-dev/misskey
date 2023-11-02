/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EnhanceMailVerification1698912474617 {
    name = 'EnhanceMailVerification1698912474617'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "emailVerificationExpiresIn" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emailVerificationExpiresIn"`);
    }
}
