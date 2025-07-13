/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
module.exports = class FollowingIsFollowerSuspendedCopySuspendedState1752410900000 {
    name = 'FollowingIsFollowerSuspendedCopySuspendedState1752410900000'

    async up(queryRunner) {
			// Update existing records based on user suspension status
			await queryRunner.query(`
				UPDATE "following"
				SET "isFollowerSuspended" = "user"."isSuspended"
				FROM "user"
				WHERE "following"."followerId" = "user"."id"
			`);
    }

    async down(queryRunner) {
    }
}
