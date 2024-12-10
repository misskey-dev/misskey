/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EnableEnhancedServerStats1732635823870 {
    name = 'EnableEnhancedServerStats1732635823870'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableEnhancedServerStats" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableEnhancedServerStats"`);
    }
}
