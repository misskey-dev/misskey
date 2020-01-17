import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsGroup1579599918022 implements MigrationInterface {
    name = 'AddIsGroup1579599918022'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isGroup" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isGroup"`);
    }

}
