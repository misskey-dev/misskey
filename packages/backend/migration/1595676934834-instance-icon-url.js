"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class instanceIconUrl1595676934834 {
    constructor() {
        this.name = 'instanceIconUrl1595676934834';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "iconUrl" character varying(256) DEFAULT null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "iconUrl"`);
    }
}
exports.instanceIconUrl1595676934834 = instanceIconUrl1595676934834;
