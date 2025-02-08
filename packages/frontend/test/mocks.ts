/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import { vi } from 'vitest';

export const UserLiteMock = vi.fn(() => {
	return {
		id: 'xxxxxxxx',
		username: 'ai',
		host: null,
		name: '藍',
		avatarUrl: null,
		avatarBlurhash: null,
		avatarDecorations: [],
		emojis: {},
		onlineStatus:	'online',
	} as Misskey.entities.UserLite;
});

export const NoteMock = vi.fn((options?: {
	text?: string,
	cw?: string,
}) => {
	const user = new UserLiteMock();
	return {
		id: 'xxxxxxxx',
		// 2025/01/01 00:00:00 UTC on Unix time
		createdAt: '1767225600000',
		text: options?.text ?? 'Hello, Misskey!',
		cw: options?.cw,
		userId: user.id,
		user: user,
		visibility: 'public',
		reactionAcceptance: null,
		reactionEmojis: {},
		reactions: {},
		reactionCount: 0,
		renoteCount: 0,
		repliesCount: 0,
	} as Misskey.entities.Note;
});
