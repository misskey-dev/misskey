/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { relativeFetch, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('nodeinfo', () => {
	let app: INestApplicationContext;

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

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
