import {MigrationInterface, QueryRunner} from "typeorm";

export class PasswordLessLogin1562422242907 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<any> {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "usePasswordLessLogin" boolean DEFAULT false NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<any> {
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "usePasswordLessLogin"`);
	}

}
