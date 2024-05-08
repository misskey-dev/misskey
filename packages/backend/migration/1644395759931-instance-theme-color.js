/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class instanceThemeColor1644395759931 {
    name = 'instanceThemeColor1644395759931'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "themeColor" character varying(512)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "themeColor"`);
    }
}
