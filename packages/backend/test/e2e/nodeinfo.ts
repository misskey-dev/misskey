/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { relativeFetch } from '../utils.js';

describe('nodeinfo', () => {
	test('nodeinfo 2.1', async () => {
		const res = await relativeFetch('nodeinfo/2.1');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');

		const nodeInfo = await res.json() as any;
		assert.strictEqual(nodeInfo.software.name, 'misskey');
	});

	test('nodeinfo 2.0', async () => {
		const res = await relativeFetch('nodeinfo/2.0');
		assert.ok(res.ok);
		assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');

		const nodeInfo = await res.json() as any;
		assert.strictEqual(nodeInfo.software.name, 'misskey');
	});
});
