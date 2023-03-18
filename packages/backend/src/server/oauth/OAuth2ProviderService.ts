import dns from 'node:dns/promises';
import { Inject, Injectable } from '@nestjs/common';
import Provider, { type Adapter, type Account, AdapterPayload } from 'oidc-provider';
import fastifyMiddie from '@fastify/middie';
import { JSDOM } from 'jsdom';
import parseLinkHeader from 'parse-link-header';
import ipaddr from 'ipaddr.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { kinds } from '@/misc/api-permissions.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { FastifyInstance } from 'fastify';


// TODO: For now let's focus on letting oidc-provider use the existing miauth infra.
// Supporting IndieAuth is a separate project.
// Allow client_id created by apps/create or not? It's already marked as old method.

// https://indieauth.spec.indieweb.org/#client-identifier
function validateClientId(raw: string): URL {
	// Clients are identified by a [URL].
	const url = ((): URL => {
		try {
			return new URL(raw);
		} catch { throw new Error('client_id must be a valid URL'); }
	})();

	// Client identifier URLs MUST have either an https or http scheme
	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error('client_id must be either https or http URL');
	}

	// MUST contain a path component (new URL() implicitly adds one)

	// MUST NOT contain single-dot or double-dot path segments,
	// url.
	const segments = url.pathname.split('/');
	if (segments.includes('.') || segments.includes('..')) {
		throw new Error('client_id must not contain dot path segments');
	}

	// MUST NOT contain a fragment component
	if (url.hash) {
		throw new Error('client_id must not contain a fragment component');
	}

	// MUST NOT contain a username or password component
	if (url.username || url.password) {
		throw new Error('client_id must not contain a username or a password');
	}

	// MUST NOT contain a port
	if (url.port) {
		throw new Error('client_id must not contain a port');
	}

	// host names MUST be domain names or a loopback interface and MUST NOT be
	// IPv4 or IPv6 addresses except for IPv4 127.0.0.1 or IPv6 [::1].
	// (But in https://indieauth.spec.indieweb.org/#redirect-url we need to only
	// fetch non-loopback URLs, so exclude them here.)
	if (!url.hostname.match(/\.\w+$/)) {
		throw new Error('client_id must have a domain name as a host name');
	}

	return url;
}

async function fetchFromClientId(httpRequestService: HttpRequestService, id: string): Promise<string | void> {
	try {
		const res = await httpRequestService.send(id);
		let redirectUri = parseLinkHeader(res.headers.get('link'))?.redirect_uri?.url;
		if (redirectUri) {
			return new URL(redirectUri, res.url).toString();
		}

		const { window } = new JSDOM(await res.text());
		redirectUri = window.document.querySelector<HTMLLinkElement>('link[rel=redirect_uri][href]')?.href;
		if (redirectUri) {
			return new URL(redirectUri, res.url).toString();
		}
	} catch {
		throw new Error('Failed to fetch client information');
	}
}

class MisskeyAdapter implements Adapter {
	constructor(private httpRequestService: HttpRequestService) { }

	upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
		console.log('oauth upsert', id, payload, expiresIn);
		throw new Error('Method not implemented.');
	}
	async find(id: string): Promise<void | AdapterPayload> {
		// Find client information from the remote.

		console.log('oauth find', id);
		const url = validateClientId(id);

		if (process.env.NODE_ENV !== 'test') {
			const lookup = await dns.lookup(url.hostname);
			if (ipaddr.parse(lookup.address).range() === 'loopback') {
				throw new Error('client_id unexpectedly resolves to loopback IP.');
			}
		}

		const redirectUri = await fetchFromClientId(this.httpRequestService, id);
		if (!redirectUri) {
			// IndieAuth also implicitly allows any path under the same scheme+host,
			// but oidc-provider does not have such option.
			throw new Error('The URL of client_id must provide `redirect_uri` as HTTP Link header or HTML <link> element.');
		}

		return {
			client_id: id,
			token_endpoint_auth_method: 'none',
			redirect_uris: [redirectUri],
		};
	}
	async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
		console.log('oauth findByUserCode', userCode);
		throw new Error('Method not implemented.');
	}
	async findByUid(uid: string): Promise<void | AdapterPayload> {
		console.log('oauth findByUid', uid);
		throw new Error('Method not implemented.');
	}
	async consume(id: string): Promise<void> {
		console.log('oauth consume', id);
		throw new Error('Method not implemented.');
	}
	async destroy(id: string): Promise<void | undefined> {
		console.log('oauth destroy', id);
		throw new Error('Method not implemented.');
	}
	async revokeByGrantId(grantId: string): Promise<void | undefined> {
		console.log('oauth revokeByGrandId', grantId);
		throw new Error('Method not implemented.');
	}
}

@Injectable()
export class OAuth2ProviderService {
	#provider: Provider;

	constructor(
		@Inject(DI.config)
		private config: Config,
		httpRequestService: HttpRequestService,
	) {
		this.#provider = new Provider(config.url, {
			clientAuthMethods: ['none'],
			pkce: {
				// This is the default, but be explicit here as we announce it below
				methods: ['S256'],
			},
			routes: {
				// defaults to '/auth' but '/authorize' is more consistent with many
				// other services eg. Mastodon/Twitter/Facebook/GitLab/GitHub/etc.
				authorization: '/authorize',
			},
			scopes: kinds,
			async findAccount(ctx, id): Promise<Account | undefined> {
				console.log(id);
				return undefined;
			},
			adapter(): MisskeyAdapter {
				return new MisskeyAdapter(httpRequestService);
			},
			async renderError(ctx, out, error): Promise<void> {
				console.log(error);
			},
		});
	}

	// Return 404 for any unknown paths under /oauth so that clients can know
	// certain endpoints are unsupported.
	// Registering separately because otherwise fastify.use() will match the
	// wildcard too.
	@bindThis
	public async createServerWildcard(fastify: FastifyInstance): Promise<void> {
		fastify.all('/oauth/*', async (_request, reply) => {
			reply.code(404);
			reply.send({
				error: {
					message: 'Unknown OAuth endpoint.',
					code: 'UNKNOWN_OAUTH_ENDPOINT',
					id: 'aa49e620-26cb-4e28-aad6-8cbcb58db147',
					kind: 'client',
				},
			});
		});
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		fastify.get('/.well-known/oauth-authorization-server', async (_request, reply) => {
			reply.send({
				issuer: this.config.url,
				authorization_endpoint: new URL('/oauth/authorize', this.config.url),
				token_endpoint: new URL('/oauth/token', this.config.url),
				code_challenge_methods_supported: ['S256'],
			});
		});

		// oidc-provider provides many more endpoints for OpenID support and there's
		// no way to turn it off.
		// For now only allow the basic OAuth endpoints, to start small and evaluate
		// this feature for some time, given that this is security related.
		fastify.get('/oauth/authorize', async () => { });
		fastify.post('/oauth/token', async () => { });

		await fastify.register(fastifyMiddie);
		fastify.use('/oauth', this.#provider.callback());
	}
}
