import $ from 'cafy';
import define from '../../../define.js';
import { Instances } from '@/models/index.js';
import { toPuny } from '@/misc/convert-host.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		},

		isSuspended: {
			validator: $.bool
		},
	}
};

export default define(meta, async (ps, me) => {
	const instance = await Instances.findOne({ host: toPuny(ps.host) });

	if (instance == null) {
		throw new Error('instance not found');
	}

	Instances.update({ host: toPuny(ps.host) }, {
		isSuspended: ps.isSuspended
	});
});
