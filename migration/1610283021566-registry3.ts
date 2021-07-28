import {MigrationInterface, QueryRunner} from "typeorm";

export class registry31610283021566 implements MigrationInterface {
    name = 'registry31610283021566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "value" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "value" SET NOT NULL`);
    }

}
