/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeDriveFilesQuery1756824506000 {
    name = 'OptimizeDriveFilesQuery1756824506000'

    async up(queryRunner) {
        // Create optimized composite index for drive files query performance
        await queryRunner.query(`DROP INDEX "IDX_860fa6f6c7df5bb887249fba22"`);
        await queryRunner.query(`CREATE INDEX "IDX_a76118b66adb3228e0ee69c281" ON "drive_file" ("userId", "id" DESC)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_a76118b66adb3228e0ee69c281"`);
        await queryRunner.query(`CREATE INDEX "IDX_860fa6f6c7df5bb887249fba22" ON "drive_file" ("userId")`);
    }
}
