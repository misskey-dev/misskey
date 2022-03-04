export class instanceDefaultTheme1646143552768 {
    name = 'instanceDefaultTheme1646143552768'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "defaultLightTheme" character varying(8192)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "defaultDarkTheme" character varying(8192)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultDarkTheme"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultLightTheme"`);
    }
}
