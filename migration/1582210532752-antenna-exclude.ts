import {MigrationInterface, QueryRunner} from "typeorm";

export class antennaExclude1582210532752 implements MigrationInterface {
    name = 'antennaExclude1582210532752'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "excludeKeywords" jsonb NOT NULL DEFAULT '[]'`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "excludeKeywords"`, undefined);
    }

}
