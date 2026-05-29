/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import dns from 'node:dns/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import * as htmlParser from 'node-html-parser';
import httpLinkHeader from 'http-link-header';
import ipaddr from 'ipaddr.js';
import { verifyChallenge } from 'pkce-challenge';
import { permissions as kinds } from 'misskey-js';
import {
	AccessDeniedError,
	InvalidGrantError,
	InvalidRequestError,
	InvalidScopeError,
	OAuthProviderError,
	UnsupportedGrantTypeError,
	UnsupportedResponseTypeError,
} from './errors.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { AccessTokensRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import type { MiLocalUser } from '@/models/User.js';
import { MemoryKVCache } from '@/misc/cache.js';
import { LoggerService } from '@/core/LoggerService.js';
import Logger from '@/logger.js';
import { StatusError } from '@/misc/status-error.js';
import { HtmlTemplateService } from '@/server/web/HtmlTemplateService.js';
import { OAuthPage } from '@/server/web/views/oauth.js';

// TODO: Consider migrating to @node-oauth/oauth2-server once
// https://github.com/node-oauth/node-oauth2-server/issues/180 is figured out.
// Upstream the various validations and RFC9207 implementation in that case.

// Follows https://indieauth.spec.indieweb.org/#client-identifier
// This is also mostly similar to https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation
// although Google has stricter rule.
function validateClientId(raw: string): URL {
	// "Clients are identified by a [URL]."
	const url = ((): URL => {
		try {
			return new URL(raw);
		} catch {
			throw new InvalidRequestError('client_id must be a valid URL');
		}
	})();

	// "Client identifier URLs MUST have either an https or http scheme"
	// But then again:
	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-3.1.2.1
	// 'The redirection endpoint SHOULD require the use of TLS as described
	// in Section 1.6 when the requested response type is "code" or "token"'
	const allowedProtocols = process.env.NODE_ENV === 'test' ? ['http:', 'https:'] : ['https:'];
	if (!allowedProtocols.includes(url.protocol)) {
		throw new InvalidRequestError('client_id must be a valid HTTPS URL');
	}

	// "MUST contain a path component (new URL() implicitly adds one)"

	// "MUST NOT contain single-dot or double-dot path segments,"
	const segments = url.pathname.split('/');
	if (segments.includes('.') || segments.includes('..')) {
		throw new InvalidRequestError('client_id must not contain dot path segments');
	}

	// ("MAY contain a query string component")

	// "MUST NOT contain a fragment component"
	if (url.hash) {
		throw new InvalidRequestError('client_id must not contain a fragment component');
	}

	// "MUST NOT contain a username or password component"
	if (url.username || url.password) {
		throw new InvalidRequestError('client_id must not contain a username or a password');
	}

	// ("MAY contain a port")

	// "host names MUST be domain names or a loopback interface and MUST NOT be
	// IPv4 or IPv6 addresses except for IPv4 127.0.0.1 or IPv6 [::1]."
	if (!url.hostname.match(/\.\w+$/) && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
		throw new InvalidRequestError('client_id must have a domain name as a host name');
	}

	return url;
}

interface ClientInformation {
	id: string;
	redirectUris: string[];
	name: string;
	logo: string | null;
}

interface OAuthRequestParameters {
	[key: string]: string | string[] | undefined;
}

interface AuthorizationRequest {
	clientId: string;
	redirectUri: string;
	state?: string;
	scopes: string[];
	codeChallenge: string;
	codeChallengeMethod: string;
}

interface AuthorizationRequestSeed {
	clientInfo: ClientInformation;
	clientId: string;
	redirectUri: string;
	state?: string;
	requestedScope: string[];
	codeChallenge?: string;
	codeChallengeMethod?: string;
}

interface AuthorizationTransaction {
	client: ClientInformation;
	request: AuthorizationRequest;
}

interface AuthorizationCodeGrant {
	clientId: string;
	userId: string;
	redirectUri: string;
	codeChallenge: string;
	scopes: string[];
	grantedToken?: string;
	revoked?: boolean;
	used?: boolean;
}

function parseMicroformats(doc: htmlParser.HTMLElement, baseUrl: string, id: string): { name: string | null; logo: string | null; } {
	let name: string | null = null;
	let logo: string | null = null;

	const hApp = doc.querySelector('.h-app');
	if (hApp == null) return { name, logo };

	const nameEl = hApp.querySelector('.p-name');
	if (nameEl != null) {
		const href = nameEl.attributes.href || nameEl.attributes.src;
		if (href != null && new URL(href, baseUrl).toString() === new URL(id).toString()) {
			name = nameEl.textContent.trim();
		}
	}

	const logoEl = hApp.querySelector('.u-logo');
	if (logoEl != null) {
		const href = logoEl.attributes.href || logoEl.attributes.src;
		if (href != null) {
			logo = new URL(href, baseUrl).toString();
		}
	}

	return { name, logo };
}

