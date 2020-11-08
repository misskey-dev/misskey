import {MigrationInterface, QueryRunner} from "typeorm";

export class deleteAutoWatch1604821689616 implements MigrationInterface {
    name = 'deleteAutoWatch1604821689616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "autoWatch"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "autoWatch" boolean NOT NULL DEFAULT false`);
    }

}
