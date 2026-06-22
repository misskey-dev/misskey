/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DeliverReactionsToRelays1777776758782 {
    name = 'DeliverReactionsToRelays1777776758782'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deliverReactionsToRelays" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deliverReactionsToRelays"`);
    }
}
