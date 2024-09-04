/*
 * SPDX-FileCopyrightText: Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelCollaborator1725479489061 {
	name = 'ChannelCollaborator1725479489061';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "channel" ADD "collaboratorIds" jsonb NOT NULL DEFAULT \'[]\'');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "channel" DROP COLUMN "collaboratorIds"');
	}
}
