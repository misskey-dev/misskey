/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {loadConfig} from "./js/migration-config.js";

export class MigrateSomeConfigFileSettingsToMeta1746949539915 {
    name = 'MigrateSomeConfigFileSettingsToMeta1746949539915'

    async up(queryRunner) {
        const config = loadConfig();
        // $1 cannot be used in ALTER TABLE queries
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT ${config.proxyRemoteFiles}`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "signToActivityPubGet" boolean NOT NULL DEFAULT ${config.signToActivityPubGet}`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "allowExternalApRedirect" boolean NOT NULL DEFAULT ${!config.disallowExternalApRedirect}`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowExternalApRedirect"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "signToActivityPubGet"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`);
    }
}
