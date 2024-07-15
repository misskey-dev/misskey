export class Outsideprismisskey1714831133155 {
    name = 'Outsideprismisskey1714831133155'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "bannerDark" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "bannerLight" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "iconDark" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "iconLight" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "iconLight"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "iconDark"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "bannerLight"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "bannerDark"`);
    }
}
