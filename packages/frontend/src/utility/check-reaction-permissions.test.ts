/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as Misskey from 'misskey-js';

import { checkReactionPermissions } from './check-reaction-permissions.js';

describe('checkReactionPermissions', () => {
	const me = {
		host: null,
		roles: [],
	} as unknown as Misskey.entities.MeDetailed;

	const localOnlyEmoji = {
		localOnly: true,
		isSensitive: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: [],
	} as unknown as Misskey.entities.EmojiSimple;

	function note(userHost: string | null, renoteUserHost?: string | null): Misskey.entities.Note {
		return {
			user: {
				host: userHost,
			},
			renote: renoteUserHost === undefined ? undefined : {
				user: {
					host: renoteUserHost,
				},
			},
			reactionAcceptance: null,
		} as unknown as Misskey.entities.Note;
	}

	test('allows local-only custom emoji reactions to local notes', () => {
		expect(checkReactionPermissions(me, note(null), localOnlyEmoji)).toBe(true);
	});

	test('denies local-only custom emoji reactions to renotes of remote notes', () => {
		expect(checkReactionPermissions(me, note(null, 'remote.example'), localOnlyEmoji)).toBe(false);
	});
});
