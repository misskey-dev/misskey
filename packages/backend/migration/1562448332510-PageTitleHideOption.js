/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PageTitleHideOption1562448332510 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" ADD "hideTitleWhenPinned" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "hideTitleWhenPinned"`);
    }
}
