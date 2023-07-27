/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class removeInstanceDriveColumns1646655454495 {
    name = 'removeInstanceDriveColumns1646655454495'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "driveUsage"`);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "driveFiles"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "driveFiles" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "driveUsage" bigint NOT NULL DEFAULT '0'`);
    }
}
