"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class userHideOnlineStatus1618639857000 {
    constructor() {
        this.name = 'userHideOnlineStatus1618639857000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "hideOnlineStatus" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hideOnlineStatus"`);
    }
}
exports.userHideOnlineStatus1618639857000 = userHideOnlineStatus1618639857000;
