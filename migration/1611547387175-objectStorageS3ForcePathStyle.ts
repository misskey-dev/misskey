import {MigrationInterface, QueryRunner} from "typeorm";

export class objectStorageS3ForcePathStyle1611547387175 implements MigrationInterface {
    name = 'objectStorageS3ForcePathStyle1611547387175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageS3ForcePathStyle" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageS3ForcePathStyle"`);
    }

}
