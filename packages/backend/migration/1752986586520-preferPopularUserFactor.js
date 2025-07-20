/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PreferPopularUserFactor1752986586520 {
    name = 'PreferPopularUserFactor1752986586520'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."meta_preferpopularuserfactor_enum" AS ENUM('follower', 'pv', 'none')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "preferPopularUserFactor" "public"."meta_preferpopularuserfactor_enum" NOT NULL DEFAULT 'follower'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "preferPopularUserFactor"`);
        await queryRunner.query(`DROP TYPE "public"."meta_preferpopularuserfactor_enum"`);
    }
}
