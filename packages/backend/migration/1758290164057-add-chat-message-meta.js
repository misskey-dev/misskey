/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddChatMessageMeta1758290164057 {
	name = 'AddChatMessageMeta1758290164057'

	async up(queryRunner) {
		// Add meta field to chat_message table
		await queryRunner.query(`ALTER TABLE "chat_message" ADD "meta" jsonb`);
	}

	async down(queryRunner) {
		// Remove meta field from chat_message table
		await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "meta"`);
	}
}