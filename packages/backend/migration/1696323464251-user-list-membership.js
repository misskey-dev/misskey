/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListMembership1696323464251 {
    name = 'UserListMembership1696323464251'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_joining" RENAME TO "user_list_membership"`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user_list_membership" RENAME TO "user_list_joining"`);
    }
}
