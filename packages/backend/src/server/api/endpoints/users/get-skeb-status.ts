import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LoggerService } from '@/core/LoggerService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { Config } from '@/config.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 5,

	res: {
		type: 'object',
		properties: {
			screenName: {
				type: 'string',
				optional: false, nullable: false,
			},
			isCreator: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isAcceptable: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			creatorRequestCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			clientRequestCount: {
				type: 'integer',
				optional: false, nullable: false,
			},
			skills: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					properties: {
						amount: {
							type: 'integer',
							optional: false, nullable: false,
						},
						genre: {
							type: 'string',
							optional: false, nullable: false,
							enum: ['art', 'comic', 'voice', 'novel', 'video', 'music', 'correction'],
						},
					},
				},
			},
		},
	},

	errors: {
		skebStatusNotAvailable: {
			message: 'Skeb status is not available.',
			code: 'SKEB_STATUS_NOT_AVAILABLE',
			id: '1dd37c9c-7e97-4c24-be98-227a78b21d80',
			httpStatusCode: 403,
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '88d582ae-69d9-45e0-a8b3-13f9945e48bf',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		private loggerService: LoggerService,
		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps) => {
			if (!this.config.skebStatus) throw new ApiError(meta.errors.skebStatusNotAvailable);
			const logger = this.loggerService.getLogger('api:users:get-skeb-status');

			const url = new URL(this.config.skebStatus.endpoint);
			for (const [key, value] of Object.entries(this.config.skebStatus.parameters)) {
				url.searchParams.set(key, value);
			}
			url.searchParams.set(this.config.skebStatus.userIdParameterName, ps.userId);

			logger.info('Requesting Skeb status', { url: url.href, userId: ps.userId });
			const res = await this.httpRequestService.send(
				url.href,
				{
					method: this.config.skebStatus.method,
					headers: {
						...this.config.skebStatus.headers,
						Accept: 'application/json',
					},
					timeout: 5000,
				},
				{
					throwErrorWhenResponseNotOk: false,
				},
			);

			const json = (await res.json()) as {
				screen_name: string,
				is_creator: boolean,
				is_acceptable: boolean,
				creator_request_count: number,
				client_request_count: number,
				skills: { amount: number, genre: 'art' | 'comic' | 'voice' | 'novel' | 'video' | 'music' | 'correction' }[],
				ban_reason?: string | null
				error?: unknown,
			};

			if (res.status > 399 || (json.error ?? json.ban_reason)) {
				logger.error('Skeb status response error', { url: url.href, userId: ps.userId, status: res.status, statusText: res.statusText, error: json.error ?? json.ban_reason });
				throw new ApiError(meta.errors.noSuchUser);
			}

			logger.info('Skeb status response', { url: url.href, userId: ps.userId, status: res.status, statusText: res.statusText, skebStatus: json });

			return {
				screenName: json.screen_name,
				isCreator: json.is_creator,
				isAcceptable: json.is_acceptable,
				creatorRequestCount: json.creator_request_count,
				clientRequestCount: json.client_request_count,
				skills: json.skills,
			};
		});
	}
}
