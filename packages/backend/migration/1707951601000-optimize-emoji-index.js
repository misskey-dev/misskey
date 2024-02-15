/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OptimizeEmojiIndex1707951601000 {
	name = 'OptimizeEmojiIndex1707951601000'

	async up(queryRunner) {
		await queryRunner.query(`CREATE INDEX "IDX_EMOJI_ALIASES_IDS" ON "emoji" using gin ("aliases")`)
		await queryRunner.query(`CREATE INDEX "IDX_EMOJI_ROLE_IDS" ON "emoji" using gin ("roleIdsThatCanBeUsedThisEmojiAsReaction")`)
		await queryRunner.query(`CREATE INDEX "IDX_EMOJI_CATEGORY" ON "emoji" ("category")`)
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_EMOJI_CATEGORY"`)
		await queryRunner.query(`DROP INDEX "IDX_EMOJI_ROLE_IDS"`)
		await queryRunner.query(`DROP INDEX "IDX_EMOJI_ALIASES_IDS"`)
	}
}
