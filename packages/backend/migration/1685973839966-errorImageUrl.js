/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ErrorImageUrl1685973839966 {
    name = 'ErrorImageUrl1685973839966'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "errorImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "serverErrorImageUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "notFoundImageUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "infoImageUrl" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "infoImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "notFoundImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "serverErrorImageUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "errorImageUrl" character varying(1024) DEFAULT 'https://xn--931a.moe/aiart/yubitun.png'`);
    }
}
