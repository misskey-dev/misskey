/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SwSubscriptionAccessToken1794134953175 {
    name = 'SwSubscriptionAccessToken1794134953175';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sw_subscription" ADD "accessTokenId" character varying(32)`);
        await queryRunner.query(`CREATE INDEX "IDX_97efb48ec423a6c1ac4cd49f80" ON "sw_subscription" ("accessTokenId") `);
        await queryRunner.query(`ALTER TABLE "sw_subscription" ADD CONSTRAINT "FK_97efb48ec423a6c1ac4cd49f801" FOREIGN KEY ("accessTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sw_subscription" DROP CONSTRAINT "FK_97efb48ec423a6c1ac4cd49f801"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97efb48ec423a6c1ac4cd49f80"`);
        await queryRunner.query(`ALTER TABLE "sw_subscription" DROP COLUMN "accessTokenId"`);
    }
}
