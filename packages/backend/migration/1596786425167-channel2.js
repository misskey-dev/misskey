/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class channel21596786425167 {
    constructor() {
        this.name = 'channel21596786425167';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_following" ADD "readCursor" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_following" DROP COLUMN "readCursor"`);
    }
}
