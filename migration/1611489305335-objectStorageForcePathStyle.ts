import {MigrationInterface, QueryRunner} from "typeorm";

export class objectStorageForcePathStyle1611489305335 implements MigrationInterface {
    name = 'objectStorageForcePathStyle1611489305335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageForcePathStyle" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageForcePathStyle"`);
    }
}
