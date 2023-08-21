export class FixRenoteMuting1690417561185 {
    name = 'FixRenoteMuting1690417561185'

    async up(queryRunner) {
      await queryRunner.query(`DELETE FROM "renote_muting" WHERE "muteeId" NOT IN (SELECT "id" FROM "user")`);
      await queryRunner.query(`DELETE FROM "renote_muting" WHERE "muterId" NOT IN (SELECT "id" FROM "user")`);
    }

    async down(queryRunner) {

    }
}
