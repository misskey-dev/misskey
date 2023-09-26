/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ClippedCount1694915420864 {
    name = 'ClippedCount1694915420864'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "clippedCount" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "clippedCount"`);
    }
}
