"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class driveUserFolderIdIndex1581708415836 {
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
exports.driveUserFolderIdIndex1581708415836 = driveUserFolderIdIndex1581708415836;
