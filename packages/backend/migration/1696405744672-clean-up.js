/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CleanUp1696405744672 {
    name = 'CleanUp1696405744672'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_e7c0567f5261063592f022e9b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25dfc71b0369b003a4cd434d0b"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_25dfc71b0369b003a4cd434d0b" ON "note" ("attachedFileTypes") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7c0567f5261063592f022e9b5" ON "note" ("createdAt") `);
    }
}
