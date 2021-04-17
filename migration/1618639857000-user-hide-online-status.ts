import {MigrationInterface, QueryRunner} from "typeorm";

export class userHideOnlineStatus1618639857000 implements MigrationInterface {
    name = 'userHideOnlineStatus1618639857000'

    public async up(queryRunner: QueryRunner): Promise<void> {
			await queryRunner.query(`ALTER TABLE "user" ADD "hideOnlineStatus" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hideOnlineStatus"`);
    }

}
