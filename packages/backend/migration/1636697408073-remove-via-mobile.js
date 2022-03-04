

export class removeViaMobile1636697408073 {
    name = 'removeViaMobile1636697408073'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "viaMobile"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "viaMobile" boolean NOT NULL DEFAULT false`);
    }
}
