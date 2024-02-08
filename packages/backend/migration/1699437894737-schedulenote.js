export class Schedulenote1699437894737 {
    name = 'Schedulenote1699437894737'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_schedule" ("id" character varying(32) NOT NULL, "note" jsonb NOT NULL, "userId" character varying(260) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3a1ae2db41988f4994268218436" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e798958c40009bf0cdef4f28b5" ON "note_schedule" ("userId") `);
		}

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "note_schedule"`);
    }
}
