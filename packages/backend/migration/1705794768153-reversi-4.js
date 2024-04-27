/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi41705794768153 {
    name = 'Reversi41705794768153'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_game" ADD "endedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`COMMENT ON COLUMN "reversi_game"."endedAt" IS 'The ended date of the ReversiGame.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "reversi_game"."endedAt" IS 'The ended date of the ReversiGame.'`);
        await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "endedAt"`);
    }
}
