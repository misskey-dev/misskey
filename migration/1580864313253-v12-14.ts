import {MigrationInterface, QueryRunner} from "typeorm";

export class v12141580864313253 implements MigrationInterface {
    name = 'v12141580864313253'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "proxyAccount" TO "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyAccountId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad" FOREIGN KEY ("proxyAccountId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyAccountId" character varying(128)`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "proxyAccountId" TO "proxyAccount"`, undefined);
    }

}
