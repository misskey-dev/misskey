export class fixforeignkeyreports1675053125067 {
    name = 'fixforeignkeyreports1675053125067'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_a9021cc2e1feb5f72d3db6e9f5" ON "abuse_user_report" ("targetUserId")`);
        await queryRunner.query(`DELETE FROM "abuse_user_report" WHERE "targetUserId" NOT IN (SELECT "id" FROM "user")`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT IF EXISTS "FK_a9021cc2e1feb5f72d3db6e9f5f"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_a9021cc2e1feb5f72d3db6e9f5"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f"`);
    }
}
