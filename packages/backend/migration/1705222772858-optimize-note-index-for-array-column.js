/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeNoteIndexForArrayColumns1705222772858 {
    name = 'OptimizeNoteIndexForArrayColumns1705222772858'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_FILE_IDS" ON "note" using gin ("fileIds")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_NOTE_FILE_IDS"`);
    }
}
