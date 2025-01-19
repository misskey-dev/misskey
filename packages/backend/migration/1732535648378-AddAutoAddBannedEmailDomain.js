/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAutoAddBannedEmailDomain1732535648378 {
    name = 'AddAutoAddBannedEmailDomain1732535648378'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableAutoAddBannedEmailDomain" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableAutoAddBannedEmailDomain"`);
    }
}
