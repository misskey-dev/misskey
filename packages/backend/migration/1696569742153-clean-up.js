/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CleanUp1696569742153 {
    name = 'CleanUp1696569742153'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_01f4581f114e0ebd2bbb876f0b"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "score"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "score" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_01f4581f114e0ebd2bbb876f0b" ON "note_reaction" ("createdAt") `);
    }
}
