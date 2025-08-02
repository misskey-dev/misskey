/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DeletedNote1754137937997 {
    name = 'DeletedNote1754137937997'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "deleted_note" ("id" character varying(32) NOT NULL, "deletedAt" TIMESTAMP WITH TIME ZONE, "replyId" character varying(32), "renoteId" character varying(32), "userId" character varying(32) NOT NULL, "localOnly" boolean NOT NULL DEFAULT false, "uri" character varying(512), "url" character varying(512), "channelId" character varying(32), CONSTRAINT "PK_1cb67148b7b707a03c63b2165fc" PRIMARY KEY ("id")); COMMENT ON COLUMN "deleted_note"."replyId" IS 'The ID of reply target.'; COMMENT ON COLUMN "deleted_note"."renoteId" IS 'The ID of renote target.'; COMMENT ON COLUMN "deleted_note"."userId" IS 'The ID of author.'; COMMENT ON COLUMN "deleted_note"."uri" IS 'The URI of a note. it will be null when the note is local.'; COMMENT ON COLUMN "deleted_note"."url" IS 'The human readable url of a note. it will be null when the note is local.'; COMMENT ON COLUMN "deleted_note"."channelId" IS 'The ID of source channel.'`);
        await queryRunner.query(`CREATE INDEX "IDX_12797cfa4c15d03d0dd649bc4b" ON "deleted_note" ("replyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b6a4a8f31a98ddc5e07995c840" ON "deleted_note" ("renoteId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_95c76b088692f600b7a5352a4b" ON "deleted_note" ("uri") `);
        await queryRunner.query(`CREATE INDEX "IDX_cd2da11aa690f8e854e68058ce" ON "deleted_note" ("channelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_31ca16e5929958668bf1d9a2d5" ON "deleted_note" ("userId", "id" DESC) `);
        await queryRunner.query(`ALTER TABLE "deleted_note" ADD CONSTRAINT "FK_d3b9dbab99de8644e4b0d5b7d59" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deleted_note" ADD CONSTRAINT "FK_cd2da11aa690f8e854e68058cef" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "deleted_note" DROP CONSTRAINT "FK_cd2da11aa690f8e854e68058cef"`);
        await queryRunner.query(`ALTER TABLE "deleted_note" DROP CONSTRAINT "FK_d3b9dbab99de8644e4b0d5b7d59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31ca16e5929958668bf1d9a2d5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cd2da11aa690f8e854e68058ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_95c76b088692f600b7a5352a4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b6a4a8f31a98ddc5e07995c840"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12797cfa4c15d03d0dd649bc4b"`);
        await queryRunner.query(`DROP TABLE "deleted_note"`);
    }
}
