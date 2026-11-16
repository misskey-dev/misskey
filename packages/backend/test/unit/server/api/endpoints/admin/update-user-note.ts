/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import _Ajv from 'ajv';
import { DB_MAX_USER_MODERATION_NOTE_LENGTH } from '@/const.js';
import { paramDef } from '@/server/api/endpoints/admin/update-user-note.js';

const Ajv = _Ajv.default;

const ajv = new Ajv({
	useDefaults: true,
});
ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);
const validate = ajv.compile(paramDef);

describe('admin/update-user-note', () => {
	test('accepts a note at the database column limit', () => {
		expect(validate({
			userId: 'abc',
			text: 'a'.repeat(DB_MAX_USER_MODERATION_NOTE_LENGTH),
		})).toBe(true);
	});

	test('rejects a note one character past the database column limit', () => {
		expect(validate({
			userId: 'abc',
			text: 'a'.repeat(DB_MAX_USER_MODERATION_NOTE_LENGTH + 1),
		})).toBe(false);
		expect(validate.errors?.[0]?.keyword).toBe('maxLength');
	});

	test('counts a surrogate pair as one character', () => {
		const emoji = '😀';
		expect(emoji.length).toBe(2);
		expect(validate({
			userId: 'abc',
			text: 'a'.repeat(DB_MAX_USER_MODERATION_NOTE_LENGTH - 1) + emoji,
		})).toBe(true);
	});

	test('rejects one code point past the limit when it is a surrogate pair', () => {
		expect(validate({
			userId: 'abc',
			text: 'a'.repeat(DB_MAX_USER_MODERATION_NOTE_LENGTH) + '😀',
		})).toBe(false);
		expect(validate.errors?.[0]?.keyword).toBe('maxLength');
	});
});
