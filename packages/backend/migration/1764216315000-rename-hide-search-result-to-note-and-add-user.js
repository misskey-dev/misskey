/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RenameHideSearchResultToNoteAndAddUser1764216315000 {
    name = 'RenameHideSearchResultToNoteAndAddUser1764216315000'

    async up(queryRunner) {
        // hideSearchResult を hideNoteSearchResult にリネーム
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "hideSearchResult" TO "hideNoteSearchResult"`);

        // hideUserSearchResult を追加
        await queryRunner.query(`ALTER TABLE "user" ADD "hideUserSearchResult" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hideUserSearchResult"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "hideNoteSearchResult" TO "hideSearchResult"`);
    }
}
