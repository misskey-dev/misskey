export class Role1673500412259 {
    name = 'Role1673500412259'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "role" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(256) NOT NULL, "description" character varying(1024) NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "isModerator" boolean NOT NULL DEFAULT false, "isAdministrator" boolean NOT NULL DEFAULT false, "options" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id")); COMMENT ON COLUMN "role"."createdAt" IS 'The created date of the Role.'; COMMENT ON COLUMN "role"."updatedAt" IS 'The updated date of the Role.'`);
        await queryRunner.query(`CREATE TABLE "role_assignment" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "roleId" character varying(32) NOT NULL, CONSTRAINT "PK_7e79671a8a5db18936173148cb4" PRIMARY KEY ("id")); COMMENT ON COLUMN "role_assignment"."createdAt" IS 'The created date of the RoleAssignment.'; COMMENT ON COLUMN "role_assignment"."userId" IS 'The user ID.'; COMMENT ON COLUMN "role_assignment"."roleId" IS 'The role ID.'`);
        await queryRunner.query(`CREATE INDEX "IDX_db5b72c16227c97ca88734d5c2" ON "role_assignment" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0de67fd09cd3cd0aabca79994" ON "role_assignment" ("roleId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0953deda7ce6e1448e935859e5" ON "role_assignment" ("userId", "roleId") `);
				await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "isAdmin" TO "isRoot"`);
				await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isModerator"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "driveCapacityOverrideMb"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disableLocalTimeline"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disableGlobalTimeline"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "localDriveCapacityMb"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "defaultRoleOverride" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "role_assignment" ADD CONSTRAINT "FK_db5b72c16227c97ca88734d5c2b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_assignment" ADD CONSTRAINT "FK_f0de67fd09cd3cd0aabca79994d" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role_assignment" DROP CONSTRAINT "FK_f0de67fd09cd3cd0aabca79994d"`);
        await queryRunner.query(`ALTER TABLE "role_assignment" DROP CONSTRAINT "FK_db5b72c16227c97ca88734d5c2b"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultRoleOverride"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "localDriveCapacityMb" integer NOT NULL DEFAULT '1024'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "disableGlobalTimeline" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "disableLocalTimeline" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "driveCapacityOverrideMb" integer`);
				await queryRunner.query(`ALTER TABLE "user" ADD "isModerator" boolean NOT NULL DEFAULT false`);
				await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "isRoot" TO "isAdmin"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0953deda7ce6e1448e935859e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0de67fd09cd3cd0aabca79994"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db5b72c16227c97ca88734d5c2"`);
        await queryRunner.query(`DROP TABLE "role_assignment"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }
}
