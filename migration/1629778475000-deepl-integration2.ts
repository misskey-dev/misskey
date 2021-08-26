import {MigrationInterface, QueryRunner} from "typeorm";

export class deeplIntegration21629778475000 implements MigrationInterface {
    name = 'deeplIntegration21629778475000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deeplIsPro" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deeplIsPro"`);
    }

}