async function discoverClientInformation(logger: Logger, httpRequestService: HttpRequestService, id: string): Promise<ClientInformation> {
	try {
		const res = await httpRequestService.send(id);

		const redirectUris: string[] = [];
		let name = id;
		let logo: string | null = null;

		// https://indieauth.spec.indieweb.org/#redirect-url
		// "The client SHOULD publish one or more <link> tags or Link HTTP headers with a rel attribute
		// of redirect_uri at the client_id URL.
		// Authorization endpoints verifying that a redirect_uri is allowed for use by a client MUST
		// look for an exact match of the given redirect_uri in the request against the list of
		// redirect_uris discovered after resolving any relative URLs."
		const linkHeader = res.headers.get('link');
		if (linkHeader) {
			redirectUris.push(...httpLinkHeader.parse(linkHeader).get('rel', 'redirect_uri').map(link => link.uri));
		}

		const contentType = res.headers.get('content-type');
		const mediaType = contentType ? contentType.split(';')[0].trim() : null;
		if (mediaType === 'application/json') {
			// Client discovery via JSON document (11 July 2024 spec)
			// https://indieauth.spec.indieweb.org/#client-metadata
			// "Clients SHOULD have a JSON [RFC7159] document at their client_id URL containing
			// client metadata defined in [RFC7591], the minimum properties for an IndieAuth
			// client defined below."

			const json = await res.json() as {
				client_id: string;
				client_name?: string;
				client_uri: string;
				logo_uri?: string;
				redirect_uris?: string[];
			};

			// https://indieauth.spec.indieweb.org/#client-metadata-li-1
			// "The authorization server MUST verify that the client_id in the document matches the
			// client_id of the URL where the document was retrieved."
			if (json.client_id !== id) {
				throw new InvalidRequestError('client_id in the document does not match the client_id URL');
			}

			// https://indieauth.spec.indieweb.org/#client-metadata-li-1
			// "The client_uri MUST be a prefix of the client_id."
			if (!json.client_uri || !id.startsWith(json.client_uri)) {
				throw new InvalidRequestError('client_uri is not a prefix of client_id');
			}

			if (typeof json.client_name === 'string') {
				name = json.client_name;
			}

			if (typeof json.logo_uri === 'string') {
				// Since uri can be relative, resolve it against the document URL
				logo = new URL(json.logo_uri, res.url).toString();
			}

			if (Array.isArray(json.redirect_uris)) {
				redirectUris.push(...json.redirect_uris.filter((uri): uri is string => typeof uri === 'string'));
			}
		} else {
			// Client discovery via HTML microformats (12 February 2022 spec)
			// https://indieauth.spec.indieweb.org/20220212/#client-information-discovery
			// "Authorization servers SHOULD support parsing the [h-app] Microformat from the client_id,
			// and if there is an [h-app] with a url property matching the client_id URL,
			// then it should use the name and icon and display them on the authorization prompt."
			const text = await res.text();
			const doc = htmlParser.parse(`<div>${text}</div>`);

			redirectUris.push(...[...doc.querySelectorAll('link[rel=redirect_uri][href]')].map(el => el.attributes.href));

			if (text) {
				const microformats = parseMicroformats(doc, res.url, id);
				if (typeof microformats.name === 'string') {
					name = microformats.name;
				}
				if (typeof microformats.logo === 'string') {
					logo = microformats.logo;
				}
			}
		}

		return {
			id,
			redirectUris: redirectUris.map(uri => new URL(uri, res.url).toString()),
			name: typeof name === 'string' ? name : id,
			logo,
		};
	} catch (err) {
		logger.error('Error while fetching client information', { err });
		if (err instanceof StatusError) {
			throw new InvalidRequestError('Failed to fetch client information');
		}
		if (err instanceof OAuthProviderError) {
			throw err;
		}

		const wrapped = new InvalidRequestError('Failed to parse client information');
		wrapped.status = 500;
		wrapped.statusCode = 500;
		wrapped.error = 'server_error';
		throw wrapped;
	}
}

