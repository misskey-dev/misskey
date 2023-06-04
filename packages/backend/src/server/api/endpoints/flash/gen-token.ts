import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { CacheService } from '@/core/CacheService.js';

export const meta = {
	tags: ['flash'],

	requireCredential: true,

	prohibitMoved: true,

	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			token: { type: 'string' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		permissions: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['permissions'],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor (
		private cacheService: CacheService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = secureRndstr(32, true);
			await this.cacheService.flashAccessTokensCache.set(token, {
				user: me,
				permissions: ps.permissions,
			});
			return {
				token,
			};
		});
	}
}
