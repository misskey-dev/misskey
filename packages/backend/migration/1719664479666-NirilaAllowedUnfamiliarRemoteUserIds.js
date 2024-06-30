/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NirilaAllowedUnfamiliarRemoteUserIds1719664479666 {
    name = 'NirilaAllowedUnfamiliarRemoteUserIds1719664479666'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "nirilaAllowedUnfamiliarRemoteUserIds" character varying(32) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "nirilaAllowedUnfamiliarRemoteUserIds"`);
    }
}
