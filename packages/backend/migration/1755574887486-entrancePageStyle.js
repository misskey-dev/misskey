/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EntrancePageStyle1755574887486 {
    name = 'EntrancePageStyle1755574887486'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "clientOptions" jsonb NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "clientOptions"`);
    }
}
