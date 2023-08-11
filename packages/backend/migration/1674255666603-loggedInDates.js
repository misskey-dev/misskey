export class loggedInDates1674255666603 {
    name = 'loggedInDates1674255666603'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "loggedInDates" character varying(32) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "loggedInDates"`);
    }
}
