export class addHideSearchResult1679723973857 {
    name = 'addHideSearchResult1679723973857'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "hideSearchResult" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hideSearchResult"`);
    }
}
