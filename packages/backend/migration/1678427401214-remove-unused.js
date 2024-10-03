/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class removeUnused1678427401214 {
    name = 'removeUnused1678427401214'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "pinnedPages"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "pinnedClipId"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "pinnedClipId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "pinnedPages" character varying(512) array NOT NULL DEFAULT '{/featured,/channels,/explore,/pages,/about-misskey}'`);
    }
}
