

export class UserGroupInvite1558257926829 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_group_invite" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "userGroupId" character varying(32) NOT NULL, CONSTRAINT "PK_3893884af0d3a5f4d01e7921a97" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1039988afa3bf991185b277fe0" ON "user_group_invite" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e10924607d058004304611a436" ON "user_group_invite" ("userGroupId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_78787741f9010886796f2320a4" ON "user_group_invite" ("userId", "userGroupId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d9ecaed8c6dc43f3592c229282" ON "user_group_joining" ("userId", "userGroupId") `);
        await queryRunner.query(`ALTER TABLE "user_group_invite" ADD CONSTRAINT "FK_1039988afa3bf991185b277fe03" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group_invite" ADD CONSTRAINT "FK_e10924607d058004304611a436a" FOREIGN KEY ("userGroupId") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_group_invite" DROP CONSTRAINT "FK_e10924607d058004304611a436a"`);
        await queryRunner.query(`ALTER TABLE "user_group_invite" DROP CONSTRAINT "FK_1039988afa3bf991185b277fe03"`);
        await queryRunner.query(`DROP INDEX "IDX_d9ecaed8c6dc43f3592c229282"`);
        await queryRunner.query(`DROP INDEX "IDX_78787741f9010886796f2320a4"`);
        await queryRunner.query(`DROP INDEX "IDX_e10924607d058004304611a436"`);
        await queryRunner.query(`DROP INDEX "IDX_1039988afa3bf991185b277fe0"`);
        await queryRunner.query(`DROP TABLE "user_group_invite"`);
    }
}
