/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListJoining1558266512381 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90f7da835e4c10aca6853621e1" ON "user_list_joining" ("userId", "userListId") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_90f7da835e4c10aca6853621e1"`);
    }
}
