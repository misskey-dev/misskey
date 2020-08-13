import {MigrationInterface, QueryRunner} from "typeorm";

export class objectStorageSetPublicRead1597230137744 implements MigrationInterface {
    name = 'objectStorageSetPublicRead1597230137744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageSetPublicRead" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageSetPublicRead"`);
    }

}
