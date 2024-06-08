/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SupportMcaptcha1704373210054 {
    name = 'SupportMcaptcha1704373210054'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableMcaptcha" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "mcaptchaSitekey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "mcaptchaSecretKey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "mcaptchaInstanceUrl" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "mcaptchaInstanceUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "mcaptchaSecretKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "mcaptchaSitekey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableMcaptcha"`);
    }
}
