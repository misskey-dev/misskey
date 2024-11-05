export class GoogleAnalyticsId1730629332694 {
    name = 'GoogleAnalyticsId1730629332694'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "googleAnalyticsId" character varying(32)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "googleAnalyticsId"`);
    }
}
