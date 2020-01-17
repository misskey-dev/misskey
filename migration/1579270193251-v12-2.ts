import {MigrationInterface, QueryRunner} from "typeorm";

export class v1221579270193251 implements MigrationInterface {
    name = 'v1221579270193251'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "announcement_read" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "announcement_read" DROP COLUMN "createdAt"`, undefined);
    }

}
