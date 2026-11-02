/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Testcaptcha1728550878802 {
    name = 'Testcaptcha1728550878802'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "enableTestcaptcha" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableTestcaptcha"`);
    }
}
