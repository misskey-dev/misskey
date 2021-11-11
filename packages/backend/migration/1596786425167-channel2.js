"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class channel21596786425167 {
    constructor() {
        this.name = 'channel21596786425167';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_following" ADD "readCursor" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_following" DROP COLUMN "readCursor"`);
    }
}
exports.channel21596786425167 = channel21596786425167;
