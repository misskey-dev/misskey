process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('API', () => {
	let app: INestApplicationContext;
	let alice: any;
	let bob: any;
	let carol: any;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	describe('General validation', () => {
		test('wrong type', async () => {
			const res = await api('/test', {
				required: true,
				string: 42,
			});
			assert.strictEqual(res.status, 400);
		});

		test('missing require param', async () => {
			const res = await api('/test', {
				string: 'a',
			});
			assert.strictEqual(res.status, 400);
		});

		test('invalid misskey:id (empty string)', async () => {
			const res = await api('/test', {
				required: true,
				id: '',
			});
			assert.strictEqual(res.status, 400);
		});

		test('valid misskey:id', async () => {
			const res = await api('/test', {
				required: true,
				id: '8wvhjghbxu',
			});
			assert.strictEqual(res.status, 200);
		});

		test('default value', async () => {
			const res = await api('/test', {
				required: true,
				string: 'a',
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.default, 'hello');
		});

		test('can set null even if it has default value', async () => {
			const res = await api('/test', {
				required: true,
				nullableDefault: null,
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.nullableDefault, null);
		});

		test('cannot set undefined if it has default value', async () => {
			const res = await api('/test', {
				required: true,
				nullableDefault: undefined,
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.nullableDefault, 'hello');
		});
	});
});
