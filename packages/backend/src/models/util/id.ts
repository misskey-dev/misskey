/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const id = () => ({
	type: 'varchar' as const,
	length: 32,
});
