/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class HashtagTableDefaults1784899839024 {
    name = 'HashtagTableDefaults1784899839024'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedUserIds" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedLocalUserIds" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedRemoteUserIds" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedUserIds" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedLocalUserIds" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedRemoteUserIds" SET DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedRemoteUserIds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedLocalUserIds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "attachedUserIds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedRemoteUserIds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedLocalUserIds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "hashtag" ALTER COLUMN "mentionedUserIds" DROP DEFAULT`);
    }
}