function firstValue(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

function normalizeScope(scope: string | string[] | undefined): string[] {
	const raw = Array.isArray(scope) ? scope : scope != null ? [scope] : [];
	return raw.flatMap(value => value.split(/\s+/)).filter(Boolean);
}

function toRequestParameters(body: unknown): OAuthRequestParameters {
	if (body == null || typeof body !== 'object' || Array.isArray(body)) {
		return {};
	}

	return body as OAuthRequestParameters;
}

function applyNoStore(ctx: HonoContext): void {
	ctx.header('Cache-Control', 'no-store');
	ctx.header('Pragma', 'no-cache');
}

function createUnsupportedResponseTypeError(): OAuthProviderError {
	const error = new UnsupportedResponseTypeError();
	error.status = 501;
	error.statusCode = 501;
	return error;
}

function createForbiddenAccessDenied(description: string): OAuthProviderError {
	const error = new AccessDeniedError(description);
	error.status = 403;
	error.statusCode = 403;
	return error;
}

function normalizeOAuthProviderError(error: unknown): OAuthProviderError {
	if (error instanceof OAuthProviderError) {
		return error;
	}

	const wrapped = new InvalidRequestError('request is invalid');
	if (error instanceof Error) {
		wrapped.error_description = error.message;
	}
	return wrapped;
}

function sendOAuthProviderError(ctx: HonoContext, error: OAuthProviderError) {
	applyNoStore(ctx);
	ctx.status(error.statusCode ?? error.status ?? 400);
	return ctx.json({
		error: error.error,
		...(error.expose && error.error_description ? { error_description: error.error_description } : {}),
	});
}

function appendIssuer(payload: Record<string, string>, issuerUrl: string): Record<string, string> {
	return {
		...payload,

		// https://datatracker.ietf.org/doc/html/rfc9207#name-response-parameter-iss
		// "In authorization responses to the client, including error responses,
		// an authorization server supporting this specification MUST indicate its
		// identity by including the iss parameter in the response."
		iss: issuerUrl,
	};
}

function redirectWithQuery(ctx: HonoContext, redirectUriString: string, payload: Record<string, string>) {
	applyNoStore(ctx);

	const redirectUri = new URL(redirectUriString);
	for (const [key, value] of Object.entries(payload)) {
		redirectUri.searchParams.set(key, value);
	}

	ctx.status(302);
	return ctx.redirect(redirectUri.toString());
}

@Injectable()
export class OAuth2ProviderService {
	#authorizationTransactionCache = new MemoryKVCache<AuthorizationTransaction>(1000 * 60 * 5);
	#grantCodeCache = new MemoryKVCache<AuthorizationCodeGrant>(1000 * 60 * 5);
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		private httpRequestService: HttpRequestService,
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,
		private idService: IdService,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private cacheService: CacheService,
		loggerService: LoggerService,
		private htmlTemplateService: HtmlTemplateService,
	) {
		this.#logger = loggerService.getLogger('oauth');
	}

	async #resolveAuthorizationRequest(params: OAuthRequestParameters): Promise<AuthorizationRequestSeed> {
		const clientId = firstValue(params.client_id);
		const redirectUriValue = firstValue(params.redirect_uri);
		const responseType = firstValue(params.response_type);
		const state = firstValue(params.state);
		const codeChallenge = firstValue(params.code_challenge);
		const codeChallengeMethod = firstValue(params.code_challenge_method);
		const requestedScope = normalizeScope(params.scope);

		this.#logger.info(`Validating authorization parameters, with client_id: ${clientId}, redirect_uri: ${redirectUriValue}, scope: ${requestedScope.join(' ')}`);

		if (responseType !== 'code') {
			throw createUnsupportedResponseTypeError();
		}

		if (!clientId) {
			throw new InvalidRequestError('client_id must be provided');
		}

		const clientUrl = validateClientId(clientId);

		// https://indieauth.spec.indieweb.org/#client-information-discovery
		// "the server may want to resolve the domain name first and avoid fetching the document
		// if the IP address is within the loopback range defined by [RFC5735]
		// or any other implementation-specific internal IP address."
		if (process.env.NODE_ENV !== 'test' || process.env.MISSKEY_TEST_CHECK_IP_RANGE === '1') {
			const lookup = await dns.lookup(clientUrl.hostname);
			if (ipaddr.parse(lookup.address).range() !== 'unicast') {
				throw new InvalidRequestError('client_id resolves to disallowed IP range.');
			}
		}

		// Find client information from the remote.
		const clientInfo = await discoverClientInformation(this.#logger, this.httpRequestService, clientUrl.href);

		// Require the redirect URI to be included in an explicit list, per
		// https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-4.1.3
		if (!redirectUriValue || !clientInfo.redirectUris.includes(redirectUriValue)) {
			throw new InvalidRequestError('Invalid redirect_uri');
		}

		return {
			clientInfo,
			clientId: clientInfo.id,
			redirectUri: redirectUriValue,
			state,
			requestedScope,
			codeChallenge,
			codeChallengeMethod,
		};
	}

	#finalizeAuthorizationRequest(seed: AuthorizationRequestSeed): AuthorizationRequest {
		const scopes = [...new Set(seed.requestedScope)].filter(scope => (<readonly string[]>kinds).includes(scope));
		if (!seed.requestedScope.length || !scopes.length) {
			throw new InvalidScopeError('`scope` parameter has no known scope', seed.requestedScope.join(' '));
		}

		// Require PKCE parameters.
		// Recommended by https://indieauth.spec.indieweb.org/#authorization-request, but also prevents downgrade attack:
		// https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#name-pkce-downgrade-attack
		if (typeof seed.codeChallenge !== 'string') {
			throw new InvalidRequestError('`code_challenge` parameter is required');
		}
		if (seed.codeChallengeMethod !== 'S256') {
			throw new InvalidRequestError('`code_challenge_method` parameter must be set as S256');
		}

		return {
			clientId: seed.clientId,
			redirectUri: seed.redirectUri,
			state: seed.state,
			scopes,
			codeChallenge: seed.codeChallenge,
			codeChallengeMethod: seed.codeChallengeMethod,
		};
	}

	async #findUserByLoginToken(loginToken: string): Promise<MiLocalUser> {
		const user = await this.cacheService.localUserByNativeTokenCache.fetch(loginToken,
			() => this.usersRepository.findOneBy({ token: loginToken }) as Promise<MiLocalUser | null>);
		if (!user) {
			throw new InvalidRequestError('No such user');
		}

		return user;
	}

	async #revokeGrantCode(granted: AuthorizationCodeGrant, code: string): Promise<void> {
		this.#logger.info(`Detected multiple code use from ${granted.clientId} for user ${granted.userId}. Revoking the code.`);
		this.#grantCodeCache.delete(code);
		granted.revoked = true;
		if (granted.grantedToken) {
			await this.accessTokensRepository.delete({ token: granted.grantedToken });
		}
	}

	// https://datatracker.ietf.org/doc/html/rfc8414.html
	// https://indieauth.spec.indieweb.org/#indieauth-server-metadata
	public generateRFC8414() {
		return {
			issuer: this.config.url,
			authorization_endpoint: new URL('/oauth/authorize', this.config.url),
			token_endpoint: new URL('/oauth/token', this.config.url),
			scopes_supported: kinds,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code'],
			service_documentation: 'https://misskey-hub.net',
			code_challenge_methods_supported: ['S256'],
			authorization_response_iss_parameter_supported: true,
		};
	}

	@bindThis
	public createServer(): Hono {
		const app = new Hono();
		app.get('/authorize', async (ctx) => {
			let validatedRedirectUri: string | undefined;
			let state: string | undefined;

			try {
				const seed = await this.#resolveAuthorizationRequest(ctx.req.query() as OAuthRequestParameters);
				const { clientInfo } = seed;
				validatedRedirectUri = seed.redirectUri;
				state = seed.state;
				const authorizationRequest = this.#finalizeAuthorizationRequest(seed);

				const transactionId = secureRndstr(128);
				this.#authorizationTransactionCache.set(transactionId, {
					client: clientInfo,
					request: authorizationRequest,
				});

				this.#logger.info(`Rendering authorization page for "${clientInfo.name}"`);

				applyNoStore(ctx);
				return ctx.html(OAuthPage({
					...await this.htmlTemplateService.getCommonData(),
					transactionId,
					clientName: clientInfo.name,
					clientLogo: clientInfo.logo ?? undefined,
					scope: authorizationRequest.scopes,
				}));
			} catch (error) {
				const OAuthProviderError = normalizeOAuthProviderError(error);
				if (validatedRedirectUri && OAuthProviderError.allow_redirect && OAuthProviderError.error !== 'unsupported_response_type') {
					return redirectWithQuery(ctx, validatedRedirectUri, appendIssuer({
						error: OAuthProviderError.error,
						...(state ? { state } : {}),
					}, this.config.url));
				}

				return sendOAuthProviderError(ctx, OAuthProviderError);
			}
		});

		app.post('/decision', async (ctx) => {
			try {
				const body = toRequestParameters(await ctx.req.parseBody());
				const transactionId = firstValue(body.transaction_id);
				if (!transactionId) {
					throw new InvalidRequestError('Missing transaction ID');
				}

				const transaction = this.#authorizationTransactionCache.get(transactionId);
				if (!transaction) {
					throw createForbiddenAccessDenied('Invalid or expired transaction ID');
				}
				this.#authorizationTransactionCache.delete(transactionId);

				const cancel = !!firstValue(body.cancel);
				this.#logger.info(`Received the decision. Cancel: ${cancel}`);
				if (cancel) {
					return redirectWithQuery(ctx, transaction.request.redirectUri, appendIssuer({
						error: 'access_denied',
						...(transaction.request.state ? { state: transaction.request.state } : {}),
					}, this.config.url));
					return;
				}

				const loginToken = firstValue(body.login_token);
				if (!loginToken) {
					throw new InvalidRequestError('No user');
				}

				this.#logger.info(`Checking the user before sending authorization code to ${transaction.client.id}`);
				const user = await this.#findUserByLoginToken(loginToken);

				this.#logger.info(`Sending authorization code on behalf of user ${user.id} to ${transaction.client.id} through ${transaction.request.redirectUri}, with scope: [${transaction.request.scopes}]`);

				const code = secureRndstr(128);
				this.#grantCodeCache.set(code, {
					clientId: transaction.client.id,
					userId: user.id,
					redirectUri: transaction.request.redirectUri,
					codeChallenge: transaction.request.codeChallenge,
					scopes: transaction.request.scopes,
				});

				return redirectWithQuery(ctx, transaction.request.redirectUri, appendIssuer({
					code,
					...(transaction.request.state ? { state: transaction.request.state } : {}),
				}, this.config.url));
			} catch (error) {
				return sendOAuthProviderError(ctx, normalizeOAuthProviderError(error));
			}
		});

		app.all('*', async (ctx) => {
			ctx.status(404);
			return ctx.json({
				error: {
					message: 'Unknown OAuth endpoint.',
					code: 'UNKNOWN_OAUTH_ENDPOINT',
					id: 'aa49e620-26cb-4e28-aad6-8cbcb58db147',
					kind: 'client',
				},
			});
		});

		return app;
	}

	public createTokenServer(): Hono {
		const app = new Hono();
		app.post('', async (ctx) => {
			applyNoStore(ctx);

			try {
				const body = toRequestParameters(await ctx.req.parseBody());
				const grantType = firstValue(body.grant_type);
				if (!grantType) {
					throw new InvalidRequestError('grant_type is required');
				}
				if (grantType !== 'authorization_code') {
					throw new UnsupportedGrantTypeError();
				}

				const code = firstValue(body.code);
				const clientId = firstValue(body.client_id);
				const redirectUriValue = firstValue(body.redirect_uri);
				const codeVerifier = firstValue(body.code_verifier);

				this.#logger.info('Checking the received authorization code for the exchange');
				if (!code) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const granted = this.#grantCodeCache.get(code);
				if (!granted) {
					throw new InvalidGrantError('grant request is invalid');
				}

				// https://datatracker.ietf.org/doc/html/rfc6749.html#section-4.1.2
				// "If an authorization code is used more than once, the authorization server
				// MUST deny the request and SHOULD revoke (when possible) all tokens
				// previously issued based on that authorization code."
				if (granted.used) {
					await this.#revokeGrantCode(granted, code);
					throw new InvalidGrantError('grant request is invalid');
				}
				granted.used = true;

				// https://datatracker.ietf.org/doc/html/rfc6749.html#section-4.1.3
				if (clientId !== granted.clientId || redirectUriValue !== granted.redirectUri) {
					throw new InvalidGrantError('grant request is invalid');
				}

				// https://datatracker.ietf.org/doc/html/rfc7636.html#section-4.6
				if (!codeVerifier) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const challengeResult = await verifyChallenge(codeVerifier, granted.codeChallenge);
				if (!challengeResult) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const accessToken = secureRndstr(128);
				const now = new Date();

				// NOTE: we don't have a setup for automatic token expiration
				await this.accessTokensRepository.insert({
					id: this.idService.gen(now.getTime()),
					lastUsedAt: now,
					userId: granted.userId,
					token: accessToken,
					hash: accessToken,
					name: granted.clientId,
					permission: granted.scopes,
				});

				if (granted.revoked) {
					this.#logger.info('Canceling the token as the authorization code was revoked in parallel during the process.');
					await this.accessTokensRepository.delete({ token: accessToken });
					throw new InvalidGrantError('grant request is invalid');
				}

				granted.grantedToken = accessToken;
				this.#logger.info(`Generated access token for ${granted.clientId} for user ${granted.userId}, with scope: [${granted.scopes}]`);

				return ctx.json({
					access_token: accessToken,
					token_type: 'Bearer',
					scope: granted.scopes.join(' '),
				});
			} catch (error) {
				return sendOAuthProviderError(ctx, normalizeOAuthProviderError(error));
			}
		});

		return app;
	}
}
