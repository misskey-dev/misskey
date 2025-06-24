/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class IndexIDXInstanceHostKey1748104955717 {
	name = 'IndexIDXInstanceHostKey1748104955717'

	async up(queryRunner) {
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_instance_host_key" ON "instance" (((lower(reverse("host")) || '.')::text) text_pattern_ops)`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_instance_host_key"`);
	}
}
