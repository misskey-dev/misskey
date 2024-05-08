/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class v12121580508795118 {
    constructor() {
        this.name = 'v12121580508795118';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twitter"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twitterAccessToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twitterAccessTokenSecret"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twitterUserId"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twitterScreenName"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "github"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "githubAccessToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "githubId"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "githubLogin"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discord"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordAccessToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordRefreshToken"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordExpiresDate"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordId"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordUsername"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordDiscriminator"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "integrations" jsonb NOT NULL DEFAULT '{}'`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "integrations"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordDiscriminator" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordUsername" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordId" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordExpiresDate" character varying(64)`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordRefreshToken" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discordAccessToken" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "discord" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "githubLogin" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "githubId" character varying(64)`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "githubAccessToken" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "github" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twitterScreenName" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twitterUserId" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twitterAccessTokenSecret" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twitterAccessToken" character varying(64) DEFAULT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twitter" boolean NOT NULL DEFAULT false`, undefined);
    }
}
