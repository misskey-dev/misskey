process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { AuthorizationCode } from 'simple-oauth2';
import pkceChallenge from 'pkce-challenge';
import { JSDOM } from 'jsdom';
import { port, relativeFetch, signup, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import Fastify, { type FastifyInstance } from 'fastify';

const host = `http://127.0.0.1:${port}`;

const clientPort = port + 1;
const redirect_uri = `http://127.0.0.1:${clientPort}/redirect`;

function getClient(): AuthorizationCode<'client_id'> {
	return new AuthorizationCode({
		client: {
			id: `http://127.0.0.1:${clientPort}/`,
		},
		auth: {
			tokenHost: host,
			tokenPath: '/oauth/token',
			authorizePath: '/oauth/authorize',
		},
		options: {
			authorizationMethod: 'body',
		},
	});
}

function getMeta(html: string): { transactionId: string | undefined, clientName: string | undefined } | undefined {
	const fragment = JSDOM.fragment(html);
	return {
		transactionId: fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:transaction-id"]')?.content,
		clientName: fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:client-name"]')?.content,
	};
}

function fetchDecision(cookie: string, transactionId: string, user: any, { cancel }: { cancel?: boolean } = {}): Promise<Response> {
	return fetch(new URL('/oauth/decision', host), {
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
	const { transactionId } = getMeta(await response.text());

	return await fetchDecision(cookie!, transactionId!, user, { cancel });
}

describe('OAuth', () => {
	let app: INestApplicationContext;
	let fastify: FastifyInstance;

	let alice: any;

	beforeAll(async () => {
		app = await startServer();
		fastify = Fastify();
		fastify.get('/', async (request, reply) => {
			reply.send(`
				<!DOCTYPE html>
				<link rel="redirect_uri" href="/redirect" />
				<div class="h-app"><div class="p-name">Misklient
			`);
		});
		await fastify.listen({ port: clientPort });

		alice = await signup({ username: 'alice' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
		await fastify.close();
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

		const meta = getMeta(await response.text());
		assert.strictEqual(typeof meta.transactionId, 'string');
		assert.strictEqual(meta?.clientName, 'Misklient');

		const decisionResponse = await fetchDecision(cookie!, meta.transactionId!, alice);
		assert.strictEqual(decisionResponse.status, 302);
		assert.ok(decisionResponse.headers.has('location'));

		const location = new URL(decisionResponse.headers.get('location')!);
		assert.strictEqual(location.origin + location.pathname, redirect_uri);
		assert.ok(location.searchParams.has('code'));
		assert.strictEqual(location.searchParams.get('state'), 'state');
		assert.strictEqual(location.searchParams.get('iss'), 'http://misskey.local'); // RFC 9207

		const token = await client.getToken({
			code: location.searchParams.get('code')!,
			redirect_uri,
			code_verifier,
		});
		assert.strictEqual(typeof token.token.access_token, 'string');
		assert.strictEqual(token.token.token_type, 'Bearer');
		assert.strictEqual(token.token.scope, 'write:notes');

		const createResponse = await relativeFetch('api/notes/create', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token.token.access_token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: 'test' }),
		});
		assert.strictEqual(createResponse.status, 200);

		const createResponseBody: any = await createResponse.json();
		assert.strictEqual(createResponseBody.createdNote.text, 'test');
	});

	describe('PKCE', () => {
		test('Require PKCE', async () => {
			const client = getClient();

			// Pattern 1: No PKCE fields at all
			let response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
			}));
			assert.ok(!response.ok);

			// Pattern 2: Only code_challenge
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
			}));
			assert.ok(!response.ok);

			// Pattern 2: Only code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge_method: 'S256',
			}));
			assert.ok(!response.ok);

			// Pattern 3: Unsupported code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'SSSS',
			}));
			assert.ok(!response.ok);
		});

		test('Verify PKCE', async () => {
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

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const code = new URL(decisionResponse.headers.get('location')!).searchParams.get('code')!;
			assert.ok(!!code);

			// Pattern 1: code followed by some junk code
			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier: code_verifier + 'x',
			}));

			// Pattern 2: clipped code
			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier: code_verifier.slice(0, 80),
			}));

			// Pattern 3: Some part of code is replaced
			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier: code_verifier.slice(0, -10) + 'x'.repeat(10),
			}));

			// And now the code is invalidated by the previous failures
			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier,
			}));
		});
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
		assert.strictEqual(decisionResponse.status, 302);

		const location = new URL(decisionResponse.headers.get('location')!);
		assert.ok(!location.searchParams.has('code'));
		assert.ok(location.searchParams.has('error'));
	});

	describe('Scope', () => {
		test('Missing scope', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));

			// TODO: But 500 is not a valid code, should be 403 or such. Check the OAuth spec
			assert.strictEqual(response.status, 500);
		});

		test('Empty scope', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: '',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));

			// TODO: But 500 is not a valid code, should be 403 or such. Check the OAuth spec
			assert.strictEqual(response.status, 500);
		});

		test('Unknown scopes', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'test:unknown test:unknown2',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));

			// TODO: But 500 is not a valid code, should be 403 or such. Check the OAuth spec
			assert.strictEqual(response.status, 500);
		});

		test('Partially known scopes', async () => {
			const { code_challenge, code_verifier } = pkceChallenge.default(128);

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes test:unknown test:unknown2',
				state: 'state',
				code_challenge,
				code_challenge_method: 'S256',
			}));

			// Just get the known scope for this case for backward compatibility
			assert.strictEqual(response.status, 200);

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			const code = new URL(decisionResponse.headers.get('location')!).searchParams.get('code')!;
			assert.ok(!!code);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			});

			// OAuth2 requires returning `scope` in the token response if the resulting scope is different than the requested one
			// (Although Misskey always return scope, which is also fine)
			assert.strictEqual(token.token.scope, 'write:notes');
		});

		test('Known scopes', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes read:account',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));

			assert.strictEqual(response.status, 200);
		});

		test('Duplicated scopes', async () => {
			const { code_challenge, code_verifier } = pkceChallenge.default(128);

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes write:notes read:account read:account',
				state: 'state',
				code_challenge,
				code_challenge_method: 'S256',
			}));

			assert.strictEqual(response.status, 200);

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			const code = new URL(decisionResponse.headers.get('location')!).searchParams.get('code')!;
			assert.ok(!!code);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			});
			assert.strictEqual(token.token.scope, 'write:notes read:account');
		});

		test('Scope check by API', async () => {
			const { code_challenge, code_verifier } = pkceChallenge.default(128);

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'read:account',
				state: 'state',
				code_challenge,
				code_challenge_method: 'S256',
			}));
			assert.strictEqual(response.status, 200);

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			const token = await client.getToken({
				code: location.searchParams.get('code')!,
				redirect_uri,
				code_verifier,
			});
			assert.strictEqual(typeof token.token.access_token, 'string');

			const createResponse = await relativeFetch('api/notes/create', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token.token.access_token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ text: 'test' }),
			});
			// XXX: PERMISSION_DENIED is not using kind: 'permission' and gives 400 instead of 403
			assert.strictEqual(createResponse.status, 400);
		});
	});

	test('Authorization header', async () => {
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

		const decisionResponse = await fetchDecisionFromResponse(response, alice);
		assert.strictEqual(decisionResponse.status, 302);

		const location = new URL(decisionResponse.headers.get('location')!);
		assert.ok(location.searchParams.has('code'));

		const token = await client.getToken({
			code: location.searchParams.get('code')!,
			redirect_uri,
			code_verifier,
		});

		// Pattern 1: No preceding "Bearer "
		let createResponse = await relativeFetch('api/notes/create', {
			method: 'POST',
			headers: {
				Authorization: token.token.access_token as string,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: 'test' }),
		});
		assert.strictEqual(createResponse.status, 401);

		// Pattern 2: Incorrect token
		createResponse = await relativeFetch('api/notes/create', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${(token.token.access_token as string).slice(0, -1)}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: 'test' }),
		});
		// RFC 6750 section 3.1 says 401 but it's SHOULD not MUST. 403 should be okay for now.
		assert.strictEqual(createResponse.status, 403);

		// TODO: error code (invalid_token)
	});

	describe('Redirection', () => {
		test('Invalid redirect_uri at authorization endpoint', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri: 'http://127.0.0.2/',
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			// TODO: status code
			assert.strictEqual(response.status, 500);
		});

		test('Invalid redirect_uri including the valid one at authorization endpoint', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri: 'http://127.0.0.1/redirection',
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			// TODO: status code
			assert.strictEqual(response.status, 500);
		});

		test('No redirect_uri at authorization endpoint', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			// TODO: status code
			assert.strictEqual(response.status, 500);
		});

		test('Invalid redirect_uri at token endpoint', async () => {
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

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			await assert.rejects(client.getToken({
				code: location.searchParams.get('code')!,
				redirect_uri: 'http://127.0.0.2/',
				code_verifier,
			}));
		});

		test('Invalid redirect_uri including the valid one at token endpoint', async () => {
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

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			await assert.rejects(client.getToken({
				code: location.searchParams.get('code')!,
				redirect_uri: 'http://127.0.0.1/redirection',
				code_verifier,
			}));
		});

		test('No redirect_uri at token endpoint', async () => {
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

			const decisionResponse = await fetchDecisionFromResponse(response, alice);
			assert.strictEqual(decisionResponse.status, 302);

			const location = new URL(decisionResponse.headers.get('location')!);
			assert.ok(location.searchParams.has('code'));

			await assert.rejects(client.getToken({
				code: location.searchParams.get('code')!,
				code_verifier,
			}));
		});
	});

	test('Server metadata', async () => {
		const response = await fetch(new URL('.well-known/oauth-authorization-server', host));
		assert.strictEqual(response.status, 200);

		const body = await response.json();
		assert.strictEqual(body.issuer, 'http://misskey.local');
		assert.ok(body.scopes_supported.includes('write:notes'));
	});

	describe('Client Information Discovery', () => {
		test('Read HTTP header', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.header('Link', '</redirect>; rel="redirect_uri"');
				reply.send(`
					<!DOCTYPE html>
					<div class="h-app"><div class="p-name">Misklient
				`);
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			assert.strictEqual(response.status, 200);
		});

		test('Mixed links', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.header('Link', '</redirect>; rel="redirect_uri"');
				reply.send(`
					<!DOCTYPE html>
					<link rel="redirect_uri" href="/redirect2" />
					<div class="h-app"><div class="p-name">Misklient
				`);
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			assert.strictEqual(response.status, 200);
		});

		test('Multiple items in Link header', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.header('Link', '</redirect2>; rel="redirect_uri",</redirect>; rel="redirect_uri"');
				reply.send(`
					<!DOCTYPE html>
					<div class="h-app"><div class="p-name">Misklient
				`);
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			console.log(await response.text());
			assert.strictEqual(response.status, 200);
		});

		test('Multiple items in HTML', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.send(`
					<!DOCTYPE html>
					<link rel="redirect_uri" href="/redirect2" />
					<link rel="redirect_uri" href="/redirect" />
					<div class="h-app"><div class="p-name">Misklient
				`);
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			assert.strictEqual(response.status, 200);
		});

		test('No item', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.send(`
					<!DOCTYPE html>
					<div class="h-app"><div class="p-name">Misklient
				`);
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			}));
			// TODO: status code
			assert.strictEqual(response.status, 500);
		});
	});

	// TODO: authorizing two users concurrently

	// TODO: Error format required by OAuth spec

	// TODO: Client Information Discovery (use http header, loopback check, missing name or redirection uri)
});
