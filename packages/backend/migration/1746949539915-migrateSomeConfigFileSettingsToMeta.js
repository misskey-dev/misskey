/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */


export class MigrateSomeConfigFileSettingsToMeta1746949539915 {
    name = 'MigrateSomeConfigFileSettingsToMeta1746949539915'

    async up(queryRunner) {
        // $1 cannot be used in ALTER TABLE queries
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT TRUE`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "signToActivityPubGet" boolean NOT NULL DEFAULT TRUE`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "allowExternalApRedirect" boolean NOT NULL DEFAULT TRUE`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowExternalApRedirect"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "signToActivityPubGet"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`);
    }
}
