"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserProfile1556746559567 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "githubId" TYPE VARCHAR(64) USING "githubId"::VARCHAR(64)`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "discordExpiresDate" TYPE VARCHAR(64) USING "discordExpiresDate"::VARCHAR(64)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`UPDATE "user_profile" SET github = FALSE, discord = FALSE`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "githubId" TYPE INTEGER USING NULL`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "discordExpiresDate" TYPE INTEGER USING NULL`);
    }
}
exports.UserProfile1556746559567 = UserProfile1556746559567;
