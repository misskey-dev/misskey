/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChatRoomUpdatedAt1760000000000 {
	name = 'ChatRoomUpdatedAt1760000000000'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "chat_room" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
		await queryRunner.query(`ALTER TABLE "chat_room" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "chat_room" DROP COLUMN "updatedAt"`);
		await queryRunner.query(`ALTER TABLE "chat_room" DROP COLUMN "createdAt"`);
	}
}
