/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SpReactions1769664628306 {
    name = 'SpReactions1769664628306'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_sp_reaction" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "reaction" character varying(260) NOT NULL, "noteUserId" character varying(32) NOT NULL, CONSTRAINT "PK_11fd5ecdd9bb91517edfcf890d9" PRIMARY KEY ("id")); COMMENT ON COLUMN "note_sp_reaction"."noteUserId" IS '[Denormalized]'`);
        await queryRunner.query(`CREATE INDEX "IDX_3463a48b09fa41e1826ebd9f58" ON "note_sp_reaction" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bfe4caa46cc0526bc2932d6dbe" ON "note_sp_reaction" ("noteId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8be6eb3f4edc9940a3f8142669" ON "note_sp_reaction" ("noteUserId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b5f210b20bd987fe8584c85d33" ON "note_sp_reaction" ("userId", "noteId") `);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableSpReaction" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "note_sp_reaction" ADD CONSTRAINT "FK_3463a48b09fa41e1826ebd9f585" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_sp_reaction" ADD CONSTRAINT "FK_bfe4caa46cc0526bc2932d6dbed" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_sp_reaction" DROP CONSTRAINT "FK_bfe4caa46cc0526bc2932d6dbed"`);
        await queryRunner.query(`ALTER TABLE "note_sp_reaction" DROP CONSTRAINT "FK_3463a48b09fa41e1826ebd9f585"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableSpReaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5f210b20bd987fe8584c85d33"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8be6eb3f4edc9940a3f8142669"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfe4caa46cc0526bc2932d6dbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3463a48b09fa41e1826ebd9f58"`);
        await queryRunner.query(`DROP TABLE "note_sp_reaction"`);
    }
}
