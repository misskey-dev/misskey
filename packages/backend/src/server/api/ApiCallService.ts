/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as stream from 'node:stream/promises';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import type Logger from '@/logger.js';
import type { MiMeta, UserIpsRepository } from '@/models/_.js';
import { createTemp } from '@/misc/create-temp.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import type { Config } from '@/config.js';
import { ApiError } from './error.js';
import { RateLimiterService } from './RateLimiterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import { AuthenticateService, AuthenticationError } from './AuthenticateService.js';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { IEndpointMeta, IEndpoint } from './endpoints.js';
import { headersToObject } from './ApiServerTypes.js';
import type { ApiContext, ApiMultipartData } from './ApiServerTypes.js';

const accessDenied = {
	message: 'Access denied.',
	code: 'ACCESS_DENIED',
	id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
};

@Injectable()
export class ApiCallService implements OnApplicationShutdown {
	private logger: Logger;
	private userIpHistories: Map<MiUser['id'], Set<string>>;
	private userIpHistoriesClearIntervalId: NodeJS.Timeout;
	private Sentry: typeof import('@sentry/node') | null = null;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,

		private authenticateService: AuthenticateService,
		private rateLimiterService: RateLimiterService,
		private roleService: RoleService,
		private apiLoggerService: ApiLoggerService,
	) {
		this.logger = this.apiLoggerService.logger;
		this.userIpHistories = new Map<MiUser['id'], Set<string>>();

		this.userIpHistoriesClearIntervalId = setInterval(() => {
			this.userIpHistories.clear();
		}, 1000 * 60 * 60);

		if (this.config.sentryForBackend) {
			import('@sentry/node').then((Sentry) => {
				this.Sentry = Sentry;
			});
		}
	}

	#sendApiError(ctx: ApiContext, err: ApiError): Response {
		let statusCode = err.httpStatusCode;
		if (err.httpStatusCode === 401) {
			ctx.header('WWW-Authenticate', 'Bearer realm="Misskey"');
		} else if (err.code === 'RATE_LIMIT_EXCEEDED') {
			const info: unknown = err.info;
			const unixEpochInSeconds = Date.now();
			if (typeof(info) === 'object' && info && 'resetMs' in info && typeof(info.resetMs) === 'number') {
				const cooldownInSeconds = Math.ceil((info.resetMs - unixEpochInSeconds) / 1000);
				// もしかするとマイナスになる可能性がなくはないのでマイナスだったら0にしておく
				ctx.header('Retry-After', Math.max(cooldownInSeconds, 0).toString(10));
			} else {
				this.logger.warn(`rate limit information has unexpected type ${typeof(err.info?.reset)}`);
			}
		} else if (err.kind === 'client') {
			ctx.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_request", error_description="${err.message}"`);
			statusCode = statusCode ?? 400;
		} else if (err.kind === 'permission') {
			// (ROLE_PERMISSION_DENIEDは関係ない)
			if (err.code === 'PERMISSION_DENIED') {
				ctx.header('WWW-Authenticate', `Bearer realm="Misskey", error="insufficient_scope", error_description="${err.message}"`);
			}
			statusCode = statusCode ?? 403;
		} else if (!statusCode) {
			statusCode = 500;
		}
		return this.send(ctx, statusCode, err);
	}

	#sendAuthenticationError(ctx: ApiContext, err: unknown): Response {
		if (err instanceof AuthenticationError) {
			const message = 'Authentication failed. Please ensure your token is correct.';
			ctx.header('WWW-Authenticate', `Bearer realm="Misskey", error="invalid_token", error_description="${message}"`);
			return this.send(ctx, 401, new ApiError({
				message: 'Authentication failed. Please ensure your token is correct.',
				code: 'AUTHENTICATION_FAILED',
				id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
			}));
		} else {
			return this.send(ctx, 500, new ApiError());
		}
	}

	#onExecError(ep: IEndpoint, data: any, err: Error, userId?: MiUser['id']): void {
		if (err instanceof ApiError || err instanceof AuthenticationError) {
			throw err;
		} else {
			const errId = randomUUID();
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

			if (this.Sentry != null) {
				this.Sentry.captureMessage(`Internal error occurred in ${ep.name}: ${err.message}`, {
					level: 'error',
					user: {
						id: userId,
					},
					extra: {
						ep: ep.name,
						ps: data,
						e: {
							message: err.message,
							code: err.name,
							stack: err.stack,
							id: errId,
						},
					},
				});
			}

			throw new ApiError(null, {
				e: {
					message: err.message,
					code: err.name,
					id: errId,
				},
			});
		}
	}

	@bindThis
	public async handleRequest(
		endpoint: IEndpoint & { exec: any },
		ctx: ApiContext,
		bodyData?: Record<string, unknown>,
	): Promise<Response> {
		const request = ctx.req.raw;
		const body = request.method === 'GET'
			? ctx.req.query()
			: bodyData;

		// https://datatracker.ietf.org/doc/html/rfc6750.html#section-2.1 (case sensitive)
		const authorization = request.headers.get('authorization');
		const token = authorization?.startsWith('Bearer ')
			? authorization.slice(7)
			: body?.['i'];
		if (token != null && typeof token !== 'string') {
			return ctx.body(null, 400);
		}

		try {
			const [user, app] = await this.authenticateService.authenticate(token);
			const res = await this.call(endpoint, user, app, body, null, request, ctx.var.ip);
			if (request.method === 'GET' && endpoint.meta.cacheSec && !token && !user) {
				ctx.header('Cache-Control', `public, max-age=${endpoint.meta.cacheSec}`);
			}
			if (user) {
				this.logIp(ctx.var.ip, user);
			}
			return this.send(ctx, res);
		} catch (err) {
			if (err instanceof ApiError) {
				return this.#sendApiError(ctx, err);
			}

			return this.#sendAuthenticationError(ctx, err);
		}
	}

	@bindThis
	public async handleMultipartRequest(
		endpoint: IEndpoint & { exec: any },
		ctx: ApiContext,
		multipartData: ApiMultipartData | null,
	): Promise<Response> {
		if (multipartData == null) {
			return ctx.body(null, 400);
		}

		const [path, cleanup] = await createTemp();
		await stream.pipeline(multipartData.file, fs.createWriteStream(path));

		if (multipartData.truncated) {
			cleanup();
			return ctx.body(null, 413);
		}

		const fields = {} as Record<string, unknown>;
		for (const [k, v] of Object.entries(multipartData.fields)) {
			fields[k] = v;
		}

		// https://datatracker.ietf.org/doc/html/rfc6750.html#section-2.1 (case sensitive)
		const authorization = ctx.req.raw.headers.get('authorization');
		const token = authorization?.startsWith('Bearer ')
			? authorization.slice(7)
			: fields['i'];
		if (token != null && typeof token !== 'string') {
			return ctx.body(null, 400);
		}

		try {
			const [user, app] = await this.authenticateService.authenticate(token);
			const res = await this.call(endpoint, user, app, fields, {
				name: multipartData.filename,
				path: path,
			}, ctx.req.raw, ctx.var.ip);
			if (user) {
				this.logIp(ctx.var.ip, user);
			}

			return this.send(ctx, res);
		} catch (err) {
			cleanup();
			if (err instanceof ApiError) {
				return this.#sendApiError(ctx, err);
			}

			return this.#sendAuthenticationError(ctx, err);
		}
	}

	@bindThis
	private send(ctx: ApiContext, x?: any, y?: ApiError): Response {
		if (x instanceof Response) {
			return x;
		}

		if (x == null) {
			return ctx.body(null, 204);
		} else if (typeof x === 'number' && y) {
			return ctx.json({
				error: {
					message: y!.message,
					code: y!.code,
					id: y!.id,
					kind: y!.kind,
					...(y!.info ? { info: y!.info } : {}),
				},
			}, x as never);
		} else {
			// 文字列を返す場合は、JSON.stringify通さないとJSONと認識されない
			if (typeof x === 'string') {
				ctx.header('Content-Type', 'application/json');
				return ctx.body(JSON.stringify(x));
			}

			return ctx.json(x);
		}
	}

	@bindThis
	private logIp(ip: string, user: MiLocalUser) {
		if (!this.meta.enableIpLogging) return;
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
		user: MiLocalUser | null | undefined,
		token: MiAccessToken | null | undefined,
		data: any,
		file: {
			name: string;
			path: string;
		} | null,
		request: Request,
		ip: string,
	) {
		const isSecure = user != null && token == null;

		if (ep.meta.secure && !isSecure) {
			throw new ApiError(accessDenied);
		}

		if (ep.meta.limit) {
			let limitActor: string | null = null;
			if (user) {
				limitActor = user.id;
			} else if (this.config.enableIpRateLimit) {
				if (process.env.NODE_ENV === 'production' && (ip === '::1' || ip === '127.0.0.1')) {
					this.logger.warn('Recieved API request from localhost IP address for rate limiting in production environment. This is likely due to an improper trustProxy setting in the config file.');
				}

				limitActor = getIpHash(ip);
			}

			const limit = Object.assign({}, ep.meta.limit);

			if (limit.key == null) {
				(limit as any).key = ep.name;
			}

			// TODO: 毎リクエスト計算するのもあれだしキャッシュしたい
			const factor = user ? (await this.roleService.getUserPolicies(user.id)).rateLimitFactor : 1;

			if (limitActor != null && factor > 0) {
				// Rate limit
				const rateLimit = await this.rateLimiterService.limit(limit as IEndpointMeta['limit'] & { key: NonNullable<string> }, limitActor, factor);
				if (rateLimit != null) {
					throw new ApiError({
						message: 'Rate limit exceeded. Please try again later.',
						code: 'RATE_LIMIT_EXCEEDED',
						id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef',
						httpStatusCode: 429,
					}, rateLimit.info);
				}
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
					kind: 'permission',
					id: 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370',
				});
			}
		}

		if (ep.meta.prohibitMoved) {
			if (user?.movedToUri) {
				throw new ApiError({
					message: 'You have moved your account.',
					code: 'YOUR_ACCOUNT_MOVED',
					kind: 'permission',
					id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31',
				});
			}
		}

		if ((ep.meta.requireModerator || ep.meta.requireAdmin) && (this.meta.rootUserId !== user!.id)) {
			const myRoles = await this.roleService.getUserRoles(user!.id);
			if (ep.meta.requireModerator && !myRoles.some(r => r.isModerator || r.isAdministrator)) {
				throw new ApiError({
					message: 'You are not assigned to a moderator role.',
					code: 'ROLE_PERMISSION_DENIED',
					kind: 'permission',
					id: 'd33d5333-db36-423d-a8f9-1a2b9549da41',
				});
			}
			if (ep.meta.requireAdmin && !myRoles.some(r => r.isAdministrator)) {
				throw new ApiError({
					message: 'You are not assigned to an administrator role.',
					code: 'ROLE_PERMISSION_DENIED',
					kind: 'permission',
					id: 'c3d38592-54c0-429d-be96-5636b0431a61',
				});
			}
		}

		if (ep.meta.requiredRolePolicy != null && (this.meta.rootUserId !== user!.id)) {
			const myRoles = await this.roleService.getUserRoles(user!.id);
			const policies = await this.roleService.getUserPolicies(user!.id);
			if (!policies[ep.meta.requiredRolePolicy] && !myRoles.some(r => r.isAdministrator)) {
				throw new ApiError({
					message: 'You are not assigned to a required role.',
					code: 'ROLE_PERMISSION_DENIED',
					kind: 'permission',
					id: '7f86f06f-7e15-4057-8561-f4b6d4ac755a',
				});
			}
		}

		if (token && ((ep.meta.kind && !token.permission.some(p => p === ep.meta.kind))
			|| (!ep.meta.kind && (ep.meta.requireCredential || ep.meta.requireModerator || ep.meta.requireAdmin)))) {
			throw new ApiError({
				message: 'Your app does not have the necessary permissions to use this endpoint.',
				code: 'PERMISSION_DENIED',
				kind: 'permission',
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
					} catch (_) {
						throw new ApiError({
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
		if (this.Sentry != null) {
			return await this.Sentry.startSpan({
				name: 'API: ' + ep.name,
			}, () => ep.exec(data, user, token, file, ip, headersToObject(request.headers))
				.catch((err: Error) => this.#onExecError(ep, data, err, user?.id)));
		} else {
			return await ep.exec(data, user, token, file, ip, headersToObject(request.headers))
				.catch((err: Error) => this.#onExecError(ep, data, err, user?.id));
		}
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.userIpHistoriesClearIntervalId);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
