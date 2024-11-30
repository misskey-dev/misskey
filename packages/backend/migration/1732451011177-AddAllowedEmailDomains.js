/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAllowedEmailDomains1732451011177 {
    name = 'AddAllowedEmailDomains1732451011177'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "allowedEmailDomains" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowedEmailDomains"`);
    }
}
