/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MetaCacheSettings1696373953614 {
    name = 'MetaCacheSettings1696373953614'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "perLocalUserUserTimelineCacheMax" integer NOT NULL DEFAULT '300'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "perRemoteUserUserTimelineCacheMax" integer NOT NULL DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "perUserHomeTimelineCacheMax" integer NOT NULL DEFAULT '300'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "perUserListTimelineCacheMax" integer NOT NULL DEFAULT '300'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "perUserListTimelineCacheMax"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "perUserHomeTimelineCacheMax"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "perRemoteUserUserTimelineCacheMax"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "perLocalUserUserTimelineCacheMax"`);
    }
}
