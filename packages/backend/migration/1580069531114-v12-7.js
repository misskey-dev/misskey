/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class v1271580069531114 {
    constructor() {
        this.name = 'v1271580069531114';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "users" character varying(1024) array NOT NULL DEFAULT '{}'::varchar[]`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "caseSensitive" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TYPE "public"."antenna_src_enum" RENAME TO "antenna_src_enum_old"`, undefined);
        await queryRunner.query(`CREATE TYPE "antenna_src_enum" AS ENUM('home', 'all', 'users', 'list')`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ALTER COLUMN "src" TYPE "antenna_src_enum" USING "src"::"text"::"antenna_src_enum"`, undefined);
        await queryRunner.query(`DROP TYPE "antenna_src_enum_old"`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "antenna_src_enum_old" AS ENUM('home', 'all', 'list')`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ALTER COLUMN "src" TYPE "antenna_src_enum_old" USING "src"::"text"::"antenna_src_enum_old"`, undefined);
        await queryRunner.query(`DROP TYPE "antenna_src_enum"`, undefined);
        await queryRunner.query(`ALTER TYPE "antenna_src_enum_old" RENAME TO  "antenna_src_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "caseSensitive"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "users"`, undefined);
    }
}
