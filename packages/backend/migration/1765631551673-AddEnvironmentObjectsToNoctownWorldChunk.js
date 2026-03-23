/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddEnvironmentObjectsToNoctownWorldChunk1765631551673 {
	name = 'AddEnvironmentObjectsToNoctownWorldChunk1765631551673'

	async up(queryRunner) {
		// Check if column already exists
		const table = await queryRunner.getTable('noctown_world_chunk');
		const columnExists = table?.columns.find(column => column.name === 'environmentObjects');

		if (!columnExists) {
			await queryRunner.query(`ALTER TABLE "noctown_world_chunk" ADD "environmentObjects" jsonb`);
			await queryRunner.query(`COMMENT ON COLUMN "noctown_world_chunk"."environmentObjects" IS 'Environment objects (trees, rocks, etc.)'`);
		}
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "noctown_world_chunk" DROP COLUMN "environmentObjects"`);
	}
}
