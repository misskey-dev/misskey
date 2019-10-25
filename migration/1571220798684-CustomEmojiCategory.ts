import {MigrationInterface, QueryRunner} from "typeorm";

export class CustomEmojiCategory1571220798684 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "category" character varying(128)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "category"`, undefined);
    }

}
