import { endpoints } from '@/boot/EndpointsModule.js';
import { Inject, Injectable } from '@/di-decorators.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps) => {
			const ep = endpoints.find(x => x.name === ps.endpoint);
			if (ep == null) return null;
			return {
				params: Object.entries(ep.params.properties ?? {}).map(([k, v]) => ({
					name: k,
					type: v.type.charAt(0).toUpperCase() + v.type.slice(1),
				})),
			};
		});
	}
}
