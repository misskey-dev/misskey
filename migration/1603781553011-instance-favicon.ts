import {MigrationInterface, QueryRunner} from "typeorm";

export class instanceFavicon1603781553011 implements MigrationInterface {
    name = 'instanceFavicon1603781553011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" ADD "faviconUrl" character varying(256) DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "faviconUrl"`);
    }

}
