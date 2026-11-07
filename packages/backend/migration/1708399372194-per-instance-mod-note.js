/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PerInstanceModNote1708399372194 {
    name = 'PerInstanceModNote1708399372194'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "moderationNote" character varying(16384) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "moderationNote"`);
    }
}
