"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class announcementEmail1612619156584 {
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
exports.announcementEmail1612619156584 = announcementEmail1612619156584;
