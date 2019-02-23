import $ from 'cafy';
import define from '../../../define';
import Instance from '../../../../../models/instance';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		},

		isBlocked: {
			validator: $.bool
		},

		isClosed: {
			validator: $.bool
		},
	}
};

export default define(meta, async (ps, me) => {
	const instance = await Instance.findOne({ host: ps.host });

	if (instance == null) {
		throw new Error('instance not found');
	}

	Instance.update({ host: ps.host }, {
		$set: {
			isBlocked: ps.isBlocked,
			isMarkedAsClosed: ps.isClosed
		}
	});

	return;
});
