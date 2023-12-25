/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ffVisibility1636197624383 {
    constructor() {
        this.name = 'ffVisibility1636197624383';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."user_profile_ffvisibility_enum" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "ffVisibility" "public"."user_profile_ffvisibility_enum" NOT NULL DEFAULT 'public'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "ffVisibility"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_ffvisibility_enum"`);
    }
}
