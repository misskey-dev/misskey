/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi61706081514499 {
    name = 'Reversi61706081514499'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" ADD "noIrregularRules" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "noIrregularRules"`);
    }
}
