/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi31705793785675 {
    name = 'Reversi31705793785675'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "surrendered" TO "surrenderedUserId"`);
        await queryRunner.query(`ALTER TABLE "reversi_game" ADD "timeoutUserId" character varying(32)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "timeoutUserId"`);
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "surrenderedUserId" TO "surrendered"`);
    }
}
