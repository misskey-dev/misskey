import {MigrationInterface, QueryRunner} from "typeorm";

export class driveUserFolderIdIndex1581708415836 implements MigrationInterface {
    name = 'driveUserFolderIdIndex1581708415836'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX "IDX_55720b33a61a7c806a8215b825" ON "drive_file" ("userId", "folderId", "id") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_55720b33a61a7c806a8215b825"`, undefined);
    }

}
