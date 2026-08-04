/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat21742608337548 {
    name = 'Chat21742608337548'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "chatScope" character varying(128) NOT NULL DEFAULT 'mutual'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_185b6b5afa707b5d36d1ce3144" ON "chat_room_membership" ("userId", "roomId") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_185b6b5afa707b5d36d1ce3144"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "chatScope"`);
    }
}
