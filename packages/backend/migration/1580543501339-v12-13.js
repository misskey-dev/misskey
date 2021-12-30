"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class v12131580543501339 {
    constructor() {
        this.name = 'v12131580543501339';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_TAGS" ON "note" USING gin ("tags")`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_NOTE_TAGS"`, undefined);
    }
}
exports.v12131580543501339 = v12131580543501339;
