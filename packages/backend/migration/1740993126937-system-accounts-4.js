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
        // down 実行時は isRoot = true のユーザーが存在しなくなるため手動で対応する必要あり
        await queryRunner.query(`ALTER TABLE "user" ADD "isRoot" boolean NOT NULL DEFAULT false`);
    }
}
