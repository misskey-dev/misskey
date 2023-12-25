/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EmojiImprove1684386446061 {
    name = 'EmojiImprove1684386446061'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "localOnly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "emoji" ADD "isSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "emoji" ADD "roleIdsThatCanBeUsedThisEmojiAsReaction" character varying(128) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "roleIdsThatCanBeUsedThisEmojiAsReaction"`);
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "isSensitive"`);
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "localOnly"`);
    }
}
