import {MigrationInterface, QueryRunner} from "typeorm";

export class deleteLog1634902659689 implements MigrationInterface {
    name = 'deleteLog1634902659689'

    public async up(queryRunner: QueryRunner): Promise<void> {
			await queryRunner.query(`DROP TABLE "log"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
