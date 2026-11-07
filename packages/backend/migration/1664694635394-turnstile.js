/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class turnstile1664694635394 {
    name = 'turnstile1664694635394'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableTurnstile" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "turnstileSiteKey" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "turnstileSecretKey" character varying(64)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "turnstileSecretKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "turnstileSiteKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableTurnstile"`);
    }
}
