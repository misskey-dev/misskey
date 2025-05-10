/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function isConcurrentIndexMigrationEnabled() {
	return process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';
}
