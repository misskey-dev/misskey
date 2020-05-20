import define from '../../../define';
import { listRelay } from '../../../../../services/relay';

export const meta = {
	desc: {
		'ja-JP': 'List relay'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true as const,

	params: {
	},
};

export default define(meta, async (ps, user) => {
	return await listRelay();
});
