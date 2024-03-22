export class ExternalWebsiteWarn1711008460816 {
    name = 'ExternalWebsiteWarn1711008460816'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "wellKnownWebsites" character varying(3072) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "wellKnownWebsites"`);
    }
}
