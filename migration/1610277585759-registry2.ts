import {MigrationInterface, QueryRunner} from "typeorm";

export class registry21610277585759 implements MigrationInterface {
    name = 'registry21610277585759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registry_item" ADD "value" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`COMMENT ON COLUMN "registry_item"."value" IS 'The value of the RegistryItem.'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "registry_item"."value" IS 'The value of the RegistryItem.'`);
        await queryRunner.query(`ALTER TABLE "registry_item" DROP COLUMN "value"`);
    }

}
