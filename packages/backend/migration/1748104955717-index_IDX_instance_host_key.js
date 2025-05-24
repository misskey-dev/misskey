/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class IndexIDXInstanceHostKey1748104955717 {
	name = 'IndexIDXInstanceHostKey1748104955717'

	async up(queryRunner) {
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_instance_host_key" ON "instance" (((lower(reverse("host")) || '.')::text) text_pattern_ops)`);

		// Flush all cached Linear Scan Plans and redo statistics for expression index
		// this is important for Postgres to learn that even in highly complex queries, using this index first can reduce the result set significantly
		await queryRunner.query(`ANALYZE "instance"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_instance_host_key"`);
	}
}
