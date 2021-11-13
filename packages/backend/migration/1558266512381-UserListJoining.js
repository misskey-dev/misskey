"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserListJoining1558266512381 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90f7da835e4c10aca6853621e1" ON "user_list_joining" ("userId", "userListId") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_90f7da835e4c10aca6853621e1"`);
    }
}
exports.UserListJoining1558266512381 = UserListJoining1558266512381;
