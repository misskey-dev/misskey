/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class sensitiveWords1678694614599 {
    name = 'sensitiveWords1678694614599'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveWords" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveWords"`);
    }
}
