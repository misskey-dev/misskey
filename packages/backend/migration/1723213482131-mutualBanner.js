export class MutualBanner1723213482131 {
    name = 'MutualBanner1723213482131'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_banner" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "description" character varying(1024), "url" character varying(1024), "fileId" character varying(32) NOT NULL, CONSTRAINT "PK_0d9a418f048e308dbfb6562149d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa06ea2e2375449537ced781f1" ON "user_banner" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_banner_pining" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "pinnedBannerId" character varying(32) NOT NULL, CONSTRAINT "PK_970d24f72e8d2b20f8c21ec5d11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3b74dc21b68da606011c81609c" ON "user_banner_pining" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7d51b5a8ae859e0023a98837a1" ON "user_banner_pining" ("userId", "pinnedBannerId") `);
        await queryRunner.query(`ALTER TABLE "user_banner" ADD CONSTRAINT "FK_fa06ea2e2375449537ced781f15" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_banner" ADD CONSTRAINT "FK_3de9f17cce2c10f6938fb261c0b" FOREIGN KEY ("fileId") REFERENCES "drive_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_banner_pining" ADD CONSTRAINT "FK_3b74dc21b68da606011c81609c9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_banner_pining" ADD CONSTRAINT "FK_d13be8242980f7018d664f780f6" FOREIGN KEY ("pinnedBannerId") REFERENCES "user_banner"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_banner_pining" DROP CONSTRAINT "FK_d13be8242980f7018d664f780f6"`);
        await queryRunner.query(`ALTER TABLE "user_banner_pining" DROP CONSTRAINT "FK_3b74dc21b68da606011c81609c9"`);
        await queryRunner.query(`ALTER TABLE "user_banner" DROP CONSTRAINT "FK_3de9f17cce2c10f6938fb261c0b"`);
        await queryRunner.query(`ALTER TABLE "user_banner" DROP CONSTRAINT "FK_fa06ea2e2375449537ced781f15"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d51b5a8ae859e0023a98837a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b74dc21b68da606011c81609c"`);
        await queryRunner.query(`DROP TABLE "user_banner_pining"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa06ea2e2375449537ced781f1"`);
        await queryRunner.query(`DROP TABLE "user_banner"`);
    }
}
