export class Mutuallinks1723311628855 {
    name = 'Mutuallinks1723311628855'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutualLinkSections" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutualLinkSections"`);
    }
}
