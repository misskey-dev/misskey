/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserProfile1556746559567 {
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
