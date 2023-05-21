import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import endpoints from 'misskey-js/built/endpoints';

export const meta = {
	requireCredential: false,

	tags: ['meta'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
	},
	required: ['endpoint'],
} as const;

// !!!!!!!!!!!!!!!!!!!!!!!!WIP!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!WIP!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!WIP!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!WIP!!!!!!!!!!!!!!!!!!!!!!!!!!!

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'endpoint'> {
	name = 'endpoint' as const;
	constructor(
	) {
		super(async (ps) => {
			const ep = endpoints[ps.endpoint];
			if (ep == null) return null;
			return {
				params: Object.entries(ep.defines[0]['req']['properties'] ?? {}).map(([k, v]) => ({
					name: k,
					type: v.type ? v.type.charAt(0).toUpperCase() + v.type.slice(1) : 'string',
				})),
			};
		});
	}
}
