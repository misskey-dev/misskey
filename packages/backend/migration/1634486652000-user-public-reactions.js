"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class userPublicReactions1634486652000 {
    constructor() {
        this.name = 'userPublicReactions1634486652000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "publicReactions" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "publicReactions"`);
    }
}
exports.userPublicReactions1634486652000 = userPublicReactions1634486652000;
