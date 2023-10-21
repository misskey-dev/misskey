/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DeleteCreatedAt1697420555911 {
    name = 'DeleteCreatedAt1697420555911'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_02878d441ceae15ce060b73daf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8dfad3b72196dd1d6b5db168a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e11e649824a45d8ed01d597fd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db2098070b2b5a523c58181f74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_048a757923ed8b157e9895da53"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1129c2ef687fc272df040bafaa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_118ec703e596086fc4515acb39"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9a354f7941c1e779f3b33aea6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71cb7b435b7c0d4843317e7e16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11e71f2511589dcc8a4d3214f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_735a5544f9249d412255f47f95"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_582f8fab771a9040a12961f3e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f1a239bd077c8864a20c62c2c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f86d57fbca33c7a4e6897490cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1259a2c2b7bb413ff449e8711"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fbb4297c927a9b85e9cefa2eb1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0fb627e1c2f753262a74f0562d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_149d2e44785707548c82999b01"`);
        await queryRunner.query(`ALTER TABLE "drive_folder" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "app" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "ad" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "announcement_read" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_list" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "auth_session" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "blocking" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "channel_following" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "channel_favorite" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "clip" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "clip_favorite" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "follow_request" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "gallery_post" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "gallery_like" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "moderation_log" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "muting" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "renote_muting" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "note_favorite" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "note_reaction" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "note_thread_muting" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "page_like" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "password_reset_request" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "poll_vote" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "promo_read" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "registry_item" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "signin" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "sw_subscription" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_list_favorite" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_note_pining" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user_pending" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "webhook" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "role_assignment" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "flash" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "flash_like" DROP COLUMN "createdAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "flash_like" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flash" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role_assignment" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "webhook" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_pending" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_note_pining" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_list_favorite" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sw_subscription" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "signin" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registry_item" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "promo_read" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "poll_vote" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "password_reset_request" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "page_like" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "page" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_thread_muting" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_reaction" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_favorite" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "renote_muting" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "muting" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "moderation_log" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gallery_like" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gallery_post" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "follow_request" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "following" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clip_favorite" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clip" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_favorite" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_following" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blocking" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "auth_session" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_list" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "announcement_read" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "app" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "drive_folder" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_149d2e44785707548c82999b01" ON "flash" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_0fb627e1c2f753262a74f0562d" ON "poll_vote" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_fbb4297c927a9b85e9cefa2eb1" ON "page" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1259a2c2b7bb413ff449e8711" ON "renote_muting" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_f86d57fbca33c7a4e6897490cc" ON "muting" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_8f1a239bd077c8864a20c62c2c" ON "gallery_post" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_582f8fab771a9040a12961f3e7" ON "following" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_735a5544f9249d412255f47f95" ON "channel_favorite" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_11e71f2511589dcc8a4d3214f9" ON "channel_following" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_71cb7b435b7c0d4843317e7e16" ON "channel" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9a354f7941c1e779f3b33aea6" ON "blocking" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_118ec703e596086fc4515acb39" ON "announcement" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_1129c2ef687fc272df040bafaa" ON "ad" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_048a757923ed8b157e9895da53" ON "app" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_db2098070b2b5a523c58181f74" ON "abuse_user_report" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_e11e649824a45d8ed01d597fd9" ON "user" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_c8dfad3b72196dd1d6b5db168a" ON "drive_file" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_02878d441ceae15ce060b73daf" ON "drive_folder" ("createdAt") `);
    }
}
