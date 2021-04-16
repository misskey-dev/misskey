import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSomeUrls1557761316509 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "ToSUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "repositoryUrl" character varying(512) NOT NULL DEFAULT 'https://github.com/misskey-dev/misskey'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "feedbackUrl" character varying(512) DEFAULT 'https://github.com/misskey-dev/misskey/issues/new'`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "feedbackUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "repositoryUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "ToSUrl"`);
    }
}
