/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListUserId21696808725134 {
    name = 'UserListUserId21696808725134'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" ALTER COLUMN "userListUserId" DROP DEFAULT`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" ALTER COLUMN "userListUserId" SET DEFAULT ''`);
    }
}
