/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class cleanup1675404035646 {
    name = 'cleanup1675404035646'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableTwitterIntegration"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableGithubIntegration"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableDiscordIntegration"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "twitterConsumerKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "twitterConsumerSecret"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "githubClientId"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "githubClientSecret"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "discordClientId"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "discordClientSecret"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "integrations"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "integrations" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "discordClientSecret" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "discordClientId" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "githubClientSecret" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "githubClientId" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "twitterConsumerSecret" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "twitterConsumerKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableDiscordIntegration" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableGithubIntegration" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableTwitterIntegration" boolean NOT NULL DEFAULT false`);
    }
}
