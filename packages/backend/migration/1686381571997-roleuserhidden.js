export class roleuserhidden1686381571997 {
    name = 'roleuserhidden1686381571997'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "isPublicUsers" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "isPublicUsers"`);
     }
}
