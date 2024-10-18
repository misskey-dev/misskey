export class AnnouncementNeedEnrollmentTutorialToRead1729270181417 {
    name = 'AnnouncementNeedEnrollmentTutorialToRead1729270181417'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "needEnrollmentTutorialToRead" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "needEnrollmentTutorialToRead"`);
    }
}
