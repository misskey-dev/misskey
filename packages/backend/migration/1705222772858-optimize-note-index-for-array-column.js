/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeNoteIndexForArrayColumns1705222772858 {
    name = 'OptimizeNoteIndexForArrayColumns1705222772858'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_796a8c03959361f97dc2be1d5c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54ebcb6d27222913b908d56fd8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88937d94d7443d9a99a76fa5c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51c063b6a133a9cb87145450f5"`);
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_FILE_IDS" ON "note" using gin ("fileIds")`)
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_NOTE_FILE_IDS"`)
        await queryRunner.query(`CREATE INDEX "IDX_51c063b6a133a9cb87145450f5" ON "note" ("fileIds") `);
        await queryRunner.query(`CREATE INDEX "IDX_88937d94d7443d9a99a76fa5c0" ON "note" ("tags") `);
        await queryRunner.query(`CREATE INDEX "IDX_54ebcb6d27222913b908d56fd8" ON "note" ("mentions") `);
        await queryRunner.query(`CREATE INDEX "IDX_796a8c03959361f97dc2be1d5c" ON "note" ("visibleUserIds") `);
    }
}
