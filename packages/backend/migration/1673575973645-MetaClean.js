/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MetaClean1673575973645 {
    name = 'MetaClean1673575973645'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "remoteDriveCapacityMb"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "remoteDriveCapacityMb" integer NOT NULL DEFAULT '32'`);
    }
}
