export class ad1676438468213 {
	name = 'ad1676438468213';
	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "ad" ADD "startAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "startAt"`);
	}
}
