/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SystemAccounts41740993126937 {
    name = 'SystemAccounts41740993126937'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isRoot"`);
    }

    async down(queryRunner) {
        // このマイグレーションに対するダウングレードはsystem-accounts-3.jsのダウングレードで行われる
        // 経緯は https://github.com/misskey-dev/misskey/pull/15586 を参照
    }
}
