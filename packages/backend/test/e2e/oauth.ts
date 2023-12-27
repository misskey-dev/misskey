/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Basic OAuth tests to make sure the library is correctly integrated to Misskey
 * and not regressed by version updates or potential migration to another library.
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { AuthorizationCode, ResourceOwnerPassword, type AuthorizationTokenConfig, ClientCredentials, ModuleOptions } from 'simple-oauth2';
import pkceChallenge from 'pkce-challenge';
import { JSDOM } from 'jsdom';
import Fastify, { type FastifyReply, type FastifyInstance } from 'fastify';
import { api, port, signup, startServer } from '../utils.js';
import type * as misskey from 'misskey-js';
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

interface GetTokenError {
	data: {
		payload: {
			error: string;
		}
	}
}

const clientConfig: ModuleOptions<'client_id'> = {
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
};

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
	const client = new AuthorizationCode(clientConfig);

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

function assertIndirectError(response: Response, error: string): void {
	assert.strictEqual(response.status, 302);

	const locationHeader = response.headers.get('location');
	assert.ok(locationHeader);

	const location = new URL(locationHeader);
	assert.strictEqual(location.searchParams.get('error'), error);

	// https://datatracker.ietf.org/doc/html/rfc9207#name-response-parameter-iss
	assert.strictEqual(location.searchParams.get('iss'), 'http://misskey.local');
	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-4.1.2.1
	assert.ok(location.searchParams.has('state'));
}

async function assertDirectError(response: Response, status: number, error: string): Promise<void> {
	assert.strictEqual(response.status, status);

	const data = await response.json();
	assert.strictEqual(data.error, error);
}

