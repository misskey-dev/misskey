import dns from 'node:dns/promises';
import { Inject, Injectable } from '@nestjs/common';
import fastifyMiddie, { IncomingMessageExtended } from '@fastify/middie';
import { JSDOM } from 'jsdom';
import parseLinkHeader from 'parse-link-header';
import ipaddr from 'ipaddr.js';
import oauth2orize, { type OAuth2 } from 'oauth2orize';
import * as oauth2Query from 'oauth2orize/lib/response/query.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { kinds } from '@/misc/api-permissions.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import type Redis from 'ioredis';
import oauth2Pkce from 'oauth2orize-pkce';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import expressSession from 'express-session';
import http from 'node:http';
import fastifyView from '@fastify/view';
import pug from 'pug';
import { fileURLToPath } from 'node:url';
import { MetaService } from '@/core/MetaService.js';
import fastifyFormbody from '@fastify/formbody';
import bodyParser from 'body-parser';
import fastifyExpress from '@fastify/express';
import crypto from 'node:crypto';
import type { AccessTokensRepository, UsersRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import type { LocalUser } from '@/models/entities/User.js';

// https://indieauth.spec.indieweb.org/#client-identifier
function validateClientId(raw: string): URL {
	// Clients are identified by a [URL].
	const url = ((): URL => {
		try {
			return new URL(raw);
		} catch { throw new Error('client_id must be a valid URL'); }
	})();

	// Client identifier URLs MUST have either an https or http scheme
	// XXX: but why allow http in 2023?
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

	// (MAY contain a port)

	// host names MUST be domain names or a loopback interface and MUST NOT be
	// IPv4 or IPv6 addresses except for IPv4 127.0.0.1 or IPv6 [::1].
	if (!url.hostname.match(/\.\w+$/) && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
		throw new Error('client_id must have a domain name as a host name');
	}

	return url;
}

// const grantable = new Set([
// 	'AccessToken',
// 	'AuthorizationCode',
// 	'RefreshToken',
// 	'DeviceCode',
// 	'BackchannelAuthenticationRequest',
// ]);

// const consumable = new Set([
// 	'AuthorizationCode',
// 	'RefreshToken',
// 	'DeviceCode',
// 	'BackchannelAuthenticationRequest',
// ]);

// function grantKeyFor(id: string): string {
// 	return `grant:${id}`;
// }

// function userCodeKeyFor(userCode: string): string {
// 	return `userCode:${userCode}`;
// }

// function uidKeyFor(uid: string): string {
// 	return `uid:${uid}`;
// }

async function fetchFromClientId(httpRequestService: HttpRequestService, id: string): Promise<string | void> {
	try {
		const res = await httpRequestService.send(id);
		let redirectUri = parseLinkHeader(res.headers.get('link'))?.redirect_uri?.url;
		if (redirectUri) {
			return new URL(redirectUri, res.url).toString();
		}

		redirectUri = JSDOM.fragment(await res.text()).querySelector<HTMLLinkElement>('link[rel=redirect_uri][href]')?.href;
		if (redirectUri) {
			return new URL(redirectUri, res.url).toString();
		}
	} catch {
		throw new Error('Failed to fetch client information');
	}
}

// class MisskeyAdapter implements Adapter {
// 	name = 'oauth2';

// 	constructor(private redisClient: Redis.Redis, private httpRequestService: HttpRequestService) { }

// 	key(id: string): string {
// 		return `oauth2:${id}`;
// 	}

// 	async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
// 		console.log('oauth upsert', id, payload, expiresIn);

// 		const key = this.key(id);

// 		const multi = this.redisClient.multi();
// 		if (consumable.has(this.name)) {
// 			multi.hset(key, { payload: JSON.stringify(payload) });
// 		} else {
// 			multi.set(key, JSON.stringify(payload));
// 		}

// 		if (expiresIn) {
// 			multi.expire(key, expiresIn);
// 		}

// 		if (grantable.has(this.name) && payload.grantId) {
// 			const grantKey = grantKeyFor(payload.grantId);
// 			multi.rpush(grantKey, key);
// 			// if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
// 			// here to trim the list to an appropriate length
// 			const ttl = await this.redisClient.ttl(grantKey);
// 			if (expiresIn > ttl) {
// 				multi.expire(grantKey, expiresIn);
// 			}
// 		}

// 		if (payload.userCode) {
// 			const userCodeKey = userCodeKeyFor(payload.userCode);
// 			multi.set(userCodeKey, id);
// 			multi.expire(userCodeKey, expiresIn);
// 		}

// 		if (payload.uid) {
// 			const uidKey = uidKeyFor(payload.uid);
// 			multi.set(uidKey, id);
// 			multi.expire(uidKey, expiresIn);
// 		}

// 		await multi.exec();
// 	}

// async find(id: string): Promise<void | AdapterPayload> {
// 	console.log('oauth find', id);

// 	// XXX: really?
// 	const fromRedis = await this.findRedis(id);
// 	if (fromRedis) {
// 		return fromRedis;
// 	}

// 	// Find client information from the remote.
// 	const url = validateClientId(id);

// 	if (process.env.NODE_ENV !== 'test') {
// 		const lookup = await dns.lookup(url.hostname);
// 		if (ipaddr.parse(lookup.address).range() === 'loopback') {
// 			throw new Error('client_id unexpectedly resolves to loopback IP.');
// 		}
// 	}

// 	const redirectUri = await fetchFromClientId(this.httpRequestService, id);
// 	if (!redirectUri) {
// 		// IndieAuth also implicitly allows any path under the same scheme+host,
// 		// but oidc-provider requires explicit list of uris.
// 		throw new Error('The URL of client_id must provide `redirect_uri` as HTTP Link header or HTML <link> element.');
// 	}

// 	return {
// 		client_id: id,
// 		token_endpoint_auth_method: 'none',
// 		redirect_uris: [redirectUri],
// 	};
// }

// 	async findRedis(id: string | null): Promise<void | AdapterPayload> {
// 		if (!id) {
// 			return;
// 		}

// 		const data = consumable.has(this.name)
// 			? await this.redisClient.hgetall(this.key(id))
// 			: await this.redisClient.get(this.key(id));

// 		if (!data || (typeof data === 'object' && !Object.entries(data).length)) {
// 			return undefined;
// 		}

// 		if (typeof data === 'string') {
// 			return JSON.parse(data);
// 		}
// 		const { payload, ...rest } = data as any;
// 		return {
// 			...rest,
// 			...JSON.parse(payload),
// 		};
// 	}

// 	async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
// 		console.log('oauth findByUserCode', userCode);
// 		const id = await this.redisClient.get(userCodeKeyFor(userCode));
// 		return this.findRedis(id);
// 	}

// 	async findByUid(uid: string): Promise<void | AdapterPayload> {
// 		console.log('oauth findByUid', uid);
// 		const id = await this.redisClient.get(uidKeyFor(uid));
// 		return this.findRedis(id);
// 	}

// 	async consume(id: string): Promise<void> {
// 		console.log('oauth consume', id);
// 		await this.redisClient.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000));
// 	}

// 	async destroy(id: string): Promise<void | undefined> {
// 		console.log('oauth destroy', id);
// 		const key = this.key(id);
// 		await this.redisClient.del(key);
// 	}

// 	async revokeByGrantId(grantId: string): Promise<void | undefined> {
// 		console.log('oauth revokeByGrandId', grantId);
// 		const multi = this.redisClient.multi();
// 		const tokens = await this.redisClient.lrange(grantKeyFor(grantId), 0, -1);
// 		tokens.forEach((token) => multi.del(token));
// 		multi.del(grantKeyFor(grantId));
// 		await multi.exec();
// 	}
// }

// function promisify<T>(callback: T) {
// 	return (...args: Parameters<T>) => {

// 		args[args.length - 1]();
// 	};
// }

function pkceS256(codeVerifier: string) {
	return crypto.createHash('sha256')
		.update(codeVerifier, 'ascii')
		.digest('base64url');
}

type OmitFirstElement<T extends unknown[]> = T extends [unknown, ...(infer R)]
	? R
	: [];

interface OAuthRequestQuery {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	state: string;
	code_challenge: string;
	code_challenge_method: string;
	scope?: string;
	me?: string;
}

@Injectable()
export class OAuth2ProviderService {
	// #provider: Provider;
	#server = oauth2orize.createServer();

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		private httpRequestService: HttpRequestService,
		private metaService: MetaService,
		@Inject(DI.accessTokensRepository)
		accessTokensRepository: AccessTokensRepository,
		idService: IdService,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private cacheService: CacheService,
	) {
		// this.#provider = new Provider(config.url, {
		// 	clientAuthMethods: ['none'],
		// 	pkce: {
		// 		// This is the default, but be explicit here as we announce it below
		// 		methods: ['S256'],
		// 	},
		// 	routes: {
		// 		// defaults to '/auth' but '/authorize' is more consistent with many
		// 		// other services eg. Mastodon/Twitter/Facebook/GitLab/GitHub/etc.
		// 		authorization: '/authorize',
		// 	},
		// 	scopes: kinds,
		// 	async findAccount(ctx, id): Promise<Account | undefined> {
		// 		console.log(id);
		// 		return undefined;
		// 	},
		// 	adapter(): MisskeyAdapter {
		// 		return new MisskeyAdapter(redisClient, httpRequestService);
		// 	},
		// 	async renderError(ctx, out, error): Promise<void> {
		// 		console.log(error);
		// 	},
		// });

		// TODO: store this in Redis
		const TEMP_GRANT_CODES: Record<string, {
			clientId: string,
			userId: string,
			redirectUri: string,
			codeChallenge: string,
			scopes: string[],
		}> = {};

		const query = (txn, res, params) => {
			// RFC 9207
			// TODO: Oh no, perhaps returning to oidc-provider is better. Hacks everywhere here.
			params.iss = config.url;
			oauth2Query.default(txn, res, params);
		};

		this.#server.grant(oauth2Pkce.extensions());
		this.#server.grant(oauth2orize.grant.code({
			modes: { query }
		}, (client, redirectUri, token, ares, areq, done) => {
			(async (): Promise<OmitFirstElement<Parameters<typeof done>>> => {
				console.log('HIT grant code:', client, redirectUri, token, ares, areq);
				const code = secureRndstr(32, true);

				const user = await this.cacheService.localUserByNativeTokenCache.fetch(token,
					() => this.usersRepository.findOneBy({ token }) as Promise<LocalUser | null>);
				if (!user) {
					throw new Error('No such user');
				}

				TEMP_GRANT_CODES[code] = {
					clientId: client,
					userId: user.id,
					redirectUri,
					codeChallenge: areq.codeChallenge,
					scopes: areq.scope,
				};
				return [code];
			})().then(args => done(null, ...args), err => done(err));
		}));
		this.#server.exchange(oauth2orize.exchange.authorizationCode((client, code, redirectUri, body, done) => {
			(async (): Promise<OmitFirstElement<Parameters<typeof done>>> => {
				const granted = TEMP_GRANT_CODES[code];
				console.log(granted, body, code, redirectUri);
				if (!granted) {
					return [false];
				}
				delete TEMP_GRANT_CODES[code];
				if (body.client_id !== granted.clientId) return [false];
				if (redirectUri !== granted.redirectUri) return [false];
				if (!body.code_verifier || pkceS256(body.code_verifier) !== granted.codeChallenge) return [false];

				const accessToken = secureRndstr(128, true);
				const refreshToken = secureRndstr(128, true);

				const now = new Date();

				// Insert access token doc
				await accessTokensRepository.insert({
					id: idService.genId(),
					createdAt: now,
					lastUsedAt: now,
					userId: granted.userId,
					token: accessToken,
					hash: accessToken,
					name: granted.clientId,
					permission: granted.scopes,
				});

				return [accessToken, refreshToken];
			})().then(args => done(null, ...args), err => done(err));
		}));
		this.#server.serializeClient((client, done) => done(null, client));
		this.#server.deserializeClient((id, done) => done(null, id));
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

		// For now only allow the basic OAuth endpoints, to start small and evaluate
		// this feature for some time, given that this is security related.
		fastify.get<{ Querystring: OAuthRequestQuery }>('/oauth/authorize', async (request, reply) => {
			console.log('HIT /oauth/authorize', request.query);
			const oauth2 = (request.raw as any).oauth2 as (OAuth2 | undefined);
			console.log(oauth2, request.raw.session);

			if (request.query.response_type !== 'code') {
				throw new Error('`response_type` parameter must be set as "code"');
			}
			if (typeof request.query.code_challenge !== 'string') {
				throw new Error('`code_challenge` parameter is required');
			}
			if (request.query.code_challenge_method !== 'S256') {
				throw new Error('`code_challenge_method` parameter must be set as S256');
			}

			const scopes = [...new Set(oauth2?.req.scope)].filter(s => kinds.includes(s));
			if (!scopes.length) {
				throw new Error('`scope` parameter has no known scope');
			}

			reply.header('Cache-Control', 'no-store');
			return await reply.view('oauth', {
				transactionId: oauth2?.transactionID,
				clientId: oauth2?.client,
				scope: scopes.join(' '),
			});
		});
		fastify.post('/oauth/decision', async () => { });
		fastify.post('/oauth/token', async () => { });
		// fastify.get('/oauth/interaction/:uid', async () => { });
		// fastify.get('/oauth/interaction/:uid/login', async () => { });

		fastify.register(fastifyView, {
			root: fileURLToPath(new URL('../web/views', import.meta.url)),
			engine: { pug },
			defaultContext: {
				version: this.config.version,
				config: this.config,
			},
		});

		await fastify.register(fastifyExpress);
		fastify.use(expressSession({ secret: 'keyboard cat', resave: false, saveUninitialized: false }) as any);
		fastify.use('/oauth/authorize', this.#server.authorization((clientId, redirectUri, done) => {
			(async (): Promise<OmitFirstElement<Parameters<typeof done>>> => {
				console.log('HIT /oauth/authorize validation middleware');

				// Find client information from the remote.
				const clientUrl = validateClientId(clientId);
				const redirectUrl = new URL(redirectUri);

				// https://indieauth.spec.indieweb.org/#authorization-request
				// Allow same-origin redirection
				if (redirectUrl.protocol !== clientUrl.protocol || redirectUrl.host !== clientUrl.host) {
					// TODO: allow only explicit redirect_uri by Client Information Discovery
					throw new Error('cross-origin redirect_uri is not supported yet.');
				}

				return [clientId, redirectUri];
			})().then(args => done(null, ...args), err => done(err));
		}));
		// for (const middleware of this.#server.decision()) {

		fastify.use('/oauth/decision', bodyParser.urlencoded({ extended: false }));
		fastify.use('/oauth/decision', this.#server.decision((req, done) => {
			console.log('HIT decision:', req.oauth2, (req as any).body);
			req.user = (req as any).body.login_token;
			done(null, undefined);
		}));

		// Clients may use JSON or urlencoded
		fastify.use('/oauth/token', bodyParser.urlencoded({ extended: false }));
		fastify.use('/oauth/token', bodyParser.json({ strict: true }));
		fastify.use('/oauth/token', this.#server.token());
		// }

		// fastify.use('/oauth', this.#provider.callback());
	}
}
