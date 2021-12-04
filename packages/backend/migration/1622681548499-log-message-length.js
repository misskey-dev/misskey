"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class logMessageLength1622681548499 {
    constructor() {
        this.name = 'logMessageLength1622681548499';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "message" TYPE character varying(2048)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "message" TYPE character varying(1024)`, undefined);
    }
}
exports.logMessageLength1622681548499 = logMessageLength1622681548499;
