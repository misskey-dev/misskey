/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PreventAiLarning1683682889948 {
    name = 'PreventAiLarning1683682889948'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "preventAiLarning" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "preventAiLarning"`);
    }
}
