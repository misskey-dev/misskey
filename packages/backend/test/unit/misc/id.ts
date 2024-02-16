/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ulid } from 'ulid';
import { describe, expect, test } from '@jest/globals';
import { aidRegExp, genAid, parseAid } from '@/misc/id/aid.js';
import { aidxRegExp, genAidx, parseAidx } from '@/misc/id/aidx.js';
import { genMeid, meidRegExp, parseMeid } from '@/misc/id/meid.js';
import { genMeidg, meidgRegExp, parseMeidg } from '@/misc/id/meidg.js';
import { genObjectId, objectIdRegExp, parseObjectId } from '@/misc/id/object-id.js';
import { parseUlid, ulidRegExp } from '@/misc/id/ulid.js';

describe('misc:id', () => {
	test('aid', () => {
		const date = Date.now();
		const gotAid = genAid(date);
		expect(gotAid).toMatch(aidRegExp);
		expect(parseAid(gotAid).date.getTime()).toBe(date);
	});

	test('aidx', () => {
		const date = Date.now();
		const gotAidx = genAidx(date);
		expect(gotAidx).toMatch(aidxRegExp);
		expect(parseAidx(gotAidx).date.getTime()).toBe(date);
	});

	test('meid', () => {
		const date = Date.now();
		const gotMeid = genMeid(date);
		expect(gotMeid).toMatch(meidRegExp);
		expect(parseMeid(gotMeid).date.getTime()).toBe(date);
	});

	test('meidg', () => {
		const date = Date.now();
		const gotMeidg = genMeidg(date);
		expect(gotMeidg).toMatch(meidgRegExp);
		expect(parseMeidg(gotMeidg).date.getTime()).toBe(date);
	});

	test('objectid', () => {
		const date = Date.now();
		const gotObjectId = genObjectId(date);
		expect(gotObjectId).toMatch(objectIdRegExp);
		expect(Math.floor(parseObjectId(gotObjectId).date.getTime() / 1000)).toBe(Math.floor(date / 1000));
	});

	test('ulid', () => {
		const date = Date.now();
		const gotUlid = ulid(date);
		expect(gotUlid).toMatch(ulidRegExp);
		expect(parseUlid(gotUlid).date.getTime()).toBe(date);
	});
});
