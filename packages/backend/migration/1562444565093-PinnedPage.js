/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PinnedPage1562444565093 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "pinnedPageId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "UQ_6dc44f1ceb65b1e72bacef2ca27" UNIQUE ("pinnedPageId")`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_6dc44f1ceb65b1e72bacef2ca27" FOREIGN KEY ("pinnedPageId") REFERENCES "page"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_6dc44f1ceb65b1e72bacef2ca27"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "UQ_6dc44f1ceb65b1e72bacef2ca27"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "pinnedPageId"`);
    }
}
