import { performance } from 'perf_hooks';
import { pipeline } from 'node:stream';
import * as fs from 'node:fs';
import { promisify } from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import type { CacheableLocalUser, ILocalUser, User } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import type Logger from '@/logger.js';
import type { UserIpsRepository } from '@/models/index.js';
import { MetaService } from '@/core/MetaService.js';
import { createTemp } from '@/misc/create-temp.js';
import { bindThis } from '@/decorators.js';
import { ApiError } from './error.js';
import { RateLimiterService } from './RateLimiterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import { AuthenticateService, AuthenticationError } from './AuthenticateService.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { IEndpointMeta, IEndpoint } from './endpoints.js';

const pump = promisify(pipeline);

const accessDenied = {
	message: 'Access denied.',
	code: 'ACCESS_DENIED',
	id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
};

@Injectable()
export class ApiCallService implements OnApplicationShutdown {
	private logger: Logger;
	private userIpHistories: Map<User['id'], Set<string>>;
	private userIpHistoriesClearIntervalId: NodeJS.Timer;

	constructor(
		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,

		private metaService: MetaService,
		private authenticateService: AuthenticateService,
		private rateLimiterService: RateLimiterService,
		private apiLoggerService: ApiLoggerService,
	) {
		this.logger = this.apiLoggerService.logger;
		this.userIpHistories = new Map<User['id'], Set<string>>();

		this.userIpHistoriesClearIntervalId = setInterval(() => {
			this.userIpHistories.clear();
		}, 1000 * 60 * 60);
	}

	@bindThis
	public handleRequest(
		endpoint: IEndpoint & { exec: any },
		request: FastifyRequest<{ Body: Record<string, unknown> | undefined, Querystring: Record<string, unknown> }>,
		reply: FastifyReply,
	) {
		const body = request.method === 'GET'
			? request.query
			: request.body;

		const token = body?.['i'];
		if (token != null && typeof token !== 'string') {
			reply.code(400);
			return;
		}
		this.authenticateService.authenticate(token).then(([user, app]) => {
			this.call(endpoint, user, app, body, null, request).then((res) => {
				if (request.method === 'GET' && endpoint.meta.cacheSec && !body?.['i'] && !user) {
					reply.header('Cache-Control', `public, max-age=${endpoint.meta.cacheSec}`);
				}
				this.send(reply, res);
			}).catch((err: ApiError) => {
				this.send(reply, err.httpStatusCode ? err.httpStatusCode : err.kind === 'client' ? 400 : 500, err);
			});

			if (user) {
				this.logIp(request, user);
			}
		}).catch(err => {
			if (err instanceof AuthenticationError) {
				this.send(reply, 403, new ApiError({
					message: 'Authentication failed. Please ensure your token is correct.',
					code: 'AUTHENTICATION_FAILED',
					id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
				}));
			} else {
				this.send(reply, 500, new ApiError());
			}
		});
	}

	@bindThis
	public async handleMultipartRequest(
		endpoint: IEndpoint & { exec: any },
		request: FastifyRequest<{ Body: Record<string, unknown>, Querystring: Record<string, unknown> }>,
		reply: FastifyReply,
	) {
		const multipartData = await request.file();
		if (multipartData == null) {
			reply.code(400);
			return;
		}

		const [path] = await createTemp();
		await pump(multipartData.file, fs.createWriteStream(path));

		const fields = {} as Record<string, string | undefined>;
		for (const [k, v] of Object.entries(multipartData.fields)) {
			fields[k] = v.value;
		}

		const token = fields['i'];
		if (token != null && typeof token !== 'string') {
			reply.code(400);
			return;
		}
		this.authenticateService.authenticate(token).then(([user, app]) => {
			this.call(endpoint, user, app, fields, {
				name: multipartData.filename,
				path: path,
			}, request).then((res) => {
				this.send(reply, res);
			}).catch((err: ApiError) => {
				this.send(reply, err.httpStatusCode ? err.httpStatusCode : err.kind === 'client' ? 400 : 500, err);
			});

			if (user) {
				this.logIp(request, user);
			}
		}).catch(err => {
			if (err instanceof AuthenticationError) {
				this.send(reply, 403, new ApiError({
					message: 'Authentication failed. Please ensure your token is correct.',
					code: 'AUTHENTICATION_FAILED',
					id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
				}));
			} else {
				this.send(reply, 500, new ApiError());
			}
		});
	}

	@bindThis
	private send(reply: FastifyReply, x?: any, y?: ApiError) {
		if (x == null) {
			reply.code(204);
			reply.send();
		} else if (typeof x === 'number' && y) {
			reply.code(x);
			reply.send({
				error: {
					message: y!.message,
					code: y!.code,
					id: y!.id,
					kind: y!.kind,
					...(y!.info ? { info: y!.info } : {}),
				},
			});
		} else {
			// 文字列を返す場合は、JSON.stringify通さないとJSONと認識されない
			reply.send(typeof x === 'string' ? JSON.stringify(x) : x);
		}
	}

