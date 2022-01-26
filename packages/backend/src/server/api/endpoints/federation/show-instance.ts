import $ from 'cafy';
import define from '../../define';
import { Instances } from '@/models/index';
import { toPuny } from '@/misc/convert-host';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		host: {
			validator: $.str,
		},
	},

	res: {
		type: 'object',
		optional: true, nullable: false,
		ref: 'FederationInstance',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const instance = await Instances
		.findOne({ host: toPuny(ps.host) });

	return instance;
});
