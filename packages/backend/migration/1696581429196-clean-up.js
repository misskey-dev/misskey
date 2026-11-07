/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CleanUp1696581429196 {
    name = 'CleanUp1696581429196'

    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "muted_note"`);
    }

    async down(queryRunner) {
    }
}
