import {MigrationInterface, QueryRunner} from "typeorm";

export class v12111580331224276 implements MigrationInterface {
    name = 'v12111580331224276'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isMarkedAsClosed"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "isSuspended" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_34500da2e38ac393f7bb6b299c" ON "instance" ("isSuspended") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_34500da2e38ac393f7bb6b299c"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isSuspended"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "isMarkedAsClosed" boolean NOT NULL DEFAULT false`, undefined);
    }

}
