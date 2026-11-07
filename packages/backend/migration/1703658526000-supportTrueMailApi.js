/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SupportTrueMailApi1703658526000 {
    name = 'SupportTrueMailApi1703658526000'

    async up(queryRunner) {
    	  await queryRunner.query(`ALTER TABLE "meta" ADD "truemailInstance" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "truemailAuthKey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableTruemailApi" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableTruemailApi"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "truemailInstance"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "truemailAuthKey"`);
    }
}
