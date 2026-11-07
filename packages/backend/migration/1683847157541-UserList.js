/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserList1683847157541 {
    name = 'UserList1683847157541'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list" ADD "isPublic" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_48a00f08598662b9ca540521eb" ON "user_list" ("isPublic") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_48a00f08598662b9ca540521eb"`);
        await queryRunner.query(`ALTER TABLE "user_list" DROP COLUMN "isPublic"`);
    }
}
