import {MigrationInterface, QueryRunner} from "typeorm";

export class pageAiScript1586708940386 implements MigrationInterface {
    name = 'pageAiScript1586708940386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page" ADD "script" character varying(16384) NOT NULL DEFAULT ''`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "script"`, undefined);
    }

}
