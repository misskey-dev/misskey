export class reportedUrls1642698156335 {
	name = 'reportedUrls1642698156335';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "urls" character varying (512) array NOT NULL DEFAULT '{}'::varchar[]`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "urls"`);
	}
};
