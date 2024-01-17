/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BubbleGameRecordPrivate1705490151571 {
	name = 'BubbleGameRecordPrivate1705490151571'

	async up(queryRunner) {
		await queryRunner.query('alter table bubble_game_record add "isPrivate" boolean default false');
	}

	async down(queryRunner) {
		await queryRunner.query(`alter table bubble_game_record drop column "isPrivate"`);
	}
}
