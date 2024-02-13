/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListUserId1696807733453 {
    name = 'UserListUserId1696807733453'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD "userListUserId" character varying(32) NOT NULL DEFAULT ''`);
				const memberships = await queryRunner.query(`SELECT "id", "userListId" FROM "user_list_membership"`);
				for(let i = 0; i < memberships.length; i++) {
					const userList = await queryRunner.query(`SELECT "userId" FROM "user_list" WHERE "id" = $1`, [memberships[i].userListId]);
					await queryRunner.query(`UPDATE "user_list_membership" SET "userListUserId" = $1 WHERE "id" = $2`, [userList[0].userId, memberships[i].id]);
				}
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP COLUMN "userListUserId"`);
    }
}
