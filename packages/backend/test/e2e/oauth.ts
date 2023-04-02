process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { port, signup, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import { AuthorizationCode } from 'simple-oauth2';
import pkceChallenge from 'pkce-challenge';
import { JSDOM } from 'jsdom';

describe('OAuth', () => {
	let app: INestApplicationContext;

	let alice: any;
	const clientPort = port + 1;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		// fastify = Fastify();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('Full flow', async () => {
		const { code_challenge, code_verifier } = pkceChallenge.default(128);

		const client = new AuthorizationCode({
			client: {
				id: `http://127.0.0.1:${clientPort}/`,
			},
			auth: {
				tokenHost: `http://127.0.0.1:${port}`,
				tokenPath: '/oauth/token',
				authorizePath: '/oauth/authorize',
			},
			options: {
				authorizationMethod: 'body',
			},
		});

		const redirect_uri = `http://127.0.0.1:${clientPort}/redirect`;

		const authEndpoint = client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge,
			code_challenge_method: 'S256',
		});
		const response = await fetch(authEndpoint);
		assert.strictEqual(response.status, 200);
		const cookie = response.headers.get('set-cookie');
		assert.ok(cookie?.startsWith('connect.sid='));

		const fragment = JSDOM.fragment(await response.text());
		const transactionId = fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:transaction-id"]')?.content;
		assert.strictEqual(typeof transactionId, 'string');

		const formData = new FormData();
		formData.append('transaction_id', transactionId!);
		formData.append('login_token', alice.token);
		const decisionResponse = await fetch(`http://127.0.0.1:${port}/oauth/decision`, {
			method: 'post',
			body: new URLSearchParams({
				transaction_id: transactionId!,
				login_token: alice.token,
			}),
			redirect: 'manual',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				cookie: cookie!,
			},
		});
		assert.strictEqual(decisionResponse.status, 302);
		assert.ok(decisionResponse.headers.has('location'));

		const location = new URL(decisionResponse.headers.get('location')!);
		assert.strictEqual(location.origin + location.pathname, redirect_uri);

		assert.ok(location.searchParams.has('code'));
		assert.strictEqual(location.searchParams.get('state'), 'state');

		const token = await client.getToken({
			code: location.searchParams.get('code')!,
			redirect_uri,
			code_verifier,
		});
		assert.strictEqual(typeof token.token.access_token, 'string');
		assert.strictEqual(typeof token.token.refresh_token, 'string');
		assert.strictEqual(token.token.token_type, 'Bearer');
	});
});
