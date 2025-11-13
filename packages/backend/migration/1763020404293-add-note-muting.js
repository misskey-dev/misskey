/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddNoteMuting1763020404293 {
    name = 'AddNoteMuting1763020404293'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_muting" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_fea70b509b208dddc7db1daf1a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_916dab9d78652949e4780cc3d1" ON "note_muting" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_11191ed3a092f21e3e22bb0ec4" ON "note_muting" ("noteId") `);
        await queryRunner.query(`ALTER TABLE "note_muting" ADD CONSTRAINT "FK_916dab9d78652949e4780cc3d16" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_muting" ADD CONSTRAINT "FK_11191ed3a092f21e3e22bb0ec4c" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_muting" DROP CONSTRAINT "FK_11191ed3a092f21e3e22bb0ec4c"`);
        await queryRunner.query(`ALTER TABLE "note_muting" DROP CONSTRAINT "FK_916dab9d78652949e4780cc3d16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11191ed3a092f21e3e22bb0ec4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_916dab9d78652949e4780cc3d1"`);
        await queryRunner.query(`DROP TABLE "note_muting"`);
    }
}
