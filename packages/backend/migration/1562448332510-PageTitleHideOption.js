"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PageTitleHideOption1562448332510 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" ADD "hideTitleWhenPinned" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "hideTitleWhenPinned"`);
    }
}
exports.PageTitleHideOption1562448332510 = PageTitleHideOption1562448332510;
