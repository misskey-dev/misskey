export class FeatChannnelAnnouncement1710854614048 {
    name = 'FeatChannnelAnnouncement1710854614048'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "announcement" character varying(2048)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "announcement"`);
    }
}
