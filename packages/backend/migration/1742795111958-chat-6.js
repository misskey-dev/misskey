/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat61742795111958 {
    name = 'Chat61742795111958'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room" ADD "description" character varying(2048) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "chat_room" ADD "isArchived" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "chat_room_membership" ADD "isMuted" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room_membership" DROP COLUMN "isMuted"`);
        await queryRunner.query(`ALTER TABLE "chat_room" DROP COLUMN "isArchived"`);
        await queryRunner.query(`ALTER TABLE "chat_room" DROP COLUMN "description"`);
    }
}
