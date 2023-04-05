process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { port, signup, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import { AuthorizationCode } from 'simple-oauth2';
import pkceChallenge from 'pkce-challenge';
import { JSDOM } from 'jsdom';

const clientPort = port + 1;
const redirect_uri = `http://127.0.0.1:${clientPort}/redirect`;

function getClient(): AuthorizationCode<'client_id'> {
	return new AuthorizationCode({
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
}

function getTransactionId(html: string): string | undefined {
	const fragment = JSDOM.fragment(html);
	return fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:transaction-id"]')?.content;
}

function fetchDecision(cookie: string, transactionId: string, user: any, { cancel }: { cancel?: boolean } = {}): Promise<Response> {
	return fetch(`http://127.0.0.1:${port}/oauth/decision`, {
		method: 'post',
		body: new URLSearchParams({
			transaction_id: transactionId!,
			login_token: user.token,
			cancel: cancel ? 'cancel' : '',
		}),
		redirect: 'manual',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			cookie,
		},
	});
}

async function fetchDecisionFromResponse(response: Response, user: any, { cancel }: { cancel?: boolean } = {}): Promise<Response> {
	const cookie = response.headers.get('set-cookie');
	const transactionId = getTransactionId(await response.text());

	return await fetchDecision(cookie!, transactionId!, user, { cancel });
}

describe('OAuth', () => {
	let app: INestApplicationContext;

	let alice: any;

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

		const client = getClient();

		const response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge,
			code_challenge_method: 'S256',
		}));
		assert.strictEqual(response.status, 200);
		const cookie = response.headers.get('set-cookie');
		assert.ok(cookie?.startsWith('connect.sid='));

		const transactionId = getTransactionId(await response.text());
		assert.strictEqual(typeof transactionId, 'string');

		const decisionResponse = await fetchDecision(cookie!, transactionId!, alice);
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

	test('Require PKCE', async () => {
		const client = getClient();

		let response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
		}));
		assert.ok(!response.ok);

		response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge: 'code',
		}));
		assert.ok(!response.ok);

		response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge_method: 'S256',
		}));
		assert.ok(!response.ok);

		response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge: 'code',
			code_challenge_method: 'SSSS',
		}));
		assert.ok(!response.ok);
	});

	test('Cancellation', async () => {
		const client = getClient();

		const response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge: 'code',
			code_challenge_method: 'S256',
		}));
		assert.strictEqual(response.status, 200);

		const decisionResponse = await fetchDecisionFromResponse(response, alice, { cancel: true });
		const location = new URL(decisionResponse.headers.get('location')!);
		assert.ok(!location.searchParams.has('code'));
		assert.ok(location.searchParams.has('error'));
	});

	// TODO: .well-known/oauth-authorization-server

	// TODO: scopes (totally missing / empty / exists but all invalid / exists but partially invalid / all valid)

	// TODO: PKCE verification failure

	// TODO: authorizing two users concurrently

	// TODO: invalid redirect_uri (at authorize / at token)
});
