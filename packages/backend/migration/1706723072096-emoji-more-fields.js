/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EmojiMoreFields1706723072096 {
    name = 'EmojiMoreFields1706723072096'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "requestedBy" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "emoji" ADD "memo" character varying(8192) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "memo"`);
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "requestedBy"`);
    }
}
