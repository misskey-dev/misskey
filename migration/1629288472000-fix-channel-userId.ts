import {MigrationInterface, QueryRunner} from "typeorm";

export class fixChannelUserId1629288472000 implements MigrationInterface {
    name = 'fixChannelUserId1629288472000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "userId" DROP NOT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel" ALTER COLUMN "userId" SET NOT NULL;`);
    }

}
