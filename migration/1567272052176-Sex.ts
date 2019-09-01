import {MigrationInterface, QueryRunner} from "typeorm";

export class Sex1567272052176 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<any> {
			await queryRunner.query(`CREATE TYPE "user_sex_enum" AS ENUM('not-known', 'male', 'female', 'not-applicable')`);
			await queryRunner.query(`ALTER TABLE "user" ADD "sex" "user_sex_enum" NOT NULL DEFAULT 'not-known'`);
	}

	public async down(queryRunner: QueryRunner): Promise<any> {
			await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sex"`);
			await queryRunner.query(`DROP TYPE "user_sex_enum"`);
	}
}
