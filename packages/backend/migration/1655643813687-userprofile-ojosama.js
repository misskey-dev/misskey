export class migration1655643813687 {
    name = 'migration1655643813687'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "isOjosama" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "isOjosama"`);
    }
}
