import {MigrationInterface, QueryRunner} from "typeorm";

export class allowlistSecureMode1626733991004 implements MigrationInterface {
	name = 'allowlistSecureMode1626733991004';
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "meta" ADD "allowedHosts" character varying(256) [] default '{}'`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" ADD "secureMode" bool default false`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" ADD "privateMode" bool default false`, undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowedHosts"`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "secureMode"`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "privateMode"`, undefined);
	}
}
