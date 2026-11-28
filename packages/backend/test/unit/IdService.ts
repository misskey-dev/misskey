/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { loadConfig } from '@/config.js';
import { IdService } from '@/core/IdService.js';

describe('IdService', () => {
	test.each([
		{ id: 'aid', maxTime: 3_767_794_707_455, prefix: 'zzzzzzzz' },
		{ id: 'aidx', maxTime: 3_767_794_707_455, prefix: 'zzzzzzzz' },
		{ id: 'meid', maxTime: 140_737_488_355_327, prefix: 'ffffffffffff' },
		{ id: 'meidg', maxTime: 17_592_186_044_415, prefix: 'gfffffffffff' },
		{ id: 'ulid', maxTime: 281_474_976_710_655, prefix: '7ZZZZZZZZZ' },
		{ id: 'objectid', maxTime: 4_294_967_295_000, prefix: 'ffffffff' },
	])('$id の日時境界は表現可能な上限で桁あふれしない', ({ id, maxTime, prefix }) => {
		const service = new IdService({ ...loadConfig(), id });

		expect(service.getTimeBoundary(maxTime)).toBe(prefix);
		expect(service.getTimeBoundary(maxTime + 1)).toBeNull();
	});
});
