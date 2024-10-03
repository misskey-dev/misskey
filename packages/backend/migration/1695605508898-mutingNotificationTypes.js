/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MutingNotificationTypes1695605508898 {
    name = 'MutingNotificationTypes1695605508898'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum" RENAME TO "user_profile_mutingnotificationtypes_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum" AS ENUM('note', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app', 'test', 'pollVote', 'groupInvited')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum"[]`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum_old"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'achievementEarned', 'app')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum_old"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum_old"[]`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum_old" RENAME TO "user_profile_mutingnotificationtypes_enum"`);
    }
}
