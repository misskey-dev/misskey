export class enableChartsForFederatedInstances1679652081809 {
    name = 'enableChartsForFederatedInstances1679652081809'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "enableChartsForFederatedInstances" boolean NOT NULL DEFAULT true`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableChartsForFederatedInstances"`);
	}
}
