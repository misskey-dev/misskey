/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class AnalyzeInstanceUserNoteFollowing1748191631151 {
	name = 'AnalyzeInstanceUserNoteFollowing1748191631151'

	async up(queryRunner) {
		// Refresh statistics for tables impacted by new indexes.
		// This helps the query planner to efficiently use them without waiting for the next full vacuum.
		await queryRunner.query(`ANALYZE "instance", "user", "following", "note"`);
	}

	async down(queryRunner) {
	}
}
