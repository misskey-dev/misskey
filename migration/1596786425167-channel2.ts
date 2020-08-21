import {MigrationInterface, QueryRunner} from "typeorm";

export class channel21596786425167 implements MigrationInterface {
    name = 'channel21596786425167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_following" ADD "readCursor" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_following" DROP COLUMN "readCursor"`);
    }

}
