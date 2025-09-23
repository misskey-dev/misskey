/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RenameChatSecretSettingsColumns1758290164057 {
	name = 'RenameChatSecretSettingsColumns1758290164057'

	async up(queryRunner) {
		// Check if the table exists and what columns it has
		const tableExists = await queryRunner.hasTable("chat_secret_settings");
		if (!tableExists) {
			console.log("chat_secret_settings table does not exist, skipping migration");
			return;
		}

		// Check if userId1 column exists (old schema)
		const hasUserId1 = await queryRunner.hasColumn("chat_secret_settings", "userId1");
		const hasUser1Id = await queryRunner.hasColumn("chat_secret_settings", "user1Id");

		if (hasUserId1 && !hasUser1Id) {
			console.log("Renaming userId1/userId2 to user1Id/user2Id in chat_secret_settings");

			// First, ensure data consistency: make sure userId1 <= userId2 (sort order)
			await queryRunner.query(`
				UPDATE "chat_secret_settings"
				SET "userId1" = LEAST("userId1", "userId2"),
					"userId2" = GREATEST("userId1", "userId2")
				WHERE "userId1" > "userId2"
			`);

			// Rename userId1 to user1Id and userId2 to user2Id in chat_secret_settings table
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" RENAME COLUMN "userId1" TO "user1Id"`);
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" RENAME COLUMN "userId2" TO "user2Id"`);

			// Update constraint names if they exist
			try {
				await queryRunner.query(`ALTER TABLE "chat_secret_settings" DROP CONSTRAINT "UQ_chat_secret_settings_userId1_userId2"`);
			} catch (error) {
				console.log("Constraint UQ_chat_secret_settings_userId1_userId2 does not exist, skipping");
			}

			// Add the new unique constraint
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" ADD CONSTRAINT "UQ_chat_secret_settings_user1Id_user2Id" UNIQUE ("user1Id", "user2Id")`);
		} else if (hasUser1Id) {
			console.log("Column renaming already completed, skipping");
		} else {
			console.log("Neither userId1 nor user1Id found, table structure might be different");
		}
	}

	async down(queryRunner) {
		// Reverse the column renaming
		const hasUser1Id = await queryRunner.hasColumn("chat_secret_settings", "user1Id");

		if (hasUser1Id) {
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" DROP CONSTRAINT "UQ_chat_secret_settings_user1Id_user2Id"`);
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" RENAME COLUMN "user1Id" TO "userId1"`);
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" RENAME COLUMN "user2Id" TO "userId2"`);
			await queryRunner.query(`ALTER TABLE "chat_secret_settings" ADD CONSTRAINT "UQ_chat_secret_settings_userId1_userId2" UNIQUE ("userId1", "userId2")`);
		}
	}
}