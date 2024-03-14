export class IndieAuthClient1707697398681 {
    name = 'IndieAuthClient1707697398681'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "indie_auth_client" ("id" character varying(512) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(256), "redirectUris" character varying(512) array NOT NULL DEFAULT '{}', CONSTRAINT "PK_9a604c83d4dadfa1eb92ee03399" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_434fcbfbe82b58a90898e557b7" ON "indie_auth_client" ("createdAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_434fcbfbe82b58a90898e557b7"`);
        await queryRunner.query(`DROP TABLE "indie_auth_client"`);
    }
}
