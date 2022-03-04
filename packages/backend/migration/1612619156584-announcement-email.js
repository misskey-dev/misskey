

export class announcementEmail1612619156584 {
    constructor() {
        this.name = 'announcementEmail1612619156584';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "receiveAnnouncementEmail" boolean NOT NULL DEFAULT true`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "receiveAnnouncementEmail"`);
    }
}
