/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, test, expect } from 'vitest';
import { getValidator } from '../../../../../../test/prelude/get-api-validator.js';
import { paramDef as createParamDef } from './create.js';
import { paramDef as updateParamDef } from './update.js';

const VALID = true;
const INVALID = false;

const baseCreateParams = {
	name: 'Role',
	description: '',
	color: null,
	iconUrl: null,
	target: 'manual',
	condFormula: {
		id: 'ebef1684672d49b6ad821b3ec3784f85',
		type: 'isRemote',
	},
	isPublic: true,
	isModerator: false,
	isAdministrator: false,
	asBadge: false,
	canEditMembersByModerator: false,
	displayOrder: 0,
	policies: {},
} as const;

describe('api:admin/roles display visibility validation', () => {
	describe('create', () => {
		const v = getValidator(createParamDef);

		test('Accept omitted isPublicDisplayRequired', () => expect(v({ ...baseCreateParams })).toBe(VALID));
		test('Accept false isPublicDisplayRequired', () => expect(v({ ...baseCreateParams, isPublicDisplayRequired: false })).toBe(VALID));
		test('Accept true isPublicDisplayRequired', () => expect(v({ ...baseCreateParams, isPublicDisplayRequired: true })).toBe(VALID));
		test('Reject non-boolean isPublicDisplayRequired', () => expect(v({ ...baseCreateParams, isPublicDisplayRequired: 'true' })).toBe(INVALID));
	});

	describe('update', () => {
		const v = getValidator(updateParamDef);
		const baseUpdateParams = { roleId: '9m4e2mr0ui' } as const;

		test('Accept omitted isPublicDisplayRequired', () => expect(v({ ...baseUpdateParams })).toBe(VALID));
		test('Accept false isPublicDisplayRequired', () => expect(v({ ...baseUpdateParams, isPublicDisplayRequired: false })).toBe(VALID));
		test('Accept true isPublicDisplayRequired', () => expect(v({ ...baseUpdateParams, isPublicDisplayRequired: true })).toBe(VALID));
		test('Reject non-boolean isPublicDisplayRequired', () => expect(v({ ...baseUpdateParams, isPublicDisplayRequired: 'true' })).toBe(INVALID));
	});
});
