"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class deleteLog1634902659689 {
    constructor() {
        this.name = 'deleteLog1634902659689';
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE "log"`);
    }
    async down(queryRunner) {
    }
}
exports.deleteLog1634902659689 = deleteLog1634902659689;
