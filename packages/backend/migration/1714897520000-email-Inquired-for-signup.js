/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class emailInquiredForSignup1714897520000 {
    constructor() {
        this.name = 'emailInquiredForSignup1714897520000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "emailInquiredForSignup" boolean NOT NULL DEFAULT true`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emailInquiredForSignup"`);
    }
}
