/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { IncomingMessage } from 'http';
import { signup, api, startServer, successfulApiCall, failedApiCall, uploadFile, waitFire, connectStream, relativeFetch } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('API', () => {
	let app: INestApplicationContext;
	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;
	let carol: misskey.entities.MeSignup;

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

	test('管理者専用のAPIのアクセス制限', async () => {
		// aliceは管理者、APIを使える
		await successfulApiCall({
			endpoint: '/admin/get-index-stats',
			parameters: {},
			user: alice,
		});

		// bobは一般ユーザーだからダメ
		await failedApiCall({
			endpoint: '/admin/get-index-stats',
			parameters: {},
			user: bob,
		}, {
			status: 403,
			code: 'ROLE_PERMISSION_DENIED',
			id: 'c3d38592-54c0-429d-be96-5636b0431a61',
		});

		// publicアクセスももちろんダメ
		await failedApiCall({
			endpoint: '/admin/get-index-stats',
			parameters: {},
			user: undefined,
		}, {
			status: 401,
			code: 'CREDENTIAL_REQUIRED',
			id: '1384574d-a912-4b81-8601-c7b1c4085df1',
		});

		// ごまがしもダメ
		await failedApiCall({
			endpoint: '/admin/get-index-stats',
			parameters: {},
			user: { token: 'tsukawasete' },
		}, {
			status: 401,
			code: 'AUTHENTICATION_FAILED',
			id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
		});
	});

	describe('Authentication header', () => {
		test('一般リクエスト', async () => {
			await successfulApiCall({
				endpoint: '/admin/get-index-stats',
				parameters: {},
				user: {
					token: alice.token,
					bearer: true,
				},
			});
		});

		test('multipartリクエスト', async () => {
			const result = await uploadFile({
				token: alice.token,
				bearer: true,
			});
			assert.strictEqual(result.status, 200);
		});

		test('streaming', async () => {
			const fired = await waitFire(
				{
					token: alice.token,
					bearer: true,
				},
				'homeTimeline',
				() => api('notes/create', { text: 'foo' }, alice),
				msg => msg.type === 'note' && msg.body.text === 'foo',
			);
			assert.strictEqual(fired, true);
		});
	});

	describe('tokenエラー応答でWWW-Authenticate headerを送る', () => {
		describe('invalid_token', () => {
			test('一般リクエスト', async () => {
				const result = await api('/admin/get-index-stats', {}, {
					token: 'syuilo',
					bearer: true,
				});
				assert.strictEqual(result.status, 401);
				assert.ok(result.headers.get('WWW-Authenticate')?.startsWith('Bearer realm="Misskey", error="invalid_token", error_description'));
			});

			test('multipartリクエスト', async () => {
				const result = await uploadFile({
					token: 'syuilo',
					bearer: true,
				});
				assert.strictEqual(result.status, 401);
				assert.ok(result.headers.get('WWW-Authenticate')?.startsWith('Bearer realm="Misskey", error="invalid_token", error_description'));
			});

			test('streaming', async () => {
				await assert.rejects(connectStream(
					{
						token: 'syuilo',
						bearer: true,
					},
					'homeTimeline',
					() => { },
				), (err: IncomingMessage) => {
					assert.strictEqual(err.statusCode, 401);
					assert.ok(err.headers['www-authenticate']?.startsWith('Bearer realm="Misskey", error="invalid_token", error_description'));
					return true;
				});
			});
		});

		describe('tokenがないとrealmだけおくる', () => {
			test('一般リクエスト', async () => {
				const result = await api('/admin/get-index-stats', {});
				assert.strictEqual(result.status, 401);
				assert.strictEqual(result.headers.get('WWW-Authenticate'), 'Bearer realm="Misskey"');
			});

			test('multipartリクエスト', async () => {
				const result = await uploadFile();
				assert.strictEqual(result.status, 401);
				assert.strictEqual(result.headers.get('WWW-Authenticate'), 'Bearer realm="Misskey"');
			});
		});

		test('invalid_request', async () => {
			const result = await api('/notes/create', { text: true }, {
				token: alice.token,
				bearer: true,
			});
			assert.strictEqual(result.status, 400);
			assert.ok(result.headers.get('WWW-Authenticate')?.startsWith('Bearer realm="Misskey", error="invalid_request", error_description'));
		});

		describe('invalid bearer format', () => {
			test('No preceding bearer', async () => {
				const result = await relativeFetch('api/notes/create', {
					method: 'POST',
					headers: {
						Authorization: alice.token,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ text: 'test' }),
				});
				assert.strictEqual(result.status, 401);
			});

			test('Lowercase bearer', async () => {
				const result = await relativeFetch('api/notes/create', {
					method: 'POST',
					headers: {
						Authorization: `bearer ${alice.token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ text: 'test' }),
				});
				assert.strictEqual(result.status, 401);
			});

			test('No space after bearer', async () => {
				const result = await relativeFetch('api/notes/create', {
					method: 'POST',
					headers: {
						Authorization: `Bearer${alice.token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ text: 'test' }),
				});
				assert.strictEqual(result.status, 401);
			});
		});
	});
});
