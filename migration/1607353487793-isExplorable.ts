import {MigrationInterface, QueryRunner} from "typeorm";

export class isExplorable1607353487793 implements MigrationInterface {
    name = 'isExplorable1607353487793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isExplorable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isExplorable" IS 'Whether the User is explorable.'`);
        await queryRunner.query(`CREATE INDEX "IDX_d5a1b83c7cab66f167e6888188" ON "user" ("isExplorable") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_d5a1b83c7cab66f167e6888188"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isExplorable" IS 'Whether the User is explorable.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isExplorable"`);
    }

}
