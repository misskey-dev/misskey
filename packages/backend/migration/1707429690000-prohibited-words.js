/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class prohibitedWords1707429690000 {
    name = 'prohibitedWords1707429690000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "prohibitedWords" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "prohibitedWords"`);
    }
}
