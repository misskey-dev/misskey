export class Event1681673280586 {
    name = 'Event1681673280586'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_3af9380f266b7046cce9c992197"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3af9380f266b7046cce9c99219"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME COLUMN "eventId" TO "isEvent"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME CONSTRAINT "UQ_3af9380f266b7046cce9c992197" TO "UQ_16484b50d1ee91555d4b8821ac3"`);
        await queryRunner.query(`ALTER TABLE "event" RENAME COLUMN "id" TO "noteId"`);
        await queryRunner.query(`ALTER TABLE "event" RENAME CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" TO "PK_2b481f231cd035e84390072bf7b"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "UQ_16484b50d1ee91555d4b8821ac3"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isEvent"`);
        await queryRunner.query(`ALTER TABLE "note" ADD "isEvent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_2b481f231cd035e84390072bf7b" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_2b481f231cd035e84390072bf7b"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isEvent"`);
        await queryRunner.query(`ALTER TABLE "note" ADD "isEvent" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "UQ_16484b50d1ee91555d4b8821ac3" UNIQUE ("isEvent")`);
        await queryRunner.query(`ALTER TABLE "event" RENAME CONSTRAINT "PK_2b481f231cd035e84390072bf7b" TO "PK_30c2f3bbaf6d34a55f8ae6e4614"`);
        await queryRunner.query(`ALTER TABLE "event" RENAME COLUMN "noteId" TO "id"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME CONSTRAINT "UQ_16484b50d1ee91555d4b8821ac3" TO "UQ_3af9380f266b7046cce9c992197"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME COLUMN "isEvent" TO "eventId"`);
        await queryRunner.query(`CREATE INDEX "IDX_3af9380f266b7046cce9c99219" ON "note" ("eventId") `);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_3af9380f266b7046cce9c992197" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
