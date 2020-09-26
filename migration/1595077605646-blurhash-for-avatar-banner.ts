import {MigrationInterface, QueryRunner} from "typeorm";

export class blurhashForAvatarBanner1595077605646 implements MigrationInterface {
    name = 'blurhashForAvatarBanner1595077605646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarColor"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerColor"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarBlurhash" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerBlurhash" character varying(128)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerColor" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarColor" character varying(32)`);
    }

}
