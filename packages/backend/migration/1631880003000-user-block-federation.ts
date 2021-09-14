import {MigrationInterface, QueryRunner} from "typeorm";

export class userBlockFederation1631880003000 implements MigrationInterface {
	name = 'userBlockFederation1631880003000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user" ADD "federateBlocks" boolean NOT NULL DEFAULT true`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "federateBlocks"`);
	}

}
