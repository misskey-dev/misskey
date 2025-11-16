/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddMutingType1762516776421 {
    name = 'AddMutingType1762516776421'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "muting" ADD "mutingType" varchar(128) NOT NULL DEFAULT 'all'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "muting" DROP COLUMN "mutingType"`);
    }
}
