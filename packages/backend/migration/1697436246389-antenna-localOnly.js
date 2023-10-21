/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AntennaLocalOnly1697436246389 {
    name = 'AntennaLocalOnly1697436246389'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "localOnly" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "localOnly"`);
    }
}
