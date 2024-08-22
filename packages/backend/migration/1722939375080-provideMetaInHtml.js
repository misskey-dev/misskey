/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ProvideMetaInHtml1722939375080 {
    name = 'ProvideMetaInHtml1722939375080'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "provideMetaInHtml" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "provideMetaInHtml"`);
    }
}
