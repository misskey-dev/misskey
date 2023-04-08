export class enableChartsForRemoteUser1679639483253 {
    name = 'enableChartsForRemoteUser1679639483253'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableChartsForRemoteUser" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableChartsForRemoteUser"`);
    }
}
