import {MigrationInterface, QueryRunner} from "typeorm";

export class instancePinnedPages1605585339718 implements MigrationInterface {
    name = 'instancePinnedPages1605585339718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "pinnedPages" character varying(512) array NOT NULL DEFAULT '{"/featured", "/channels", "/explore", "/pages", "/about-misskey"}'::varchar[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "pinnedPages"`);
    }

}
