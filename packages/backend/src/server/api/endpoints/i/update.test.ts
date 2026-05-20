/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, test, expect } from 'vitest';
import { getValidator } from '../../../../../test/prelude/get-api-validator.js';
import { paramDef } from './update.js';

const VALID = true;
const INVALID = false;

describe('api:i/update', () => {
	describe('validation', () => {
		const v = getValidator(paramDef);

		test('Accept hiddenRoleIds', () => expect(v({ hiddenRoleIds: ['9m4e2mr0ui'] })).toBe(VALID));
		test('Reject malformed hiddenRoleIds', () => expect(v({ hiddenRoleIds: ['not-valid:id'] })).toBe(INVALID));
		test('Reject too many hiddenRoleIds', () => expect(v({ hiddenRoleIds: Array.from({ length: 257 }, (_, i) => `role${i}`) })).toBe(INVALID));
		test('Reject duplicate hiddenRoleIds', () => expect(v({ hiddenRoleIds: ['9m4e2mr0ui', '9m4e2mr0ui'] })).toBe(INVALID));
	});
});
