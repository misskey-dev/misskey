/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAutoDeleteNoteSettings1761287521000 {
    name = 'AddAutoDeleteNoteSettings1761287521000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "autoDeleteNotesAfterDays" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD "autoDeleteKeepFavorites" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "autoDeleteKeepFavorites"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "autoDeleteNotesAfterDays"`);
    }
}
