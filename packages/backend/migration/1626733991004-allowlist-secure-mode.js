

export class allowlistSecureMode1626733991004  {
	name = 'allowlistSecureMode1626733991004';
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "allowedHosts" character varying(256) [] default '{}'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "secureMode" bool default false`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "privateMode" bool default false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowedHosts"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "secureMode"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "privateMode"`);
	}
}

