"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class apUrl1585772678853 {
    constructor() {
        this.name = 'apUrl1585772678853';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "url" character varying(512)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "url"`, undefined);
    }
}
exports.apUrl1585772678853 = apUrl1585772678853;
