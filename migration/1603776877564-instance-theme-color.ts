import {MigrationInterface, QueryRunner} from "typeorm";

export class instanceThemeColor1603776877564 implements MigrationInterface {
    name = 'instanceThemeColor1603776877564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" ADD "themeColor" character varying(64) DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "themeColor"`);
    }

}
