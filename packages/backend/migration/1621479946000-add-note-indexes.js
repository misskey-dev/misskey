/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class addNoteIndexes1621479946000 {
    constructor() {
        this.name = 'addNoteIndexes1621479946000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_MENTIONS" ON "note" USING gin ("mentions")`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_VISIBLE_USER_IDS" ON "note" USING gin ("visibleUserIds")`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_NOTE_MENTIONS"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_NOTE_VISIBLE_USER_IDS"`, undefined);
    }
}
