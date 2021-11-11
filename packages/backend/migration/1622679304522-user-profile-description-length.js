"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class userProfileDescriptionLength1622679304522 {
    constructor() {
        this.name = 'userProfileDescriptionLength1622679304522';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE character varying(2048)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "description" TYPE character varying(1024)`, undefined);
    }
}
exports.userProfileDescriptionLength1622679304522 = userProfileDescriptionLength1622679304522;
