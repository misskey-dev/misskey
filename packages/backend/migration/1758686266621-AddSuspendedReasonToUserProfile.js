export class AddSuspendedReasonToUserProfile1758686266621 {
    name = 'AddSuspendedReasonToUserProfile1758686266621'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "suspendedReason" character varying(8192) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "suspendedReason"`);
    }

}