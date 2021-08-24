import {MigrationInterface, QueryRunner} from "typeorm";

export class addPleromaTL1629659466000 implements MigrationInterface {
    name = 'addPleromaTL1629659466000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "showTimelineReplies" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."showTimelineReplies" IS 'Whether the User is using pleroma-style timelines.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "showTimelineReplies"`);
    }

}
