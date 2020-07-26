import {MigrationInterface, QueryRunner} from "typeorm";

export class instanceIconUrl1595676934834 implements MigrationInterface {
    name = 'instanceIconUrl1595676934834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" ADD "iconUrl" character varying(256) DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "iconUrl"`);
    }

}
