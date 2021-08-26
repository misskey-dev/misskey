import {MigrationInterface, QueryRunner} from "typeorm";

export class deeplIntegration1629024377804 implements MigrationInterface {
    name = 'deeplIntegration1629024377804'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deeplAuthKey" character varying(128)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deeplAuthKey"`);
    }

}
