/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class foreignKeyReports1651224615271 {
    name = 'foreignKeyReports1651224615271'

    async up(queryRunner) {
        await Promise.all([
            queryRunner.query(`ALTER INDEX "public"."IDX_seoignmeoprigmkpodgrjmkpormg" RENAME TO "IDX_c8cc87bd0f2f4487d17c651fbf"`),
            queryRunner.query(`DROP INDEX "public"."IDX_note_on_channelId_and_id_desc"`),

            // remove unnecessary default null, see also down
            queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "followersUri" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "session" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "appId" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "name" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "description" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "iconUrl" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "softwareName" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "softwareVersion" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "name" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "description" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "maintainerName" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "maintainerEmail" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "iconUrl" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "faviconUrl" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "themeColor" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "clip" ALTER COLUMN "description" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "channelId" DROP DEFAULT`),
            queryRunner.query(`ALTER TABLE "abuse_user_report" ALTER COLUMN "comment" DROP DEFAULT`),

            queryRunner.query(`CREATE INDEX "IDX_315c779174fe8247ab324f036e" ON "drive_file" ("isLink")`),
            queryRunner.query(`CREATE INDEX "IDX_f22169eb10657bded6d875ac8f" ON "note" ("channelId")`),
            //queryRunner.query(`CREATE INDEX "IDX_a9021cc2e1feb5f72d3db6e9f5" ON "abuse_user_report" ("targetUserId")`),

            //queryRunner.query(`DELETE FROM "abuse_user_report" WHERE "targetUserId" NOT IN (SELECT "id" FROM "user")`).then(() => {
            //    queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            //}),

            queryRunner.query(`ALTER TABLE "poll" ADD CONSTRAINT "UQ_da851e06d0dfe2ef397d8b1bf1b" UNIQUE ("noteId")`),
            queryRunner.query(`ALTER TABLE "user_keypair" ADD CONSTRAINT "UQ_f4853eb41ab722fe05f81cedeb6" UNIQUE ("userId")`),
            queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "UQ_51cb79b5555effaf7d69ba1cff9" UNIQUE ("userId")`),
            queryRunner.query(`ALTER TABLE "user_publickey" ADD CONSTRAINT "UQ_10c146e4b39b443ede016f6736d" UNIQUE ("userId")`),
            queryRunner.query(`ALTER TABLE "promo_note" ADD CONSTRAINT "UQ_e263909ca4fe5d57f8d4230dd5c" UNIQUE ("noteId")`),

            queryRunner.query(`ALTER TABLE "page" RENAME CONSTRAINT "FK_3126dd7c502c9e4d7597ef7ef10" TO "FK_a9ca79ad939bf06066b81c9d3aa"`),

            queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum" ADD VALUE 'pollEnded' AFTER 'pollVote'`),
        ]);
    }

    async down(queryRunner) {
        await Promise.all([
            // There is no ALTER TYPE REMOVE VALUE query, so the reverse operation is a bit more complex
            queryRunner.query(`UPDATE "user_profile" SET "mutingNotificationTypes" = array_remove("mutingNotificationTypes", 'pollEnded')`)
            .then(() =>
                queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`)
            ).then(() =>
                queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`)
            ).then(() =>
                queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum_old"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum_old"[]`)
            ).then(() =>
                queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`)
            ).then(() =>
                queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum"`)
            ).then(() =>
                queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum_old" RENAME TO "user_profile_mutingnotificationtypes_enum"`)
            ),

            queryRunner.query(`ALTER TABLE "page" RENAME CONSTRAINT "FK_a9ca79ad939bf06066b81c9d3aa" TO "FK_3126dd7c502c9e4d7597ef7ef10"`),

            queryRunner.query(`ALTER TABLE "promo_note" DROP CONSTRAINT "UQ_e263909ca4fe5d57f8d4230dd5c"`),
            queryRunner.query(`ALTER TABLE "user_publickey" DROP CONSTRAINT "UQ_10c146e4b39b443ede016f6736d"`),
            queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "UQ_51cb79b5555effaf7d69ba1cff9"`),
            queryRunner.query(`ALTER TABLE "user_keypair" DROP CONSTRAINT "UQ_f4853eb41ab722fe05f81cedeb6"`),
            queryRunner.query(`ALTER TABLE "poll" DROP CONSTRAINT "UQ_da851e06d0dfe2ef397d8b1bf1b"`),

            queryRunner.query(`ALTER TABLE "abuse_user_report" ALTER COLUMN "comment" SET DEFAULT '{}'`),
            queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f"`),

            queryRunner.query(`DROP INDEX "public"."IDX_a9021cc2e1feb5f72d3db6e9f5"`),
            queryRunner.query(`DROP INDEX "public"."IDX_f22169eb10657bded6d875ac8f"`),
            queryRunner.query(`DROP INDEX "public"."IDX_315c779174fe8247ab324f036e"`),

            /* DEFAULT's are not set again because if the column can be NULL, then DEFAULT NULL is not necessary.
            see also https://github.com/typeorm/typeorm/issues/7579#issuecomment-835423615 */

            queryRunner.query(`CREATE INDEX "IDX_note_on_channelId_and_id_desc" ON "note" ("id", "channelId") `),
            queryRunner.query(`ALTER INDEX "public"."IDX_c8cc87bd0f2f4487d17c651fbf" RENAME TO "IDX_seoignmeoprigmkpodgrjmkpormg"`),
        ]);
    }
}
