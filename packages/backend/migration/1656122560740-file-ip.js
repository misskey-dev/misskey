/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class fileIp1656122560740 {
    name = 'fileIp1656122560740'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "requestHeaders" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "requestIp" character varying(128)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "requestIp"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "requestHeaders"`);
    }
}
