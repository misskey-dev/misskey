"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ad21620364649428 {
    constructor() {
        this.name = 'ad21620364649428';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" ADD "ratio" integer NOT NULL DEFAULT '1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ad" DROP COLUMN "ratio"`);
    }
}
exports.ad21620364649428 = ad21620364649428;
