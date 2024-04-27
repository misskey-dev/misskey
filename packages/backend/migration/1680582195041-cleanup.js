/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class cleanup1680582195041 {
    name = 'cleanup1680582195041'

    async up(queryRunner) {
			await queryRunner.query(`DROP TABLE "notification" `);
    }

    async down(queryRunner) {

    }
}
