/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class removeLatestStatus1672704136584 {
    name = 'removeLatestStatus1672704136584'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "latestStatus"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "latestStatus" integer`);
    }
}
