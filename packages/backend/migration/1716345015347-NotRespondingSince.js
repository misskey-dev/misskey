/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NotRespondingSince1716345015347 {
    name = 'NotRespondingSince1716345015347'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "notRespondingSince" TIMESTAMP WITH TIME ZONE`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "notRespondingSince"`);
    }
}
