export class AddIsInHanaModeColumnToMiUser1723641187454 {
  name = 'AddIsInHanaModeColumnToMiUser1723641187454'

  async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isInHanaMode" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isInHanaMode" IS 'Whether the User is in Hana Mode.'`);
	}

  async down(queryRunner) {
      await queryRunner.query(`COMMENT ON COLUMN "user"."isInHanaMode" IS 'Whether the User is in Hana Mode.'`);
      await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isInHanaMode"`);
  }
}
