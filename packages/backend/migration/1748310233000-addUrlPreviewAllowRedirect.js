/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddUrlPreviewAllowRedirect1748310233000 {
    name = 'AddUrlPreviewAllowRedirect1748310233000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "urlPreviewAllowRedirect" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "urlPreviewAllowRedirect"`);
    }
}
