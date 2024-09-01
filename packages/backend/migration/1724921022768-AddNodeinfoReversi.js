/*
 * SPDX-FileCopyrightText: syuilo and misskey-project, yojo-art team
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddNodeinfoReversi1724921022768 {
    name = 'AddNodeinfoReversi1724921022768'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "reversiVersion" character varying(32)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "reversiVersion"`);
    }
}
