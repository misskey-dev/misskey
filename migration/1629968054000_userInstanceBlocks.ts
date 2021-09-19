import {MigrationInterface, QueryRunner} from "typeorm";

export class userInstanceBlocks1629968054000 implements MigrationInterface {
    name = 'userInstanceBlocks1629968054000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutedInstances" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."mutedInstances" IS 'List of instances muted by the user.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutedInstances"`);
    }

}
