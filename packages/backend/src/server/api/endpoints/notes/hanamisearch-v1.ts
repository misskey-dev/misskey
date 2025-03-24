import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HanamiSearchService } from '@/core/hanamisearch/HanamiSearchService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,
	requiredRolePolicy: 'canSearchWithHanamiSearchV1',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		unavailable: {
			message: 'Search of notes unavailable.',
			code: 'UNAVAILABLE',
			id: '0b44998d-77aa-4427-80d0-d2c9b8523011',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		host: {
			type: 'string',
			description: 'The local host is represented with `.`.',
		},
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		channelId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		onlyWithFiles: { type: 'boolean', default: false },
	},
	required: ['query'],
} as const;

// TODO: ロジックをサービスに切り出す

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private hanamiSearchService: HanamiSearchService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.hanamiSearchService.searchNote(ps.query, me, {
				userId: ps.userId,
				channelId: ps.channelId,
				host: ps.host,
				preferredMethod: 'hanamisearchv1',
				onlyWithFiles: ps.onlyWithFiles,
			}, {
				untilId: ps.untilId,
				sinceId: ps.sinceId,
				limit: ps.limit,
			});
		});
	}
}
