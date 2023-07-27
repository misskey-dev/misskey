/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class userGroupAntenna1581695816408 {
    constructor() {
        this.name = 'userGroupAntenna1581695816408';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "userGroupJoiningId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TYPE "public"."antenna_src_enum" RENAME TO "antenna_src_enum_old"`, undefined);
        await queryRunner.query(`CREATE TYPE "antenna_src_enum" AS ENUM('home', 'all', 'users', 'list', 'group')`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ALTER COLUMN "src" TYPE "antenna_src_enum" USING "src"::"text"::"antenna_src_enum"`, undefined);
        await queryRunner.query(`DROP TYPE "antenna_src_enum_old"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "users"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "users" character varying(1024) array NOT NULL DEFAULT '{}'::varchar[]`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD CONSTRAINT "FK_ccbf5a8c0be4511133dcc50ddeb" FOREIGN KEY ("userGroupJoiningId") REFERENCES "user_group_joining"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP CONSTRAINT "FK_ccbf5a8c0be4511133dcc50ddeb"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "users"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "users" character varying array NOT NULL DEFAULT '{}'`, undefined);
        await queryRunner.query(`CREATE TYPE "antenna_src_enum_old" AS ENUM('home', 'all', 'users', 'list')`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ALTER COLUMN "src" TYPE "antenna_src_enum_old" USING "src"::"text"::"antenna_src_enum_old"`, undefined);
        await queryRunner.query(`DROP TYPE "antenna_src_enum"`, undefined);
        await queryRunner.query(`ALTER TYPE "antenna_src_enum_old" RENAME TO  "antenna_src_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "userGroupJoiningId"`, undefined);
    }
}
