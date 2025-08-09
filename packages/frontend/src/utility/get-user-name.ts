/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export default function(user: { name?: string | null, username: string }): string {
	return user.name === '' ? user.username : user.name ?? user.username;
}
