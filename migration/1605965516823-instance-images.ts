import {MigrationInterface, QueryRunner} from "typeorm";

export class instanceImages1605965516823 implements MigrationInterface {
    name = 'instanceImages1605965516823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "backgroundImageUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "logoImageUrl" character varying(512)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "logoImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "backgroundImageUrl"`);
    }

}
