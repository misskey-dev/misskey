import {MigrationInterface, QueryRunner} from "typeorm";

export class NoteSensitive1566733587544 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note" ADD "isSensitive" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isSensitive"`);
    }

}
