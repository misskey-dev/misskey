/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserProfilePasswordComment1790477603333 {
    name = 'UserProfilePasswordComment1790477603333'

    async up(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."password" IS 'The password hash of the User. It will be null if the origin of the user is remote.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."password" IS 'The password hash of the User. It will be null if the origin of the user is local.'`);
    }
}
