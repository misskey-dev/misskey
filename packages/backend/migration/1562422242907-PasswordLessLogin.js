"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PasswordLessLogin1562422242907 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "usePasswordLessLogin" boolean DEFAULT false NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "usePasswordLessLogin"`);
    }
}
exports.PasswordLessLogin1562422242907 = PasswordLessLogin1562422242907;
