export class userModerationNote1656772790599 {
    name = 'userModerationNote1656772790599'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "moderationNote" character varying(8192) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "moderationNote"`);
    }
}
