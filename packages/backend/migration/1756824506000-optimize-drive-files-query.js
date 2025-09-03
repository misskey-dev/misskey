/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeDriveFilesQuery1756824506000 {
	name = 'OptimizeDriveFilesQuery1756824506000'

	async up(queryRunner) {
		// Create optimized partial index for drive files query performance
		// This index is specifically designed for the common query pattern:
		// SELECT * FROM drive_file WHERE userId = ? AND folderId IS NULL ORDER BY id DESC
		await queryRunner.query(`CREATE INDEX "IDX_drive_file_userid_null_folderid_id_desc" ON "drive_file" ("userId", ("folderId" IS NULL), "id" DESC)`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_drive_file_userid_null_folderid_id_desc"`);
	}
}
