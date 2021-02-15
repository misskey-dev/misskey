import {MigrationInterface, QueryRunner} from "typeorm";

export class userLang1613181457597 implements MigrationInterface {
    name = 'userLang1613181457597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "lang" character varying(32)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "lang"`);
    }

}
