/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi51705798904141 {
    name = 'Reversi51705798904141'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" ADD "timeLimitForEachTurn" smallint NOT NULL DEFAULT '90'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "timeLimitForEachTurn"`);
    }
}
