/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi1705475608437 {
    name = 'Reversi1705475608437'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" ALTER COLUMN "createdAt" DROP DEFAULT`);
    }
}
