export class Schedulenote1699337454434 {
    name = 'Schedulenote1699337454434'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_schedule" ("id" character varying(32) NOT NULL, "note" jsonb NOT NULL, "userId" character varying(260) NOT NULL, CONSTRAINT "PK_3a1ae2db41988f4994268218436" PRIMARY KEY ("id"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "note_schedule"`);
    }
}
