/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class useBigintForDriveUsage1613503367223 {
    constructor() {
        this.name = 'useBigintForDriveUsage1613503367223';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "driveUsage" TYPE bigint`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "driveUsage"`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "driveUsage" integer NOT NULL DEFAULT 0`);
    }
}
