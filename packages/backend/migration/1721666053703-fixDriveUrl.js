export class FixDriveUrl1721666053703 {
    name = 'FixDriveUrl1721666053703'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "url" TYPE character varying(1024), ALTER COLUMN "url" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."url" IS 'The URL of the DriveFile.'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5848eac4940934e23dbc17581"`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "uri" TYPE character varying(1024)`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."uri" IS 'The URI of the DriveFile. it will be null when the DriveFile is local.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "src" TYPE character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{ "admin", "administrator", "root", "system", "maintainer", "host", "mod", "moderator", "owner", "superuser", "staff", "auth", "i", "me", "everyone", "all", "mention", "mentions", "example", "user", "users", "account", "accounts", "official", "help", "helps", "support", "supports", "info", "information", "informations", "announce", "announces", "announcement", "announcements", "notice", "notification", "notifications", "dev", "developer", "developers", "tech", "misskey" }'`);
        await queryRunner.query(`CREATE INDEX "IDX_e5848eac4940934e23dbc17581" ON "drive_file" ("uri") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_e5848eac4940934e23dbc17581"`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{admin,administrator,root,system,maintainer,host,mod,moderator,owner,superuser,staff,auth,i,me,everyone,all,mention,mentions,example,user,users,account,accounts,official,help,helps,support,supports,info,information,informations,announce,announces,announcement,announcements,notice,notification,notifications,dev,developer,developers,tech,misskey}'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "src" TYPE character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."uri" IS 'The URI of the DriveFile. it will be null when the DriveFile is local.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "uri" TYPE character varying(512)`);
        await queryRunner.query(`CREATE INDEX "IDX_e5848eac4940934e23dbc17581" ON "drive_file" ("uri") `);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."url" IS 'The URL of the DriveFile.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "url" TYPE character varying(512), ALTER COLUMN "url" SET NOT NULL`);
    }
}
