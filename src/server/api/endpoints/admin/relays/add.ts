import $ from 'cafy';
import define from '../../../define';
import { addRelay } from '../../../../../services/relay';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': 'Add relay'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true as const,

	params: {
		inbox: {
			validator: $.str
		},
	},

	errors: {
		invalidUrl: {
			message: 'Invalid URL',
			code: 'INVALID_URL',
			id: 'fb8c92d3-d4e5-44e7-b3d4-800d5cef8b2c'
		},
	}
};

export default define(meta, async (ps, user) => {
	try {
		if (new URL(ps.inbox).protocol !== 'https:') throw 'https only';
	} catch {
		throw new ApiError(meta.errors.invalidUrl);
	}

	return await addRelay(ps.inbox);
});
