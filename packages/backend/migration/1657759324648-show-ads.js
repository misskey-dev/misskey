export class showAds1657759324648 {
	name = 'showAds1657759324648'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "showAds" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user_profile" DROP "showAds"`);
	}
}
