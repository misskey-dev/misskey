/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DeliverSuspendedSoftware1743403874305 {
    name = 'DeliverSuspendedSoftware1743403874305'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deliverSuspendedSoftware" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deliverSuspendedSoftware"`);
    }
}
