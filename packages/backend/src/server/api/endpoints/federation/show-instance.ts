import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Instances } from '@/models/index.js';
import { toPuny } from '@/misc/convert-host.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: {
		oneOf: [{
			type: 'object',
			ref: 'FederationInstance',
		}, {
			type: 'null',
		}],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
	},
	required: ['host'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await Instances
		.findOneBy({ host: toPuny(ps.host) });

			return instance ? await Instances.pack(instance) : null;
		});
	}
}
