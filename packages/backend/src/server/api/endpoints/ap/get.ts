import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import Resolver from '@/services/remote/activitypub/resolver.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			const resolver = new Resolver();
			const object = await resolver.resolve(ps.uri);
			return object;
		});
	}
}
