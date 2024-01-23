/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserProfileBirthdayIndex1706011243939 {
    name = 'UserProfileBirthdayIndex1706011243939'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_58699f75b9cf904f5f007909cb" ON "user_profile" ("birthday") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_58699f75b9cf904f5f007909cb"`);
    }
}
