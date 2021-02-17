import {MigrationInterface, QueryRunner} from "typeorm";

export class useBigintForDriveUsage1613503367223 implements MigrationInterface {
    name = 'useBigintForDriveUsage1613503367223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "driveUsage" TYPE bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "driveUsage"`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "driveUsage" integer NOT NULL DEFAULT 0`);
    }

}
