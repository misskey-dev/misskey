import $ from 'cafy';
import define from '../../../define';
import { Instances } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		},

		isClosed: {
			validator: $.bool
		},
	}
};

export default define(meta, async (ps, me) => {
	const instance = await Instances.findOne({ host: ps.host });

	if (instance == null) {
		throw new Error('instance not found');
	}

	Instances.update({ host: ps.host }, {
		isMarkedAsClosed: ps.isClosed
	});
});
