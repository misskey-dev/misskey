/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class firstRetrievedAt1673812883772 {
    name = 'firstRetrievedAt1673812883772'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "caughtAt" TO "firstRetrievedAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "firstRetrievedAt" TO "caughtAt"`);
    }
}
