import {MigrationInterface, QueryRunner} from "typeorm";

export class PageTitleHideOption1562448332510 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "page" ADD "hideTitleWhenPinned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "hideTitleWhenPinned"`);
    }

}
