/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddSecretMessageFeatures1758290164056 {
	name = 'AddSecretMessageFeatures1758290164056'

	async up(queryRunner) {
		// Add expiresAt and isSystemMessage fields to chat_message table
		await queryRunner.query(`ALTER TABLE "chat_message" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "chat_message" ADD "isSystemMessage" boolean NOT NULL DEFAULT false`);

		// Add isSecretMessageMode field to chat_room table
		await queryRunner.query(`ALTER TABLE "chat_room" ADD "isSecretMessageMode" boolean NOT NULL DEFAULT false`);

		// Create chat_secret_settings table for 1-on-1 chat settings
		await queryRunner.query(`CREATE TABLE "chat_secret_settings" (
			"id" character varying(32) NOT NULL,
			"userId1" character varying(32) NOT NULL,
			"userId2" character varying(32) NOT NULL,
			"isSecretMessageMode" boolean NOT NULL DEFAULT false,
			CONSTRAINT "UQ_chat_secret_settings_userId1_userId2" UNIQUE ("userId1", "userId2"),
			CONSTRAINT "PK_chat_secret_settings" PRIMARY KEY ("id")
		)`);

		// Create indexes
		await queryRunner.query(`CREATE INDEX "IDX_chat_secret_settings_userId1" ON "chat_secret_settings" ("userId1")`);
		await queryRunner.query(`CREATE INDEX "IDX_chat_secret_settings_userId2" ON "chat_secret_settings" ("userId2")`);

		// Add foreign key constraints
		await queryRunner.query(`ALTER TABLE "chat_secret_settings" ADD CONSTRAINT "FK_chat_secret_settings_userId1" FOREIGN KEY ("userId1") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "chat_secret_settings" ADD CONSTRAINT "FK_chat_secret_settings_userId2" FOREIGN KEY ("userId2") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		// Drop foreign key constraints
		await queryRunner.query(`ALTER TABLE "chat_secret_settings" DROP CONSTRAINT "FK_chat_secret_settings_userId2"`);
		await queryRunner.query(`ALTER TABLE "chat_secret_settings" DROP CONSTRAINT "FK_chat_secret_settings_userId1"`);

		// Drop indexes
		await queryRunner.query(`DROP INDEX "IDX_chat_secret_settings_userId2"`);
		await queryRunner.query(`DROP INDEX "IDX_chat_secret_settings_userId1"`);

		// Drop chat_secret_settings table
		await queryRunner.query(`DROP TABLE "chat_secret_settings"`);

		// Remove fields from chat_room table
		await queryRunner.query(`ALTER TABLE "chat_room" DROP COLUMN "isSecretMessageMode"`);

		// Remove fields from chat_message table
		await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "isSystemMessage"`);
		await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "expiresAt"`);
	}
}