/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class TweakDefaultFederationSettings1754019326356 {
    name = 'TweakDefaultFederationSettings1754019326356'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "federation" SET DEFAULT 'none'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "federation" SET DEFAULT 'all'`);
    }
}
