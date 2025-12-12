/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class InquiryUrl1717117195275 {
    name = 'InquiryUrl1717117195275'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "inquiryUrl" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "inquiryUrl"`);
    }
}
