/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AvatarDecoration21697941908548 {
    name = 'AvatarDecoration21697941908548'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarDecorations"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarDecorations" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarDecorations"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarDecorations" character varying(512) array NOT NULL DEFAULT '{}'`);
    }
}
