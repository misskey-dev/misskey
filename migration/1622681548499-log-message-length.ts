import {MigrationInterface, QueryRunner} from "typeorm";

export class logMessageLength1622681548499 implements MigrationInterface {
	name = 'logMessageLength1622681548499';
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "message" TYPE character varying(2048)`, undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "message" TYPE character varying(1024)`, undefined);
	}
}
