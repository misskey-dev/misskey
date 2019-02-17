import $ from 'cafy';
import define from '../../../define';
import Instance from '../../../../../models/instance';

export const meta = {
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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const instance = await Instance.findOne({ host: ps.host });

	if (instance == null) {
		return rej('instance not found');
	}

	Instance.update({ host: ps.host }, {
		$set: {
			isBlocked: ps.isBlocked,
			isMarkedAsClosed: ps.isClosed
		}
	});

	res();
}));