	@bindThis
	private async logIp(request: FastifyRequest, user: ILocalUser) {
		const meta = await this.metaService.fetch();
		if (!meta.enableIpLogging) return;
		const ip = request.ip;
		const ips = this.userIpHistories.get(user.id);
		if (ips == null || !ips.has(ip)) {
			if (ips == null) {
				this.userIpHistories.set(user.id, new Set([ip]));
			} else {
				ips.add(ip);
			}

			try {
				this.userIpsRepository.createQueryBuilder().insert().values({
					createdAt: new Date(),
					userId: user.id,
					ip: ip,
				}).orIgnore(true).execute();
			} catch {
			}
		}
	}

	@bindThis
	private async call(
		ep: IEndpoint & { exec: any },
		user: CacheableLocalUser | null | undefined,
		token: AccessToken | null | undefined,
		data: any,
		file: {
			name: string;
			path: string;
		} | null,
		request: FastifyRequest<{ Body: Record<string, unknown> | undefined, Querystring: Record<string, unknown> }>,
	) {
		const isSecure = user != null && token == null;
		const isModerator = user != null && (user.isModerator || user.isAdmin);

		if (ep.meta.secure && !isSecure) {
			throw new ApiError(accessDenied);
		}

		if (ep.meta.limit) {
		// koa will automatically load the `X-Forwarded-For` header if `proxy: true` is configured in the app.
			let limitActor: string;
			if (user) {
				limitActor = user.id;
			} else {
				limitActor = getIpHash(request.ip);
			}

			const limit = Object.assign({}, ep.meta.limit);

			if (!limit.key) {
				limit.key = ep.name;
			}

			// Rate limit
			await this.rateLimiterService.limit(limit as IEndpointMeta['limit'] & { key: NonNullable<string> }, limitActor).catch(err => {
				throw new ApiError({
					message: 'Rate limit exceeded. Please try again later.',
					code: 'RATE_LIMIT_EXCEEDED',
					id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
					httpStatusCode: 429,
				});
			});
		}

		if (ep.meta.requireCredential && user == null) {
			throw new ApiError({
				message: 'Credential required.',
				code: 'CREDENTIAL_REQUIRED',
				id: '1384574d-a912-4b81-8601-c7b1c4085df1',
				httpStatusCode: 401,
			});
		}

		if (ep.meta.requireCredential && user!.isSuspended) {
			throw new ApiError({
				message: 'Your account has been suspended.',
				code: 'YOUR_ACCOUNT_SUSPENDED',
				id: 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370',
				httpStatusCode: 403,
			});
		}

		if (ep.meta.requireAdmin && !user!.isAdmin) {
			throw new ApiError(accessDenied, { reason: 'You are not the admin.' });
		}

		if (ep.meta.requireModerator && !isModerator) {
			throw new ApiError(accessDenied, { reason: 'You are not a moderator.' });
		}

		if (token && ep.meta.kind && !token.permission.some(p => p === ep.meta.kind)) {
			throw new ApiError({
				message: 'Your app does not have the necessary permissions to use this endpoint.',
				code: 'PERMISSION_DENIED',
				id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838',
			});
		}

		// Cast non JSON input
		if ((ep.meta.requireFile || request.method === 'GET') && ep.params.properties) {
			for (const k of Object.keys(ep.params.properties)) {
				const param = ep.params.properties![k];
				if (['boolean', 'number', 'integer'].includes(param.type ?? '') && typeof data[k] === 'string') {
					try {
						data[k] = JSON.parse(data[k]);
					} catch (e) {
						throw	new ApiError({
							message: 'Invalid param.',
							code: 'INVALID_PARAM',
							id: '0b5f1631-7c1a-41a6-b399-cce335f34d85',
						}, {
							param: k,
							reason: `cannot cast to ${param.type}`,
						});
					}
				}
			}
		}

		// API invoking
		const before = performance.now();
		return await ep.exec(data, user, token, file, request.ip, request.headers).catch((err: Error) => {
			if (err instanceof ApiError) {
				throw err;
			} else {
				this.logger.error(`Internal error occurred in ${ep.name}: ${err.message}`, {
					ep: ep.name,
					ps: data,
					e: {
						message: err.message,
						code: err.name,
						stack: err.stack,
					},
				});
				console.error(err);
				throw new ApiError(null, {
					e: {
						message: err.message,
						code: err.name,
						stack: err.stack,
					},
				});
			}
		}).finally(() => {
			const after = performance.now();
			const time = after - before;
			if (time > 1000) {
				this.logger.warn(`SLOW API CALL DETECTED: ${ep.name} (${time}ms)`);
			}
		});
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		clearInterval(this.userIpHistoriesClearIntervalId);
	}
}
