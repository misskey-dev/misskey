/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UrlPreviewSensitiveList1782581064131 {
    name = 'UrlPreviewSensitiveList1782581064131'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "urlPreviewSensitiveList" character varying(3072) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "urlPreviewSensitiveList"`);
    }
}
