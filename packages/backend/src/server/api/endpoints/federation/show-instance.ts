import define from '../../define';
import { Instances } from '@/models/index';
import { toPuny } from '@/misc/convert-host';

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

const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
	},
	required: ['host'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const instance = await Instances
		.findOne({ host: toPuny(ps.host) });

	return instance ? await Instances.pack(instance) : null;
});
