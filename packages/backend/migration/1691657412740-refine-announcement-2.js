export class RefineAnnouncement21691657412740 {
    name = 'RefineAnnouncement21691657412740'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "icon" character varying(256) NOT NULL DEFAULT 'info'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "icon"`);
    }
}
