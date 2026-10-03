/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleDisplayVisibility1783059479536 {
    name = 'RoleDisplayVisibility1783059479536';

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "hiddenRoleIds" character varying(32) array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "role" ADD "isPublicDisplayRequired" boolean NOT NULL DEFAULT false`);

        // 既存のロールについてはすべて強制表示とする（新規作成分についてはfalse）
        await queryRunner.query(`UPDATE "role" SET "isPublicDisplayRequired" = true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "isPublicDisplayRequired"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hiddenRoleIds"`);
    }
}
