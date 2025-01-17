export class AddIsInYamiModeColumnToMiUser1723641187454 {
  name = 'AddIsInYamiModeColumnToMiUser1723641187454'

  async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isInYamiMode" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isInYamiMode" IS 'Whether the User is in Yami Mode.'`);
	}

  async down(queryRunner) {
      await queryRunner.query(`COMMENT ON COLUMN "user"."isInYamiMode" IS 'Whether the User is in Yami Mode.'`);
      await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isInYamiMode"`);
  }
}
