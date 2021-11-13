"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class fixChannelUserId1629288472000 {
    constructor() {
        this.name = 'fixChannelUserId1629288472000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "userId" DROP NOT NULL;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "userId" SET NOT NULL;`);
    }
}
exports.fixChannelUserId1629288472000 = fixChannelUserId1629288472000;
