/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MigrateSomeConfigFileSettingsToMeta1746949539915 {
    name = 'MigrateSomeConfigFileSettingsToMeta1746949539915'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "signToActivityPubGet" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "allowExternalApRedirect" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowExternalApRedirect"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "signToActivityPubGet"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`);
    }
}
