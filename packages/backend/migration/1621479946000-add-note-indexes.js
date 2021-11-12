"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class addNoteIndexes1621479946000 {
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
exports.addNoteIndexes1621479946000 = addNoteIndexes1621479946000;
