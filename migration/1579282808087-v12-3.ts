import {MigrationInterface, QueryRunner} from "typeorm";

export class v1231579282808087 implements MigrationInterface {
    name = 'v1231579282808087'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "updatedAt"`, undefined);
    }

}
