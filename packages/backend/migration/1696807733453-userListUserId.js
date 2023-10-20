/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListUserId1696807733453 {
    name = 'UserListUserId1696807733453'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD "userListUserId" character varying(32) NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "user_list_membership" SET "userListUserId" = "user_list"."userId" FROM "user_list" WHERE "user_list_membership"."userListId" = "user_list"."id"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP COLUMN "userListUserId"`);
    }
}
