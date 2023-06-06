/**
 * Basic OAuth tests to make sure the library is correctly integrated to Misskey
 * and not regressed by version updates or potential migration to another library.
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { AuthorizationCode, type AuthorizationTokenConfig } from 'simple-oauth2';
import pkceChallenge from 'pkce-challenge';
import { JSDOM } from 'jsdom';
import * as misskey from 'misskey-js';
import Fastify, { type FastifyReply, type FastifyInstance } from 'fastify';
import { port, relativeFetch, signup, startServer } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

const host = `http://127.0.0.1:${port}`;

const clientPort = port + 1;
const redirect_uri = `http://127.0.0.1:${clientPort}/redirect`;

const basicAuthParams: AuthorizationParamsExtended = {
	redirect_uri,
	scope: 'write:notes',
	state: 'state',
	code_challenge: 'code',
	code_challenge_method: 'S256',
};

interface OAuthErrorResponse {
	error: string;
	error_description: string;
}

interface AuthorizationParamsExtended {
	redirect_uri: string;
	scope: string | string[];
	state: string;
	code_challenge?: string;
	code_challenge_method?: string;
}

interface AuthorizationTokenConfigExtended extends AuthorizationTokenConfig {
	code_verifier: string | undefined;
}

function getClient(): AuthorizationCode<'client_id'> {
	return new AuthorizationCode({
		client: {
			id: `http://127.0.0.1:${clientPort}/`,
			secret: '',
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

function getMeta(html: string): { transactionId: string | undefined, clientName: string | undefined } {
	const fragment = JSDOM.fragment(html);
	return {
		transactionId: fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:transaction-id"]')?.content,
		clientName: fragment.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:client-name"]')?.content,
	};
}

function fetchDecision(transactionId: string, user: misskey.entities.MeSignup, { cancel }: { cancel?: boolean } = {}): Promise<Response> {
	return fetch(new URL('/oauth/decision', host), {
		method: 'post',
		body: new URLSearchParams({
			transaction_id: transactionId,
			login_token: user.token,
			cancel: cancel ? 'cancel' : '',
		}),
		redirect: 'manual',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
	});
}

async function fetchDecisionFromResponse(response: Response, user: misskey.entities.MeSignup, { cancel }: { cancel?: boolean } = {}): Promise<Response> {
	const { transactionId } = getMeta(await response.text());
	assert.ok(transactionId);

	return await fetchDecision(transactionId, user, { cancel });
}

async function fetchAuthorizationCode(user: misskey.entities.MeSignup, scope: string, code_challenge: string): Promise<{ client: AuthorizationCode, code: string }> {
	const client = getClient();

	const response = await fetch(client.authorizeURL({
		redirect_uri,
		scope,
		state: 'state',
		code_challenge,
		code_challenge_method: 'S256',
	} as AuthorizationParamsExtended));
	assert.strictEqual(response.status, 200);

	const decisionResponse = await fetchDecisionFromResponse(response, user);
	assert.strictEqual(decisionResponse.status, 302);

	const locationHeader = decisionResponse.headers.get('location');
	assert.ok(locationHeader);

	const location = new URL(locationHeader);
	assert.ok(location.searchParams.has('code'));

	const code = new URL(location).searchParams.get('code');
	assert.ok(code);

	return { client, code };
}

describe('OAuth', () => {
	let app: INestApplicationContext;
	let fastify: FastifyInstance;

	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	beforeEach(async () => {
		process.env.MISSKEY_TEST_DISALLOW_LOOPBACK = '';
		fastify = Fastify();
		fastify.get('/', async (request, reply) => {
			reply.send(`
				<!DOCTYPE html>
				<link rel="redirect_uri" href="/redirect" />
				<div class="h-app"><div class="p-name">Misklient
			`);
		});
		await fastify.listen({ port: clientPort });
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await fastify.close();
	});

	test('Full flow', async () => {
		const { code_challenge, code_verifier } = await pkceChallenge(128);

		const client = getClient();

		const response = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge,
			code_challenge_method: 'S256',
		} as AuthorizationParamsExtended));
		assert.strictEqual(response.status, 200);

		const meta = getMeta(await response.text());
		assert.strictEqual(typeof meta.transactionId, 'string');
		assert.ok(meta.transactionId);
		assert.strictEqual(meta.clientName, 'Misklient');

		const decisionResponse = await fetchDecision(meta.transactionId, alice);
		assert.strictEqual(decisionResponse.status, 302);
		assert.ok(decisionResponse.headers.has('location'));

		const locationHeader = decisionResponse.headers.get('location');
		assert.ok(locationHeader);

		const location = new URL(locationHeader);
		assert.strictEqual(location.origin + location.pathname, redirect_uri);
		assert.ok(location.searchParams.has('code'));
		assert.strictEqual(location.searchParams.get('state'), 'state');
		assert.strictEqual(location.searchParams.get('iss'), 'http://misskey.local'); // RFC 9207

		const code = new URL(location).searchParams.get('code');
		assert.ok(code);

		const token = await client.getToken({
			code,
			redirect_uri,
			code_verifier,
		} as AuthorizationTokenConfigExtended);
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

	test('Two concurrent flows', async () => {
		const client = getClient();

		const pkceAlice = await pkceChallenge(128);
		const pkceBob = await pkceChallenge(128);

		const responseAlice = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge: pkceAlice.code_challenge,
			code_challenge_method: 'S256',
		} as AuthorizationParamsExtended));
		assert.strictEqual(responseAlice.status, 200);

		const responseBob = await fetch(client.authorizeURL({
			redirect_uri,
			scope: 'write:notes',
			state: 'state',
			code_challenge: pkceBob.code_challenge,
			code_challenge_method: 'S256',
		} as AuthorizationParamsExtended));
		assert.strictEqual(responseBob.status, 200);

		const decisionResponseAlice = await fetchDecisionFromResponse(responseAlice, alice);
		assert.strictEqual(decisionResponseAlice.status, 302);

		const decisionResponseBob = await fetchDecisionFromResponse(responseBob, bob);
		assert.strictEqual(decisionResponseBob.status, 302);

		const locationAlice = new URL(decisionResponseAlice.headers.get('location')!);
		assert.ok(locationAlice.searchParams.has('code'));

		const locationBob = new URL(decisionResponseBob.headers.get('location')!);
		assert.ok(locationBob.searchParams.has('code'));

		const tokenAlice = await client.getToken({
			code: locationAlice.searchParams.get('code')!,
			redirect_uri,
			code_verifier: pkceAlice.code_verifier,
		} as AuthorizationTokenConfigExtended);

		const tokenBob = await client.getToken({
			code: locationBob.searchParams.get('code')!,
			redirect_uri,
			code_verifier: pkceBob.code_verifier,
		} as AuthorizationTokenConfigExtended);

		const createResponseAlice = await relativeFetch('api/notes/create', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokenAlice.token.access_token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: 'test' }),
		});
		assert.strictEqual(createResponseAlice.status, 200);

		const createResponseBob = await relativeFetch('api/notes/create', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${tokenBob.token.access_token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: 'test' }),
		});
		assert.strictEqual(createResponseAlice.status, 200);

		const createResponseBodyAlice = await createResponseAlice.json() as { createdNote: misskey.entities.Note };
		assert.strictEqual(createResponseBodyAlice.createdNote.user.username, 'alice');

		const createResponseBodyBob = await createResponseBob.json() as { createdNote: misskey.entities.Note };
		assert.strictEqual(createResponseBodyBob.createdNote.user.username, 'bob');
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
			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');

			// Pattern 2: Only code_challenge
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
			} as AuthorizationParamsExtended));
			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');

			// Pattern 2: Only code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');

			// Pattern 3: Unsupported code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'SSSS',
			} as AuthorizationParamsExtended));
			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		// Use precomputed challenge/verifier set here for deterministic test
		const code_challenge = '4w2GDuvaxXlw2l46k5PFIoIcTGHdzw2i3hrn-C_Q6f7u0-nTYKd-beVEYy9XinYsGtAix.Nnvr.GByD3lAii2ibPRsSDrZgIN0YQb.kfevcfR9aDKoTLyOUm4hW4ABhs';
		const code_verifier = 'Ew8VSBiH59JirLlg7ocFpLQ6NXuFC1W_rn8gmRzBKc8';

		const tests: Record<string, string | undefined> = {
			'Code followed by some junk code': code_verifier + 'x',
			'Clipped code': code_verifier.slice(0, 80),
			'Some part of code is replaced': code_verifier.slice(0, -10) + 'x'.repeat(10),
			'No verifier': undefined,
		};

		describe('Verify PKCE', () => {
			for (const [title, wrong_verifier] of Object.entries(tests)) {
				test(title, async () => {
					const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

					await assert.rejects(client.getToken({
						code,
						redirect_uri,
						code_verifier: wrong_verifier,
					} as AuthorizationTokenConfigExtended));
				});
			}
		});
	});

	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-4.1.2
	// "If an authorization code is used more than once, the authorization server
	// MUST deny the request and SHOULD revoke (when possible) all tokens
	// previously issued based on that authorization code."
	describe('Revoking authorization code', () => {
		test('On success', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);
			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended);

			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended));
		});

		test('On failure', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);
			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({ code, redirect_uri }));

			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended));
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
		} as AuthorizationParamsExtended));
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
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_scope');
		});

		test('Empty scope', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: '',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_scope');
		});

		test('Unknown scopes', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'test:unknown test:unknown2',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_scope');
		});

		test('Partially known scopes', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			// Just get the known scope for this case for backward compatibility
			const { client, code } = await fetchAuthorizationCode(
				alice,
				'write:notes test:unknown test:unknown2',
				code_challenge,
			);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended);

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
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 200);
		});

		test('Duplicated scopes', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(
				alice,
				'write:notes write:notes read:account read:account',
				code_challenge,
			);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended);
			assert.strictEqual(token.token.scope, 'write:notes read:account');
		});

		test('Scope check by API', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'read:account', code_challenge);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended);
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
		const { code_challenge, code_verifier } = await pkceChallenge(128);

		const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

		const token = await client.getToken({
			code,
			redirect_uri,
			code_verifier,
		} as AuthorizationTokenConfigExtended);

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

		// TODO: error code (wrong Authorization header should emit OAuth error instead of Misskey API error)
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
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('Invalid redirect_uri including the valid one at authorization endpoint', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri: 'http://127.0.0.1/redirection',
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('No redirect_uri at authorization endpoint', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL({
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('Invalid redirect_uri at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				redirect_uri: 'http://127.0.0.2/',
				code_verifier,
			} as AuthorizationTokenConfigExtended));
		});

		test('Invalid redirect_uri including the valid one at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				redirect_uri: 'http://127.0.0.1/redirection',
				code_verifier,
			} as AuthorizationTokenConfigExtended));
		});

		test('No redirect_uri at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				code_verifier,
			} as AuthorizationTokenConfigExtended));
		});
	});

	test('Server metadata', async () => {
		const response = await fetch(new URL('.well-known/oauth-authorization-server', host));
		assert.strictEqual(response.status, 200);

		const body = await response.json();
		assert.strictEqual(body.issuer, 'http://misskey.local');
		assert.ok(body.scopes_supported.includes('write:notes'));
	});

	describe('Decision endpoint', () => {
		test('No login token', async () => {
			const client = getClient();

			const response = await fetch(client.authorizeURL(basicAuthParams));
			assert.strictEqual(response.status, 200);

			const { transactionId } = getMeta(await response.text());
			assert.ok(transactionId);

			const decisionResponse = await fetch(new URL('/oauth/decision', host), {
				method: 'post',
				body: new URLSearchParams({
					transaction_id: transactionId,
				}),
				redirect: 'manual',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
				},
			});

			assert.strictEqual(decisionResponse.status, 400);
			assert.strictEqual((await decisionResponse.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('No transaction ID', async () => {
			const decisionResponse = await fetch(new URL('/oauth/decision', host), {
				method: 'post',
				body: new URLSearchParams({
					login_token: alice.token,
				}),
				redirect: 'manual',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
				},
			});

			assert.strictEqual(decisionResponse.status, 400);
			assert.strictEqual((await decisionResponse.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('Invalid transaction ID', async () => {
			const decisionResponse = await fetch(new URL('/oauth/decision', host), {
				method: 'post',
				body: new URLSearchParams({
					login_token: alice.token,
					transaction_id: 'invalid_id',
				}),
				redirect: 'manual',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
				},
			});

			assert.strictEqual(decisionResponse.status, 403);
			assert.strictEqual((await decisionResponse.json() as OAuthErrorResponse).error, 'access_denied');
		});
	});

	describe('Client Information Discovery', () => {
		describe('Redirection', () => {
			const tests: Record<string, (reply: FastifyReply) => void> = {
				'Read HTTP header': reply => {
					reply.header('Link', '</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<div class="h-app"><div class="p-name">Misklient
					`);
				},
				'Mixed links': reply => {
					reply.header('Link', '</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<link rel="redirect_uri" href="/redirect2" />
						<div class="h-app"><div class="p-name">Misklient
					`);
				},
				'Multiple items in Link header': reply => {
					reply.header('Link', '</redirect2>; rel="redirect_uri",</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<div class="h-app"><div class="p-name">Misklient
					`);
				},
				'Multiple items in HTML': reply => {
					reply.send(`
						<!DOCTYPE html>
						<link rel="redirect_uri" href="/redirect2" />
						<link rel="redirect_uri" href="/redirect" />
						<div class="h-app"><div class="p-name">Misklient
					`);
				},
			};

			for (const [title, replyFunc] of Object.entries(tests)) {
				test(title, async () => {
					await fastify.close();

					fastify = Fastify();
					fastify.get('/', async (request, reply) => replyFunc(reply));
					await fastify.listen({ port: clientPort });

					const client = getClient();

					const response = await fetch(client.authorizeURL({
						redirect_uri,
						scope: 'write:notes',
						state: 'state',
						code_challenge: 'code',
						code_challenge_method: 'S256',
					} as AuthorizationParamsExtended));
					assert.strictEqual(response.status, 200);
				});
			}

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
				} as AuthorizationParamsExtended));

				assert.strictEqual(response.status, 400);
				assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
			});
		});

		test('Disallow loopback', async () => {
			process.env.MISSKEY_TEST_DISALLOW_LOOPBACK = '1';

			const client = getClient();
			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));

			assert.strictEqual(response.status, 400);
			assert.strictEqual((await response.json() as OAuthErrorResponse).error, 'invalid_request');
		});

		test('Missing name', async () => {
			await fastify.close();

			fastify = Fastify();
			fastify.get('/', async (request, reply) => {
				reply.header('Link', '</redirect>; rel="redirect_uri"');
				reply.send();
			});
			await fastify.listen({ port: clientPort });

			const client = getClient();

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			assert.strictEqual(response.status, 200);
			assert.strictEqual(getMeta(await response.text()).clientName, `http://127.0.0.1:${clientPort}/`);
		});
	});

	test('Unknown OAuth endpoint', async () => {
		const response = await fetch(new URL('/oauth/foo', host));
		assert.strictEqual(response.status, 404);
	});

	// TODO: Add spec links to tests
});
