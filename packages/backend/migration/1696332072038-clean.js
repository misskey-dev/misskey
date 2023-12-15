export class Clean1696332072038 {
    name = 'Clean1696332072038'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_d844bfc6f3f523a05189076efaa"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_605472305f26818cc93d1baaa74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d844bfc6f3f523a05189076efa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_605472305f26818cc93d1baaa7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90f7da835e4c10aca6853621e1"`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{ "admin", "administrator", "root", "system", "maintainer", "host", "mod", "moderator", "owner", "superuser", "staff", "auth", "i", "me", "everyone", "all", "mention", "mentions", "example", "user", "users", "account", "accounts", "official", "help", "helps", "support", "supports", "info", "information", "informations", "announce", "announces", "announcement", "announcements", "notice", "notification", "notifications", "dev", "developer", "developers", "tech", "misskey" }'`);
        await queryRunner.query(`COMMENT ON COLUMN "user_list_membership"."createdAt" IS 'The created date of the UserListMembership.'`);
        await queryRunner.query(`CREATE INDEX "IDX_021015e6683570ae9f6b0c62be" ON "user_list_membership" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cddcaf418dc4d392ecfcca842a" ON "user_list_membership" ("userListId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e4f3094c43f2d665e6030b0337" ON "user_list_membership" ("userId", "userListId") `);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_021015e6683570ae9f6b0c62bee" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_cddcaf418dc4d392ecfcca842a7" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_cddcaf418dc4d392ecfcca842a7"`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" DROP CONSTRAINT "FK_021015e6683570ae9f6b0c62bee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4f3094c43f2d665e6030b0337"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cddcaf418dc4d392ecfcca842a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_021015e6683570ae9f6b0c62be"`);
        await queryRunner.query(`COMMENT ON COLUMN "user_list_membership"."createdAt" IS 'The created date of the UserListJoining.'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{admin,administrator,root,system,maintainer,host,mod,moderator,owner,superuser,staff,auth,i,me,everyone,all,mention,mentions,example,user,users,account,accounts,official,help,helps,support,supports,info,information,informations,announce,announces,announcement,announcements,notice,notification,notifications,dev,developer,developers,tech,misskey}'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90f7da835e4c10aca6853621e1" ON "user_list_membership" ("userId", "userListId") `);
        await queryRunner.query(`CREATE INDEX "IDX_605472305f26818cc93d1baaa7" ON "user_list_membership" ("userListId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d844bfc6f3f523a05189076efa" ON "user_list_membership" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_605472305f26818cc93d1baaa74" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_membership" ADD CONSTRAINT "FK_d844bfc6f3f523a05189076efaa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
