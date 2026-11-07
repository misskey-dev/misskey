/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddSomeUrls1696003580220 {
    name = 'AddSomeUrls1696003580220'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "impressumUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "privacyPolicyUrl" character varying(1024)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "impressumUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "privacyPolicyUrl"`);
    }
}