describe('OAuth', () => {
	let app: INestApplicationContext;
	let fastify: FastifyInstance;

	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;

	let sender: (reply: FastifyReply) => void;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });

		fastify = Fastify();
		fastify.get('/', async (request, reply) => {
			sender(reply);
		});
		await fastify.listen({ port: clientPort });
	}, 1000 * 60 * 2);

	beforeEach(async () => {
		process.env.MISSKEY_TEST_CHECK_IP_RANGE = '';
		sender = (reply): void => {
			reply.send(`
				<!DOCTYPE html>
				<link rel="redirect_uri" href="/redirect" />
				<div class="h-app"><a href="/" class="u-url p-name">Misklient
			`);
		};
	});

	afterAll(async () => {
		await fastify.close();
		await app.close();
	});

	test('Full flow', async () => {
		const { code_challenge, code_verifier } = await pkceChallenge(128);

		const client = new AuthorizationCode(clientConfig);

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
		// https://datatracker.ietf.org/doc/html/rfc9207#name-response-parameter-iss
		assert.strictEqual(location.searchParams.get('iss'), 'http://misskey.local');

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

		const createResult = await api('notes/create', { text: 'test' }, {
			token: token.token.access_token as string,
			bearer: true,
		});
		assert.strictEqual(createResult.status, 200);

		const createResultBody = createResult.body as misskey.Endpoints['notes/create']['res'];
		assert.strictEqual(createResultBody.createdNote.text, 'test');
	});

	test('Two concurrent flows', async () => {
		const client = new AuthorizationCode(clientConfig);

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

		const locationHeaderAlice = decisionResponseAlice.headers.get('location');
		assert.ok(locationHeaderAlice);
		const locationAlice = new URL(locationHeaderAlice);

		const locationHeaderBob = decisionResponseBob.headers.get('location');
		assert.ok(locationHeaderBob);
		const locationBob = new URL(locationHeaderBob);

		const codeAlice = locationAlice.searchParams.get('code');
		assert.ok(codeAlice);
		const codeBob = locationBob.searchParams.get('code');
		assert.ok(codeBob);

		const tokenAlice = await client.getToken({
			code: codeAlice,
			redirect_uri,
			code_verifier: pkceAlice.code_verifier,
		} as AuthorizationTokenConfigExtended);

		const tokenBob = await client.getToken({
			code: codeBob,
			redirect_uri,
			code_verifier: pkceBob.code_verifier,
		} as AuthorizationTokenConfigExtended);

		const createResultAlice = await api('notes/create', { text: 'test' }, {
			token: tokenAlice.token.access_token as string,
			bearer: true,
		});
		assert.strictEqual(createResultAlice.status, 200);

		const createResultBob = await api('notes/create', { text: 'test' }, {
			token: tokenBob.token.access_token as string,
			bearer: true,
		});
		assert.strictEqual(createResultAlice.status, 200);

		const createResultBodyAlice = await createResultAlice.body as misskey.Endpoints['notes/create']['res'];
		assert.strictEqual(createResultBodyAlice.createdNote.user.username, 'alice');

		const createResultBodyBob = await createResultBob.body as misskey.Endpoints['notes/create']['res'];
		assert.strictEqual(createResultBodyBob.createdNote.user.username, 'bob');
	});

	// https://datatracker.ietf.org/doc/html/rfc7636.html
	describe('PKCE', () => {
		// https://datatracker.ietf.org/doc/html/rfc7636.html#section-4.4.1
		// '... the authorization endpoint MUST return the authorization
		// error response with the "error" value set to "invalid_request".'
		test('Require PKCE', async () => {
			const client = new AuthorizationCode(clientConfig);

			// Pattern 1: No PKCE fields at all
			let response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
			}), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_request');

			// Pattern 2: Only code_challenge
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_request');

			// Pattern 3: Only code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_request');

			// Pattern 4: Unsupported code_challenge_method
			response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'SSSS',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_request');
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
					} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
						assert.strictEqual(err.data.payload.error, 'invalid_grant');
						return true;
					});
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
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});
		});

		test('On failure', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);
			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({ code, redirect_uri }), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});

			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});
		});

		test('Revoke the already granted access token', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);
			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			const token = await client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended);

			const createResult = await api('notes/create', { text: 'test' }, {
				token: token.token.access_token as string,
				bearer: true,
			});
			assert.strictEqual(createResult.status, 200);

			await assert.rejects(client.getToken({
				code,
				redirect_uri,
				code_verifier,
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});

			const createResult2 = await api('notes/create', { text: 'test' }, {
				token: token.token.access_token as string,
				bearer: true,
			});
			assert.strictEqual(createResult2.status, 401);
		});
	});

	test('Cancellation', async () => {
		const client = new AuthorizationCode(clientConfig);

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

		const locationHeader = decisionResponse.headers.get('location');
		assert.ok(locationHeader);

		const location = new URL(locationHeader);
		assert.ok(!location.searchParams.has('code'));
		assert.ok(location.searchParams.has('error'));
	});

	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-3.3
	describe('Scope', () => {
		// "If the client omits the scope parameter when requesting
		// authorization, the authorization server MUST either process the
		// request using a pre-defined default value or fail the request
		// indicating an invalid scope."
		// (And Misskey does the latter)
		test('Missing scope', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_scope');
		});

		test('Empty scope', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: '',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_scope');
		});

		test('Unknown scopes', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'test:unknown test:unknown2',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended), { redirect: 'manual' });
			assertIndirectError(response, 'invalid_scope');
		});

		// "If the issued access token scope
		// is different from the one requested by the client, the authorization
		// server MUST include the "scope" response parameter to inform the
		// client of the actual scope granted."
		// (Although Misskey always return scope, which is also fine)
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

			assert.strictEqual(token.token.scope, 'write:notes');
		});

		test('Known scopes', async () => {
			const client = new AuthorizationCode(clientConfig);

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

			const createResult = await api('notes/create', { text: 'test' }, {
				token: token.token.access_token as string,
				bearer: true,
			});
			assert.strictEqual(createResult.status, 403);
			assert.ok(createResult.headers.get('WWW-Authenticate')?.startsWith('Bearer realm="Misskey", error="insufficient_scope", error_description'));
		});
	});

	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-3.1.2.4
	// "If an authorization request fails validation due to a missing,
	// invalid, or mismatching redirection URI, the authorization server
	// SHOULD inform the resource owner of the error and MUST NOT
	// automatically redirect the user-agent to the invalid redirection URI."
	describe('Redirection', () => {
		test('Invalid redirect_uri at authorization endpoint', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				redirect_uri: 'http://127.0.0.2/',
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			await assertDirectError(response, 400, 'invalid_request');
		});

		test('Invalid redirect_uri including the valid one at authorization endpoint', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				redirect_uri: 'http://127.0.0.1/redirection',
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			await assertDirectError(response, 400, 'invalid_request');
		});

		test('No redirect_uri at authorization endpoint', async () => {
			const client = new AuthorizationCode(clientConfig);

			const response = await fetch(client.authorizeURL({
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			await assertDirectError(response, 400, 'invalid_request');
		});

		test('Invalid redirect_uri at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				redirect_uri: 'http://127.0.0.2/',
				code_verifier,
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});
		});

		test('Invalid redirect_uri including the valid one at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				redirect_uri: 'http://127.0.0.1/redirection',
				code_verifier,
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});
		});

		test('No redirect_uri at token endpoint', async () => {
			const { code_challenge, code_verifier } = await pkceChallenge(128);

			const { client, code } = await fetchAuthorizationCode(alice, 'write:notes', code_challenge);

			await assert.rejects(client.getToken({
				code,
				code_verifier,
			} as AuthorizationTokenConfigExtended), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'invalid_grant');
				return true;
			});
		});
	});

	// https://datatracker.ietf.org/doc/html/rfc8414
	test('Server metadata', async () => {
		const response = await fetch(new URL('.well-known/oauth-authorization-server', host));
		assert.strictEqual(response.status, 200);

		const body = await response.json();
		assert.strictEqual(body.issuer, 'http://misskey.local');
		assert.ok(body.scopes_supported.includes('write:notes'));
	});

	// Any error on decision endpoint is solely on Misskey side and nothing to do with the client.
	// Do not use indirect error here.
	describe('Decision endpoint', () => {
		test('No login token', async () => {
			const client = new AuthorizationCode(clientConfig);

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
			await assertDirectError(decisionResponse, 400, 'invalid_request');
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
			await assertDirectError(decisionResponse, 400, 'invalid_request');
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
			await assertDirectError(decisionResponse, 403, 'access_denied');
		});
	});

	// Only authorization code grant is supported
	describe('Grant type', () => {
		test('Implicit grant is not supported', async () => {
			const url = new URL('/oauth/authorize', host);
			url.searchParams.append('response_type', 'token');
			const response = await fetch(url);
			assertDirectError(response, 501, 'unsupported_response_type');
		});

		test('Resource owner grant is not supported', async () => {
			const client = new ResourceOwnerPassword({
				...clientConfig,
				auth: {
					tokenHost: host,
					tokenPath: '/oauth/token',
				},
			});

			await assert.rejects(client.getToken({
				username: 'alice',
				password: 'test',
			}), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'unsupported_grant_type');
				return true;
			});
		});

		test('Client credential grant is not supported', async () => {
			const client = new ClientCredentials({
				...clientConfig,
				auth: {
					tokenHost: host,
					tokenPath: '/oauth/token',
				},
			});

			await assert.rejects(client.getToken({}), (err: GetTokenError) => {
				assert.strictEqual(err.data.payload.error, 'unsupported_grant_type');
				return true;
			});
		});
	});

	// https://indieauth.spec.indieweb.org/#client-information-discovery
	describe('Client Information Discovery', () => {
		describe('Redirection', () => {
			const tests: Record<string, (reply: FastifyReply) => void> = {
				'Read HTTP header': reply => {
					reply.header('Link', '</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<div class="h-app"><a href="/" class="u-url p-name">Misklient
					`);
				},
				'Mixed links': reply => {
					reply.header('Link', '</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<link rel="redirect_uri" href="/redirect2" />
						<div class="h-app"><a href="/" class="u-url p-name">Misklient
					`);
				},
				'Multiple items in Link header': reply => {
					reply.header('Link', '</redirect2>; rel="redirect_uri",</redirect>; rel="redirect_uri"');
					reply.send(`
						<!DOCTYPE html>
						<div class="h-app"><a href="/" class="u-url p-name">Misklient
					`);
				},
				'Multiple items in HTML': reply => {
					reply.send(`
						<!DOCTYPE html>
						<link rel="redirect_uri" href="/redirect2" />
						<link rel="redirect_uri" href="/redirect" />
						<div class="h-app"><a href="/" class="u-url p-name">Misklient
					`);
				},
			};

			for (const [title, replyFunc] of Object.entries(tests)) {
				test(title, async () => {
					sender = replyFunc;

					const client = new AuthorizationCode(clientConfig);

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
				sender = (reply): void => {
					reply.send(`
						<!DOCTYPE html>
						<div class="h-app"><a href="/" class="u-url p-name">Misklient
					`);
				};

				const client = new AuthorizationCode(clientConfig);

				const response = await fetch(client.authorizeURL({
					redirect_uri,
					scope: 'write:notes',
					state: 'state',
					code_challenge: 'code',
					code_challenge_method: 'S256',
				} as AuthorizationParamsExtended));

				// direct error because there's no redirect URI to ping
				await assertDirectError(response, 400, 'invalid_request');
			});
		});

		test('Disallow loopback', async () => {
			process.env.MISSKEY_TEST_CHECK_IP_RANGE = '1';

			const client = new AuthorizationCode(clientConfig);
			const response = await fetch(client.authorizeURL({
				redirect_uri,
				scope: 'write:notes',
				state: 'state',
				code_challenge: 'code',
				code_challenge_method: 'S256',
			} as AuthorizationParamsExtended));
			await assertDirectError(response, 400, 'invalid_request');
		});

		test('Missing name', async () => {
			sender = (reply): void => {
				reply.header('Link', '</redirect>; rel="redirect_uri"');
				reply.send();
			};

			const client = new AuthorizationCode(clientConfig);

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

		test('Mismatching URL in h-app', async () => {
			sender = (reply): void => {
				reply.header('Link', '</redirect>; rel="redirect_uri"');
				reply.send(`
					<!DOCTYPE html>
					<div class="h-app"><a href="/foo" class="u-url p-name">Misklient
				`);
				reply.send();
			};

			const client = new AuthorizationCode(clientConfig);

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

	describe('CORS', () => {
		test('Token endpoint should support CORS', async () => {
			const response = await fetch(new URL('/oauth/token', host), { method: 'POST' });
			assert.ok(!response.ok);
			assert.strictEqual(response.headers.get('Access-Control-Allow-Origin'), '*');
		});

		test('Authorize endpoint should not support CORS', async () => {
			const response = await fetch(new URL('/oauth/authorize', host), { method: 'GET' });
			assert.ok(!response.ok);
			assert.ok(!response.headers.has('Access-Control-Allow-Origin'));
		});

		test('Decision endpoint should not support CORS', async () => {
			const response = await fetch(new URL('/oauth/decision', host), { method: 'POST' });
			assert.ok(!response.ok);
			assert.ok(!response.headers.has('Access-Control-Allow-Origin'));
		});
	});
});
