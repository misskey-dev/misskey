export class IsSheep1689102914719 {
	name = 'IsSheep1689102914719.js'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user" ADD "isSheep" boolean NOT NULL DEFAULT false`);
			await queryRunner.query(`COMMENT ON COLUMN "user"."isSheep" IS 'Whether the User is a sheep.'`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSheep"`);
	}
}
