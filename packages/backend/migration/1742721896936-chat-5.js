/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat51742721896936 {
    name = 'Chat51742721896936'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" ADD "ignored" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" DROP COLUMN "ignored"`);
    }
}
