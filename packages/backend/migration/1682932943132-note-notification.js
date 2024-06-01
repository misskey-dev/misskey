/*
 * SPDX-FileCopyrightText: yukineko and tai-cat
 * SPDX-License-Identifier: AGPL-3.0-only
 */


export class NoteNotification1682932943132 {
    name = 'NoteNotification1682932943132'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_notification" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "targetUserId" character varying(32) NOT NULL, CONSTRAINT "PK_02dd5dcc82f04263ad78720dccc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d0b2c0212af304221fe1abd94" ON "note_notification" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_73b01aaac615137c472f410a99" ON "note_notification" ("targetUserId") `);
        await queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum" RENAME TO "user_profile_mutingnotificationtypes_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'note', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app', 'pollVote', 'groupInvited')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum"[]`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum_old"`);
        await queryRunner.query(`ALTER TABLE "note_notification" ADD CONSTRAINT "FK_2d0b2c0212af304221fe1abd940" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_notification" ADD CONSTRAINT "FK_73b01aaac615137c472f410a996" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_notification" DROP CONSTRAINT "FK_73b01aaac615137c472f410a996"`);
        await queryRunner.query(`ALTER TABLE "note_notification" DROP CONSTRAINT "FK_2d0b2c0212af304221fe1abd940"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'achievementEarned', 'app')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum_old"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum_old"[]`);
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum_old" RENAME TO "user_profile_mutingnotificationtypes_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73b01aaac615137c472f410a99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d0b2c0212af304221fe1abd94"`);
        await queryRunner.query(`DROP TABLE "note_notification"`);
    }
}
