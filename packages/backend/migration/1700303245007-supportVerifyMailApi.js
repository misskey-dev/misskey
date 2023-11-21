/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SupportVerifyMailApi1700303245007 {
    name = 'SupportVerifyMailApi1700303245007'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "verifymailAuthKey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableVerifymailApi" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableVerifymailApi"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "verifymailAuthKey"`);
    }
}
