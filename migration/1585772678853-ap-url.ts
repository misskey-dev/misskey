/* tslint:disable:quotemark class-name indent */
import {MigrationInterface, QueryRunner} from "typeorm";

export class apUrl1585772678853 implements MigrationInterface {
    name = 'apUrl1585772678853'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note" ADD "url" character varying(512)`, undefined);
     }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "url"`, undefined);
    }

}
