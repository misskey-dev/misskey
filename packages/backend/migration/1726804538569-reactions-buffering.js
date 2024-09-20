/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ReactionsBuffering1726804538569 {
    name = 'ReactionsBuffering1726804538569'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableReactionsBuffering" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableReactionsBuffering"`);
    }
}
