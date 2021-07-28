import {MigrationInterface, QueryRunner} from "typeorm";

export class noCrawle1606191203881 implements MigrationInterface {
    name = 'noCrawle1606191203881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "noCrawle" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "noCrawle"`);
    }

}
