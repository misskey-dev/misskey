export class Useraccountmovelogs1724749627479 {
    name = 'Useraccountmovelogs1724749627479'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_account_move_log" ("id" character varying(32) NOT NULL, "movedToId" character varying(32) NOT NULL, "movedFromId" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8ffd4ae965a5e3a0fbf4b084212" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_account_move_log"."createdAt" IS 'The created date of the UserIp.'`);
        await queryRunner.query(`CREATE INDEX "IDX_d5ee7d4d1b5e7a69d8855ab069" ON "user_account_move_log" ("movedToId") `);
        await queryRunner.query(`CREATE INDEX "IDX_82930731d6390e7bb429a1938f" ON "user_account_move_log" ("movedFromId") `);
        await queryRunner.query(`ALTER TABLE "user_account_move_log" ADD CONSTRAINT "FK_d5ee7d4d1b5e7a69d8855ab0696" FOREIGN KEY ("movedToId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_account_move_log" ADD CONSTRAINT "FK_82930731d6390e7bb429a1938f8" FOREIGN KEY ("movedFromId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_account_move_log" DROP CONSTRAINT "FK_82930731d6390e7bb429a1938f8"`);
        await queryRunner.query(`ALTER TABLE "user_account_move_log" DROP CONSTRAINT "FK_d5ee7d4d1b5e7a69d8855ab0696"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82930731d6390e7bb429a1938f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5ee7d4d1b5e7a69d8855ab069"`);
        await queryRunner.query(`DROP TABLE "user_account_move_log"`);
    }
}
