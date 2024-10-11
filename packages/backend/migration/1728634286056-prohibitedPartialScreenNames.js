export class ProhibitedPartialScreenNames1728634286056 {
		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "prohibitedPartialScreenNames" character varying(1024) array NOT NULL DEFAULT '{}'`);
		}

		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "prohibitedPartialScreenNames"`);
		}
}
