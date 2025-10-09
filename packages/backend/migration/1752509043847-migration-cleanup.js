/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MigrationCleanup1752509043847 {
    name = 'MigrationCleanup1752509043847'

    async up(queryRunner) {
        // 1745378064470-composite-note-index.js created a index ON "note" ("userId", "id" DESC) as IDX_724b311e6f883751f261ebe378 but should be named IDX_a6f649630f55af3888e5a42919
        await queryRunner.query(`ALTER INDEX "IDX_724b311e6f883751f261ebe378" RENAME TO "IDX_a6f649630f55af3888e5a42919"`);

        // 1713656541000-abuse-report-notification.js generated system_webhook with hand-written SQL with CURRENT_TIMESTAMP as the default value, but its representation in TypeORM is `now()`
        // see https://github.com/typeorm/typeorm/blob/f351757a15b9d2bd9d4222c69dcfd2316f46b5d1/src/driver/postgres/PostgresDriver.ts#L1575
        await queryRunner.query(`ALTER TABLE "system_webhook" ALTER COLUMN "updatedAt" SET DEFAULT now()`);

        // 1702718871541-ffVisibility.js defined a enum type "user_profile_followersVisibility_enum" but it should be "user_profile_followersvisibility_enum" (lowercase 'v') in typeorm
        await queryRunner.query(`ALTER TYPE "public"."user_profile_followersVisibility_enum" RENAME TO "user_profile_followersvisibility_enum"`);

        // 1713656541000-abuse-report-notification.js generated abuse_report_notification_recipient with hand-written SQL with CURRENT_TIMESTAMP as the default value, but its representation in TypeORM is `now()`
        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "updatedAt" SET DEFAULT now()`);

        // 1690796169261-play-visibility.js added visibility column to flash table but it forgot to set NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "flash" ALTER COLUMN "visibility" SET NOT NULL`);

        // 1736686850345-createNoteDraft.js created note_draft with hand-written SQL but several types and comments are not correctly defined
        await queryRunner.query(`CREATE TYPE "public"."note_draft_visibility_enum" AS ENUM('public', 'home', 'followers', 'specified')`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "id" SET DATA TYPE character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "replyId" SET DATA TYPE character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "renoteId" SET DATA TYPE character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "userId" SET DATA TYPE character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "channelId" SET DATA TYPE character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "fileIds" SET DATA TYPE character varying(32) array`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibleUserIds" SET DATA TYPE character varying(32) array`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibility" SET DATA TYPE "public"."note_draft_visibility_enum" USING visibility::note_draft_visibility_enum`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."replyId" IS 'The ID of reply target.'`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."renoteId" IS 'The ID of renote target.'`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."userId" IS 'The ID of author.'`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."channelId" IS 'The ID of source channel.'`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "fileIds" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "hasPoll" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "pollChoices" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "pollMultiple" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "localOnly" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibleUserIds" SET NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibleUserIds" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "localOnly" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "pollMultiple" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "pollChoices" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "hasPoll" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "fileIds" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."channelId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."userId" IS 'The ID of author.'`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."renoteId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "note_draft"."replyId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibility" SET DATA TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "visibleUserIds" SET DATA TYPE varchar[]`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "fileIds" SET DATA TYPE varchar[]`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "channelId" SET DATA TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "userId" SET DATA TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "renoteId" SET DATA TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "replyId" SET DATA TYPE varchar`);
        await queryRunner.query(`ALTER TABLE "note_draft" ALTER COLUMN "id" SET DATA TYPE varchar`);
        await queryRunner.query(`DROP TYPE "public"."note_draft_visibility_enum"`);

        await queryRunner.query(`ALTER TABLE "flash" ALTER COLUMN "visibility" DROP NOT NULL`);

        await queryRunner.query(`ALTER TABLE "abuse_report_notification_recipient" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);

        await queryRunner.query(`ALTER TYPE "public"."user_profile_followersvisibility_enum" RENAME TO "user_profile_followersVisibility_enum"`);

        await queryRunner.query(`ALTER TABLE "system_webhook" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);

        await queryRunner.query(`ALTER INDEX "IDX_a6f649630f55af3888e5a42919" RENAME TO "IDX_724b311e6f883751f261ebe378"`);
    }
}
