export class ScheduledNote1736923279563 {
    name = 'ScheduledNote1736923279563'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_scheduled" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "scheduledAt" TIMESTAMP WITH TIME ZONE, "reason" character varying(256), "userId" character varying(32) NOT NULL, "draft" jsonb NOT NULL, CONSTRAINT "PK_14ca8fa67f70dc68ebab8900f4b" PRIMARY KEY ("id")); COMMENT ON COLUMN "note_scheduled"."createdAt" IS 'The created date of the Note.'; COMMENT ON COLUMN "note_scheduled"."scheduledAt" IS 'The scheduled date of the Note.'; COMMENT ON COLUMN "note_scheduled"."userId" IS 'The ID of author.'`);
        await queryRunner.query(`CREATE INDEX "IDX_7ddf8710a9faee81081592ec35" ON "note_scheduled" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbe52891059217fc31e73e84e2" ON "note_scheduled" ("scheduledAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b148b24837cc7a2707ae1f0975" ON "note_scheduled" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dfeab22d6bbc4799193997553a" ON "note_scheduled" ("userId", "scheduledAt") `);
        await queryRunner.query(`ALTER TABLE "note_scheduled" ADD CONSTRAINT "FK_b148b24837cc7a2707ae1f0975a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_scheduled" DROP CONSTRAINT "FK_b148b24837cc7a2707ae1f0975a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dfeab22d6bbc4799193997553a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b148b24837cc7a2707ae1f0975"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbe52891059217fc31e73e84e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ddf8710a9faee81081592ec35"`);
        await queryRunner.query(`DROP TABLE "note_scheduled"`);
    }
}
