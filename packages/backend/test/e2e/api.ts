/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { IncomingMessage } from 'http';
import {
	api,
	connectStream,
	createAppToken,
	failedApiCall,
	relativeFetch,
	signup,
	successfulApiCall,
	uploadFile,
	waitFire,
} from '../utils.js';
import type * as misskey from 'misskey-js';

describe('API', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	describe('General validation', () => {
		test('wrong type', async () => {
			const res = await api('test', {
				required: true,
				// @ts-expect-error string must be string
				string: 42,
			});
			assert.strictEqual(res.status, 400);
		});

		test('missing require param', async () => {
			// @ts-expect-error required is required
			const res = await api('test', {
				string: 'a',
			});
			assert.strictEqual(res.status, 400);
		});

		test('invalid misskey:id (empty string)', async () => {
			const res = await api('test', {
				required: true,
				id: '',
			});
			assert.strictEqual(res.status, 400);
		});

		test('valid misskey:id', async () => {
			const res = await api('test', {
				required: true,
				id: '8wvhjghbxu',
			});
			assert.strictEqual(res.status, 200);
		});

		test('default value', async () => {
			const res = await api('test', {
				required: true,
				string: 'a',
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.default, 'hello');
		});

		test('can set null even if it has default value', async () => {
			const res = await api('test', {
				required: true,
				nullableDefault: null,
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.nullableDefault, null);
		});

		test('cannot set undefined if it has default value', async () => {
			const res = await api('test', {
				required: true,
				nullableDefault: undefined,
			});
			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.nullableDefault, 'hello');
		});
	});

	test('管理者専用のAPIのアクセス制限', async () => {
		const application = await createAppToken(alice, ['read:account']);
		const application2 = await createAppToken(alice, ['read:admin:index-stats']);
		const application3 = await createAppToken(bob, []);
		const application4 = await createAppToken(bob, ['read:admin:index-stats']);

		// aliceは管理者、APIを使える
		await successfulApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: alice,
		});

		// bobは一般ユーザーだからダメ
		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: bob,
		}, {
			status: 403,
			code: 'ROLE_PERMISSION_DENIED',
			id: 'c3d38592-54c0-429d-be96-5636b0431a61',
		});

		// publicアクセスももちろんダメ
		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: undefined,
		}, {
			status: 401,
			code: 'CREDENTIAL_REQUIRED',
			id: '1384574d-a912-4b81-8601-c7b1c4085df1',
		});

		// ごまがしもダメ
		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: { token: 'tsukawasete' },
		}, {
			status: 401,
			code: 'AUTHENTICATION_FAILED',
			id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
		});

		await successfulApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: { token: application2 },
		});

		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: { token: application },
		}, {
			status: 403,
			code: 'PERMISSION_DENIED',
			id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838',
		});

		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: { token: application3 },
		}, {
			status: 403,
			code: 'ROLE_PERMISSION_DENIED',
			id: 'c3d38592-54c0-429d-be96-5636b0431a61',
		});

		await failedApiCall({
			endpoint: 'admin/get-index-stats',
			parameters: {},
			user: { token: application4 },
		}, {
			status: 403,
			code: 'ROLE_PERMISSION_DENIED',
			id: 'c3d38592-54c0-429d-be96-5636b0431a61',
		});
	});

	describe('Authentication header', () => {
		test('一般リクエスト', async () => {
			await successfulApiCall({
				endpoint: 'admin/get-index-stats',
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
				const result = await api('admin/get-index-stats', {}, {
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
				const result = await api('admin/get-index-stats', {});
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
			// @ts-expect-error text must be string
			const result = await api('notes/create', { text: true }, {
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
