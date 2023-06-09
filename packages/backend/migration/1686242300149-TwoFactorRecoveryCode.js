export class TwoFactorRecoveryCode1686242300149 {
    name = 'TwoFactorRecoveryCode1686242300149'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "twoFactorRecoveryCodes" text NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "twoFactorRecoveryCodes"`);
    }
}
