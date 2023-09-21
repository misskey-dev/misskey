export class AvatarUrlAndBannerUrl1680775031481 {
    name = 'AvatarUrlAndBannerUrl1680775031481'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarBlurhash" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerBlurhash" character varying(128)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerUrl"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarUrl"`);
    }
}
