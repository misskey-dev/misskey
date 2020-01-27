import {MigrationInterface, QueryRunner} from "typeorm";

export class v1291580154400017 implements MigrationInterface {
    name = 'v1291580154400017'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "withReplies" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "withReplies"`, undefined);
    }

}
