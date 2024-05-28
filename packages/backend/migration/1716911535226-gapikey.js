export class Gapikey1716911535226 {
    name = 'Gapikey1716911535226'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "googleAnalyticsId" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "googleAnalyticsId"`);
    }
}
