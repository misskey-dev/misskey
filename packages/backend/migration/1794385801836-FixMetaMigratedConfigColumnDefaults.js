/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { loadConfig } from './js/migration-config.js';

/**
 * 1746949539915-migrateSomeConfigFileSettingsToMeta は設定ファイルの値をカラムの DEFAULT として ADD COLUMN するため、
 * カラムの DEFAULT が設定ファイルに依存し、エンティティ (MiMeta) の default: true と食い違う場合がある。
 * (特に proxyRemoteFiles は設定ファイルで未指定だと false になり、新規インスタンスの meta レコードが false で作成されてしまう)
 *
 * 既存レコードの値 (コントロールパネルの設定) は変更せず、カラムの DEFAULT のみエンティティに揃える。
 */
export class FixMetaMigratedConfigColumnDefaults1794385801836 {
    name = 'FixMetaMigratedConfigColumnDefaults1794385801836'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "proxyRemoteFiles" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "signToActivityPubGet" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "allowExternalApRedirect" SET DEFAULT true`);
    }

    async down(queryRunner) {
        const config = loadConfig();
        // $1 cannot be used in ALTER TABLE queries
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "allowExternalApRedirect" SET DEFAULT ${!config.disallowExternalApRedirect}`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "signToActivityPubGet" SET DEFAULT ${config.signToActivityPubGet}`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "proxyRemoteFiles" SET DEFAULT ${config.proxyRemoteFiles}`);
    }
}
