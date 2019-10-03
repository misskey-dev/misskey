import {MigrationInterface, QueryRunner} from "typeorm";

export class PremiumDrive1570091775183 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "premiumDriveCapacityMb" integer NOT NULL DEFAULT 2048`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "premiumDriveCapacityMb"`, undefined);
    }

}
