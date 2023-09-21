import { pipeline } from 'node:stream';
import * as fs from 'node:fs';
import { promisify } from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DI } from '@/di-symbols.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import type { LocalUser, User } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import type Logger from '@/logger.js';
import type { UserIpsRepository } from '@/models/index.js';
import { MetaService } from '@/core/MetaService.js';
import { createTemp } from '@/misc/create-temp.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
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
		private roleService: RoleService,
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
				this.send(reply, err.httpStatusCode ? err.httpStatusCode : err.kind === 'client' ? 400 : err.kind === 'permission' ? 403 : 500, err);
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
		const multipartData = await request.file().catch(() => {
			/* Fastify throws if the remote didn't send multipart data. Return 400 below. */
		});
		if (multipartData == null) {
			reply.code(400);
			reply.send();
			return;
		}

		const [path] = await createTemp();
		await pump(multipartData.file, fs.createWriteStream(path));

		const fields = {} as Record<string, unknown>;
		for (const [k, v] of Object.entries(multipartData.fields)) {
			fields[k] = typeof v === 'object' && 'value' in v ? v.value : undefined;
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
				this.send(reply, err.httpStatusCode ? err.httpStatusCode : err.kind === 'client' ? 400 : err.kind === 'permission' ? 403 : 500, err);
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
	private async logIp(request: FastifyRequest, user: LocalUser) {
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
		user: LocalUser | null | undefined,
		token: AccessToken | null | undefined,
		data: any,
		file: {
			name: string;
			path: string;
		} | null,
		request: FastifyRequest<{ Body: Record<string, unknown> | undefined, Querystring: Record<string, unknown> }>,
	) {
		const isSecure = user != null && token == null;

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

			if (limit.key == null) {
				(limit as any).key = ep.name;
			}

			// TODO: 毎リクエスト計算するのもあれだしキャッシュしたい
			const factor = user ? (await this.roleService.getUserPolicies(user.id)).rateLimitFactor : 1;

			if (factor > 0) {
				// Rate limit
				await this.rateLimiterService.limit(limit as IEndpointMeta['limit'] & { key: NonNullable<string> }, limitActor, factor).catch(err => {
					throw new ApiError({
						message: 'Rate limit exceeded. Please try again later.',
						code: 'RATE_LIMIT_EXCEEDED',
						id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
						httpStatusCode: 429,
					});
				});
			}
		}

		if (ep.meta.requireCredential || ep.meta.requireModerator || ep.meta.requireAdmin) {
			if (user == null) {
				throw new ApiError({
					message: 'Credential required.',
					code: 'CREDENTIAL_REQUIRED',
					id: '1384574d-a912-4b81-8601-c7b1c4085df1',
					httpStatusCode: 401,
				});
			} else if (user!.isSuspended) {
				throw new ApiError({
					message: 'Your account has been suspended.',
					code: 'YOUR_ACCOUNT_SUSPENDED',
					id: 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370',
					httpStatusCode: 403,
				});
			}
		}

		if ((ep.meta.requireModerator || ep.meta.requireAdmin) && !user!.isRoot) {
			const myRoles = await this.roleService.getUserRoles(user!.id);
			if (ep.meta.requireModerator && !myRoles.some(r => r.isModerator || r.isAdministrator)) {
				throw new ApiError({
					message: 'You are not assigned to a moderator role.',
					code: 'ROLE_PERMISSION_DENIED',
					id: 'd33d5333-db36-423d-a8f9-1a2b9549da41',
				});
			}
			if (ep.meta.requireAdmin && !myRoles.some(r => r.isAdministrator)) {
				throw new ApiError({
					message: 'You are not assigned to an administrator role.',
					code: 'ROLE_PERMISSION_DENIED',
					id: 'c3d38592-54c0-429d-be96-5636b0431a61',
				});
			}
		}

		if (ep.meta.requireRolePolicy != null && !user!.isRoot) {
			const policies = await this.roleService.getUserPolicies(user!.id);
			if (!policies[ep.meta.requireRolePolicy]) {
				throw new ApiError({
					message: 'You are not assigned to a required role.',
					code: 'ROLE_PERMISSION_DENIED',
					id: '7f86f06f-7e15-4057-8561-f4b6d4ac755a',
				});
			}
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
		return await ep.exec(data, user, token, file, request.ip, request.headers).catch((err: Error) => {
			if (err instanceof ApiError || err instanceof AuthenticationError) {
				throw err;
			} else {
				const errId = uuid();
				this.logger.error(`Internal error occurred in ${ep.name}: ${err.message}`, {
					ep: ep.name,
					ps: data,
					e: {
						message: err.message,
						code: err.name,
						stack: err.stack,
						id: errId,
					},
				});
				console.error(err, errId);
				throw new ApiError(null, {
					e: {
						message: err.message,
						code: err.name,
						id: errId,
					},
				});
			}
		});
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		clearInterval(this.userIpHistoriesClearIntervalId);
	}
}
