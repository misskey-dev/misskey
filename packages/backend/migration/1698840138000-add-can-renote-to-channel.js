/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddCanRenoteToChannel1698840138000 {
    name = 'AddCanRenoteToChannel1698840138000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "canRenote" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "canRenote"`);
    }
}
