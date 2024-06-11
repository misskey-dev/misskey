/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ShortName1695440131671 {
    name = 'ShortName1695440131671'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "shortName" character varying(64)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "shortName"`);
    }
}
