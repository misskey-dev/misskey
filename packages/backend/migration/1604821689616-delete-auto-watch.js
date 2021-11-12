"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class deleteAutoWatch1604821689616 {
    constructor() {
        this.name = 'deleteAutoWatch1604821689616';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "autoWatch"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "autoWatch" boolean NOT NULL DEFAULT false`);
    }
}
exports.deleteAutoWatch1604821689616 = deleteAutoWatch1604821689616;
