/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ComunityRole1695479010509 {
	name = 'ComunityRole1695479010509'

	async up(queryRunner) {
			// First create the new enum type
			await queryRunner.query(`CREATE TYPE "public"."role_permissiongroup_enum" AS ENUM('Admin', 'MainModerator', 'Normal', 'Community')`);

			// Add userId column
			await queryRunner.query(`ALTER TABLE "role" ADD "userId" character varying(32)`);
			await queryRunner.query(`COMMENT ON COLUMN "role"."userId" IS 'The owner ID.'`);

			// Add permissionGroup column with the new enum type
			await queryRunner.query(`ALTER TABLE "role" ADD "permissionGroup" "public"."role_permissiongroup_enum" DEFAULT 'Normal'`);

			// Update preservedUsernames
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{ "admin", "administrator", "root", "system", "maintainer", "host", "mod", "moderator", "owner", "superuser", "staff", "auth", "i", "me", "everyone", "all", "mention", "mentions", "example", "user", "users", "account", "accounts", "official", "help", "helps", "support", "supports", "info", "information", "informations", "announce", "announces", "announcement", "announcements", "notice", "notification", "notifications", "dev", "developer", "developers", "tech", "misskey" }'`);
	}

	async down(queryRunner) {
			// Drop the permissionGroup column
			await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "permissionGroup"`);

			// Drop the enum type
			await queryRunner.query(`DROP TYPE "public"."role_permissiongroup_enum"`);

			// Revert other changes
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "preservedUsernames" SET DEFAULT '{admin,administrator,root,system,maintainer,host,mod,moderator,owner,superuser,staff,auth,i,me,everyone,all,mention,mentions,example,user,users,account,accounts,official,help,helps,support,supports,info,information,informations,announce,announces,announcement,announcements,notice,notification,notifications,dev,developer,developers,tech,misskey}'`);
			await queryRunner.query(`COMMENT ON COLUMN "role"."userId" IS 'The owner ID.'`);
			await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "userId"`);
	}
}
