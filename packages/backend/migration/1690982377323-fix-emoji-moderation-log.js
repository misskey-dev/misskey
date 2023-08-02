export class FixEmojiModerationLog1690982377323 {
    name = 'FixEmojiModerationLog1690982377323'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."emoji_moderation_log_type_enum" AS ENUM('Add', 'Update', 'Other')`);
        await queryRunner.query(`CREATE TABLE "emoji_moderation_log" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "emojiId" character varying(32) NOT NULL, "type" "public"."emoji_moderation_log_type_enum" NOT NULL DEFAULT 'Other', "info" jsonb array NOT NULL DEFAULT '{}', CONSTRAINT "PK_a04a703278e79f05e76ec81a047" PRIMARY KEY ("id")); COMMENT ON COLUMN "emoji_moderation_log"."createdAt" IS 'The created date of the ModerationLog.'`);
        await queryRunner.query(`CREATE INDEX "IDX_4c47bd3018d113c59a07df33ee" ON "emoji_moderation_log" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0c262449160997ef69b3545c57" ON "emoji_moderation_log" ("emojiId") `);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{ "admin", "administrator", "root", "system", "maintainer", "host", "mod", "moderator", "owner", "superuser", "staff", "auth", "i", "me", "everyone", "all", "mention", "mentions", "example", "user", "users", "account", "accounts", "official", "help", "helps", "support", "supports", "info", "information", "informations", "announce", "announces", "announcement", "announcements", "notice", "notification", "notifications", "dev", "developer", "developers", "tech", "misskey" }'`);
        await queryRunner.query(`ALTER TABLE "emoji_moderation_log" ADD CONSTRAINT "FK_4c47bd3018d113c59a07df33eee" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emoji_moderation_log" ADD CONSTRAINT "FK_0c262449160997ef69b3545c57e" FOREIGN KEY ("emojiId") REFERENCES "emoji"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji_moderation_log" DROP CONSTRAINT "FK_0c262449160997ef69b3545c57e"`);
        await queryRunner.query(`ALTER TABLE "emoji_moderation_log" DROP CONSTRAINT "FK_4c47bd3018d113c59a07df33eee"`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{admin,administrator,root,system,maintainer,host,mod,moderator,owner,superuser,staff,auth,i,me,everyone,all,mention,mentions,example,user,users,account,accounts,official,help,helps,support,supports,info,information,informations,announce,announces,announcement,announcements,notice,notification,notifications,dev,developer,developers,tech,misskey}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c262449160997ef69b3545c57"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c47bd3018d113c59a07df33ee"`);
        await queryRunner.query(`DROP TABLE "emoji_moderation_log"`);
        await queryRunner.query(`DROP TYPE "public"."emoji_moderation_log_type_enum"`);
    }
}
