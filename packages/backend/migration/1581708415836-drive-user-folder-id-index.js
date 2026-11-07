/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class driveUserFolderIdIndex1581708415836 {
    constructor() {
        this.name = 'driveUserFolderIdIndex1581708415836';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_55720b33a61a7c806a8215b825" ON "drive_file" ("userId", "folderId", "id") `, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_55720b33a61a7c806a8215b825"`, undefined);
    }
}
