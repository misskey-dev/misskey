/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { getClipColumnReloadDelayMs } from './clip-column.js';

describe('getClipColumnReloadDelayMs', () => {
	test('returns no delay for clips owned by the current user', () => {
		const random = vi.fn(() => 0.75);

		expect(getClipColumnReloadDelayMs('user-1', 'user-1', random)).toBe(0);
		expect(random).not.toHaveBeenCalled();
	});

	test('returns jittered delay for clips not owned by the current user', () => {
		expect(getClipColumnReloadDelayMs('user-2', 'user-1', () => 0.75)).toBe(3750);
	});
});
