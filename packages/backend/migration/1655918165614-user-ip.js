export class userIp1655918165614 {
    name = 'userIp1655918165614'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_ip" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "ip" character varying(128) NOT NULL, CONSTRAINT "PK_2c44ddfbf7c0464d028dcef325e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7f7f1c66f48e9a8e18a33bc515" ON "user_ip" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_361b500e06721013c124b7b6c5" ON "user_ip" ("userId", "ip") `);
        await queryRunner.query(`ALTER TABLE "user_ip" ADD CONSTRAINT "FK_7f7f1c66f48e9a8e18a33bc5150" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_ip" DROP CONSTRAINT "FK_7f7f1c66f48e9a8e18a33bc5150"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_361b500e06721013c124b7b6c5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f7f1c66f48e9a8e18a33bc515"`);
        await queryRunner.query(`DROP TABLE "user_ip"`);
    }
}
