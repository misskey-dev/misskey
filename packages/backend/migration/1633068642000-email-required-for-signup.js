"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class emailRequiredForSignup1633068642000 {
    constructor() {
        this.name = 'emailRequiredForSignup1633068642000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "emailRequiredForSignup" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emailRequiredForSignup"`);
    }
}
exports.emailRequiredForSignup1633068642000 = emailRequiredForSignup1633068642000;
