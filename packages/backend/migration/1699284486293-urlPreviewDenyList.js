/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UrlPreviewDenyList1699284486293 {
    name = 'UrlPreviewDenyList1699284486293'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "urlPreviewDenyList" character varying(3072) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "urlPreviewDenyList"`);
    }
}
