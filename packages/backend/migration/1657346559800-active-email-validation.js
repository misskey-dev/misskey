/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class activeEmailValidation1657346559800 {
    name = 'activeEmailValidation1657346559800'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableActiveEmailValidation" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableActiveEmailValidation"`);
    }
}
