/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi21705654039457 {
    name = 'Reversi21705654039457'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "user1Accepted" TO "user1Ready"`);
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "user2Accepted" TO "user2Ready"`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "user1Ready" TO "user1Accepted"`);
			await queryRunner.query(`ALTER TABLE "reversi_game" RENAME COLUMN "user2Ready" TO "user2Accepted"`);
    }
}
