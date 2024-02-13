/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function getUserName(user: { name?: string | null; username: string }): string {
	return user.name === '' ? user.username : user.name ?? user.username;
}
